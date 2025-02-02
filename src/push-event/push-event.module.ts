import { Module } from '@nestjs/common';
import { PushEventService } from './push-event.service';
import { PushEventController } from './push-event.controller';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { ApiKeyService } from 'src/api-key/api-key.service';

@Module({
  controllers: [PushEventController],
  providers: [
    PushEventService,
    KafkaProducerService,
    SocketGateway,
    ApiKeyService,
  ],
})
export class PushEventModule {}
