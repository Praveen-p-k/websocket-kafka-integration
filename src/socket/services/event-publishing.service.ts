import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';

@Injectable()
export class EventPublishingService {
  private readonly logger = new Logger(EventPublishingService.name);

  constructor(private readonly kafkaProducerService: KafkaProducerService) {}

  public async handlePublishEvent(
    client: Socket,
    message: any,
    server: Server,
  ): Promise<void> {
    this.logger.log('Received publish message', message);

    const { eventData } = message;
    const { metadata } = eventData;
    const trackingId = metadata?.trackingId || 'generated-tracking-id';

    server.to(client.id).emit('trackingId', { trackingId, payload: eventData });

    this.logger.log(`Processing message for event: ${metadata.eventName}`);

    await this.kafkaProducerService.produceMessage({
      payload: eventData,
      trackingId,
    });
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
}
