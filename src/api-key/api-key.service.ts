import { Injectable, UnauthorizedException } from '@nestjs/common';
import { config } from 'src/config';

@Injectable()
export class ApiKeyService {
  private readonly validApiKeys: Set<string> = new Set([
    config.WEBSOCKET_EVENT_PUBSUB_KEY,
    config.WEBSOCKET_EVENT_SUBSCRIPTION_KEY,
  ]);

  public verifyPublishAccess(apiKey: string): void {
    if (config.WEBSOCKET_EVENT_PUBSUB_KEY !== apiKey) {
      throw new UnauthorizedException('Invalid API key for publishing events');
    }
  }

  public verifySubscriptionAccess(apiKey: string) {
    if (!this.validApiKeys.has(apiKey)) {
      throw new UnauthorizedException(
        'Invalid API key for subscribing to events',
      );
    }
  }
}
