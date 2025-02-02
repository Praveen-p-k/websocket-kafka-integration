import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ApiKeyService } from 'src/api-key/api-key.service';

@Injectable()
export class EventSubscriptionService {
  private readonly logger = new Logger(EventSubscriptionService.name);
  private readonly clientSubscriptions = new Map<string, Set<string>>();

  constructor(private readonly apiKeyService: ApiKeyService) {}

  public handleSubscription(client: Socket, message: any): void {
    const { event, apiKey } = message;
    try {
      this.apiKeyService.verifySubscriptionAccess(apiKey);

      const subscriptions = this.getClientSubscriptions(client.id);
      subscriptions.add(event);

      this.logger.log(`Client ${client.id} subscribed to event: ${event}`);
      client.emit('subscription-success', `Subscribed to event: ${event}`);
    } catch (error) {
      this.logger.error(
        `Subscription failed for client ${client.id}: ${error}`,
      );
      client.emit('error', 'Invalid API key');
    }
  }

  public handleUnSubscription(client: Socket, message: any): void {
    const { event } = message;
    const subscriptions = this.getClientSubscriptions(client.id);

    if (subscriptions.has(event)) {
      subscriptions.delete(event);
      this.logger.log(`Client ${client.id} unsubscribed from event: ${event}`);
      client.emit(
        'un-subscription-success',
        `Unsubscribed from event: ${event}`,
      );
    } else {
      client.emit('error', `Not subscribed to event: ${event}`);
    }
  }

  private getClientSubscriptions(clientId: string): Set<string> {
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
    }
    return this.clientSubscriptions.get(clientId);
  }
}
