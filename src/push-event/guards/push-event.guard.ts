import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { config } from 'src/config';

@Injectable()
export class PublishEventAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientApiKey = request.headers['apikey'];

    console.log(clientApiKey, request.headers);

    const publishApiKey = config.WEBSOCKET_EVENT_PUBSUB_KEY;

    if (clientApiKey && clientApiKey === publishApiKey) {
      return true;
    }

    throw new ForbiddenException(
      'Access Denied: Invalid API Key for Publishing',
    );
  }
}
