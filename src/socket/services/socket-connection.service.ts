import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { config } from 'src/config';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);
  private readonly activeClients = new Map<
    string,
    { socket: Socket; timeout: NodeJS.Timeout }
  >();

  public async handleConnection(client: Socket, server: Server): Promise<void> {
    server;
    this.logger.log(`Attempting to connect client: ${client.id}`);

    if (this.activeClients.size >= config.CLIENT_MAX_CONNECTIONS) {
      this.disconnectClient(
        client,
        'connection-error',
        'Connection limit exceeded.',
      );
      return;
    }

    this.activeClients.set(client.id, {
      socket: client,
      timeout: this.resetInactivityTimeout(client),
    });

    this.logger.log(`Client connected: ${client.id}`);
  }

  public handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeClient(client);
  }

  private resetInactivityTimeout(client: Socket): NodeJS.Timeout {
    const existing = this.activeClients.get(client.id);
    if (existing?.timeout) clearTimeout(existing.timeout);

    const timeout = setTimeout(() => {
      this.disconnectClient(
        client,
        'connection-inactive',
        'Inactivity timeout',
      );
    }, config.CLIENT_INACTIVITY_TIMEOUT_MS);

    if (existing) existing.timeout = timeout;
    return timeout;
  }

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

  private removeClient(client: Socket): void {
    if (this.activeClients.has(client.id)) {
      clearTimeout(this.activeClients.get(client.id).timeout);
      this.activeClients.delete(client.id);
    }
  }
}
