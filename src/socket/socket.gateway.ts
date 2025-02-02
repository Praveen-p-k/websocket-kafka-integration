import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { config } from 'src/config';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { WebSocketAuthGuard } from 'src/shared-kernel/guards/websocket-auth.guard';
import { v4 as uuid } from 'uuid';
import { SupportedSources } from './socket.constants';
import { ApiKeyService } from 'src/api-key/api-key.service';
import { ChannelService } from './services/channel-subscription.service';
import { EventSubscriptionService } from './services/event-subscription.service';

@WebSocketGateway({ cors: true })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger: Logger = new Logger(SocketGateway.name);

  private readonly activeClients: Map<
    string,
    { socket: Socket; timeout: NodeJS.Timeout }
  > = new Map();

  private readonly clientSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly channelService: ChannelService,
    private readonly eventSubscriptionService: EventSubscriptionService,
  ) {}

  /**
   * Lifecycle Hook: After Gateway Initialization
   */
  afterInit(server: Server): void {
    this.logger.log('WebSocket server initialized');
    server.use(WebSocketAuthGuard());
    this.logger.log('WebSocketAuthGuard applied to server');
  }

  /**
   * Lifecycle Hook: Handle Client Connection
   */
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Attempting to connect client: ${client.id}`);

    if (this.activeClients.size >= config.CLIENT_MAX_CONNECTIONS) {
      this.disconnectClient(
        client,
        'connection-error',
        'Connection limit exceeded. Try again later.',
      );
      return;
    }

    this.activeClients.set(client.id, {
      socket: client,
      timeout: this.resetInactivityTimeout(client),
    });
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Lifecycle Hook: Handle Client Disconnection
   */
  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeClient(client);
  }

  /**
   * Handle "consumer-events" Message
   */
  @SubscribeMessage('consumer-events')
  async handleConsumerEvents(client: Socket, message: any): Promise<void> {
    this.logger.log(`Received 'consumer-events' from client: ${client.id}`);
    this.resetInactivityTimeout(client);

    const { metadata, payload } = message;
    this.logger.log(
      `Message received from Kafka Consumer with trackingId: ${metadata.trackingId}`,
    );

    this.publishEventByEventName(metadata.eventType, {
      trackingId: metadata.trackingId,
      payload,
    });
  }

  @SubscribeMessage('subscribe')
  handleEventSubscription(client: Socket, message: any): void {
    this.eventSubscriptionService.handleSubscription(client, message);
    this.resetInactivityTimeout(client);
  }

  /**
   * Handle Dynamic UnSubscription
   */
  @SubscribeMessage('unsubscribe')
  handleUnSubscription(client: Socket, message: any): void {
    this.eventSubscriptionService.handleUnSubscription(client, message);
    this.resetInactivityTimeout(client);
  }

  /**
   * Handle Publish Event
   */
  @SubscribeMessage('publish')
  async handlePublishEvent(client: Socket, message: any): Promise<void> {
    this.logger.log('Received message', message);

    const { eventData, apiKey } = message;
    const { sourceNumber, payload, metadata } = eventData;

    try {
      // Verify access and reset inactivity timeout
      this.apiKeyService.verifyPublishAccess(apiKey);
      this.resetInactivityTimeout(client);

      const trackingId = metadata?.trackingId || uuid();
      this.logger.log(
        `Quick respond with trackingId to client: ${client.id} - ${trackingId}`,
      );
      this.server
        .to(client.id)
        .emit('trackingId', { trackingId, payload: eventData });

      this.logger.log(`Processing message for source: ${sourceNumber}`);

      switch (sourceNumber) {
        case SupportedSources.RAG_AI:
        case SupportedSources.BPMS:
          // Send message to Kafka producer
          await this.kafkaProducerService.produceMessage({
            payload: eventData,
            trackingId,
          });
          this.logger.log(
            `Message sent to Kafka producer with trackingId: ${trackingId}`,
          );
          break;

        case SupportedSources.MAGIC_LINK:
          // Handle Magic Link messages
          this.logger.log(
            `Handling Magic Link payload: ${JSON.stringify(payload)}`,
          );
          this.publishEventByEventName(metadata.eventName, {
            payload,
            trackingId,
          });
          break;

        default:
          // Handle other sources
          (payload.records ?? []).forEach((record) => {
            this.publishEventByEventName(record.eventName, {
              payload,
              trackingId,
            });
          });
          break;
      }
    } catch (error) {
      this.logger.error(
        `Publishing failed for client ${client.id}: ${JSON.stringify(error)}`,
      );
      client.emit('error', 'Invalid API key or publishing failed');
    }
  }

  private publishEventByEventName(
    eventName: string,
    { payload, trackingId }: { payload: any; trackingId: string },
  ) {
    const subscribedClients = Array.from(this.clientSubscriptions.entries())
      .filter(([, events]) => events.has(eventName))
      .map(([clientId]) => clientId);

    if (subscribedClients.length > 0) {
      this.logger.log(
        `Publishing event: ${eventName} to ${subscribedClients.length} clients with trackingId: ${trackingId}`,
      );

      subscribedClients.forEach((clientId) => {
        const enrichedPayload = { ...payload, trackingId };

        try {
          this.server.to(clientId).emit(eventName, enrichedPayload);
          this.logger.log(
            `Event: ${eventName} sent to client: ${clientId} with trackingId: ${trackingId}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to emit event: ${eventName} to client: ${clientId}. Error: ${JSON.stringify(error)}`,
          );
        }
      });
    } else {
      this.logger.warn(`No clients are subscribed to event: ${eventName}`);
    }
  }

  @SubscribeMessage('subscribeToChannel')
  public handleSubscribeToChannel(client: Socket, data: { channelId: string }) {
    this.channelService.handleSubscribe(client, data);
  }

  @SubscribeMessage('unsubscribeToChannel')
  public handleUnsubscribeToChannel(
    client: Socket,
    data: { channelId: string },
  ) {
    this.channelService.handleUnsubscribe(client, data);
  }

  /**
   * Utility: Reset Client Inactivity Timeout
   */
  private resetInactivityTimeout(client: Socket): NodeJS.Timeout {
    const existing = this.activeClients.get(client.id);
    if (existing?.timeout) {
      clearTimeout(existing.timeout);
    }

    const timeout = setTimeout(() => {
      this.logger.log(`Client timed out due to inactivity: ${client.id}`);
      this.disconnectClient(
        client,
        'connection-inactive',
        'Inactivity timeout',
      );
    }, config.CLIENT_INACTIVITY_TIMEOUT_MS);

    if (existing) {
      existing.timeout = timeout;
    }

    return timeout;
  }

  /**
   * Utility: Disconnect Client
   */
  private disconnectClient(
    client: Socket,
    eventName: string,
    reason: string,
  ): void {
    this.logger.warn(`Disconnecting client: ${client.id}. Reason: ${reason}`);
    client.emit(eventName, reason);
    client.disconnect(true);
    this.removeClient(client);
  }

  /**
   * Utility: Remove Client from Active List
   */
  private removeClient(client: Socket): void {
    this.removeClientFromAllChannels(client);
    const activeClient = this.activeClients.get(client.id);
    if (activeClient?.timeout) {
      clearTimeout(activeClient.timeout);
    }

    this.activeClients.delete(client.id);
    this.clientSubscriptions.delete(client.id);
  }

  /**
   * Utility: Get or Initialize Client Subscriptions
   */
  private getClientSubscriptions(clientId: string): Set<string> {
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
    }
    return this.clientSubscriptions.get(clientId);
  }
}
