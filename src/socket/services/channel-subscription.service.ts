import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  private readonly channelSubscriptions = new Map<string, Set<string>>();

  public handleSubscribe(client: Socket, data: { channelId: string }): void {
    const { channelId } = data;
    if (!channelId) {
      client.emit('error', 'Channel ID is required');
      return;
    }

    if (!this.channelSubscriptions.has(channelId)) {
      this.channelSubscriptions.set(channelId, new Set());
    }

    this.channelSubscriptions.get(channelId).add(client.id);
    client.join(channelId);

    this.logger.log(`Client ${client.id} subscribed to channel: ${channelId}`);
    client.emit('subscription-success', `Subscribed to channel: ${channelId}`);
  }

  public handleUnsubscribe(client: Socket, data: { channelId: string }): void {
    const { channelId } = data;

    if (!channelId || !this.channelSubscriptions.has(channelId)) {
      client.emit('error', 'Invalid channel ID or not subscribed');
      return;
    }

    const clients = this.channelSubscriptions.get(channelId);

    if (clients) {
      clients.delete(client.id);

      if (clients.size === 0) {
        this.channelSubscriptions.delete(channelId);
      }
    }

    client.leave(channelId);
    client.emit(
      'unsubscription-success',
      `Unsubscribed from channel: ${channelId}`,
    );
    this.logger.log(
      `Client ${client.id} unsubscribed from channel: ${channelId}`,
    );
  }

  public broadcastToChannel(
    channelId: string,
    event: string,
    payload: any,
    server: any,
  ): void {
    if (!this.channelSubscriptions.has(channelId)) {
      this.logger.warn(`No subscribers found for channel: ${channelId}`);
      return;
    }

    const subscribedClients = this.channelSubscriptions.get(channelId);

    if (!subscribedClients || subscribedClients.size === 0) {
      this.logger.warn(
        `No clients are currently subscribed to channel: ${channelId}`,
      );
      return;
    }

    server.to(channelId).emit(event, payload);

    this.logger.log(`Broadcasted event '${event}' to channel: ${channelId}`);
  }
}
