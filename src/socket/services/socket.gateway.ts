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
import { WebSocketAuthGuard } from 'src/shared-kernel/guards/websocket-auth.guard';
import { ConnectionService } from './socket-connection.service';
import { EventSubscriptionService } from './event-subscription.service';
import { EventPublishingService } from './event-publishing.service';
import { ChannelService } from './channel-subscription.service';

@WebSocketGateway({ cors: true })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly channelService: ChannelService,
    private readonly connectionService: ConnectionService,
    private readonly eventPublishingService: EventPublishingService,
    private readonly eventSubscriptionService: EventSubscriptionService,
  ) {}

  public afterInit(server: Server): void {
    this.logger.log('WebSocket server initialized');
    server.use(WebSocketAuthGuard());
  }

  public async handleConnection(client: Socket): Promise<void> {
    await Promise.all([
      this.connectionService.handleConnection(client, this.server),
      this.connectionService.handleConnection(client, this.server),
    ]);
  }

  public async handleDisconnect(client: Socket): Promise<void> {
    this.connectionService.handleDisconnect(client);
  }

  @SubscribeMessage('subscribe')
  public handleEventSubscription(client: Socket, message: any): void {
    this.eventSubscriptionService.handleSubscription(client, message);
  }

  @SubscribeMessage('unsubscribe')
  public handleEventUnSubscription(client: Socket, message: any): void {
    this.eventSubscriptionService.handleUnSubscription(client, message);
  }

  @SubscribeMessage('publish')
  public async handlePublishEvent(client: Socket, message: any): Promise<void> {
    await this.eventPublishingService.handlePublishEvent(
      client,
      message,
      this.server,
    );
  }

  @SubscribeMessage('subscribeToChannel')
  public handleSubscribe(client: Socket, data: { channelId: string }) {
    this.channelService.handleSubscribe(client, data);
  }
}
