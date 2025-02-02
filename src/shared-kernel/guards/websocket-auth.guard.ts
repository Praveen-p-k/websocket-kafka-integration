import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { config } from 'src/config';
import { Logger } from '@nestjs/common';

type WebSocketAuthGuard = (socket: Socket, next: (err?: Error) => void) => void;

export const WebSocketAuthGuard = (): WebSocketAuthGuard => {
  return function async(socket: Socket, next) {
    const logger = new Logger(WebSocketAuthGuard.name);
    try {
      const bearerToken = socket.handshake?.headers?.authorization;

      if (!bearerToken) {
        throw new WsException('Authorization token is missing');
      }

      if (!bearerToken.startsWith('Bearer ')) {
        throw next(new WsException('Invalid token format'));
      }

      const token = bearerToken.split(' ')[1];

      if (token !== config.WEBSOCKET_API_KEY) {
        logger.error(
          `Client ID: ${socket.id}. Authorization failed: Invalid token provided.`,
        );

        throw next(new WsException('Unauthorized'));
      }

      next();
    } catch (error) {
      next(new WsException('Unauthorized'));
    }
  };
};
