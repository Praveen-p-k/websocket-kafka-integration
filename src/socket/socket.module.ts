import { Module } from '@nestjs/common';
import { ApiKeyService } from 'src/api-key/api-key.service';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  providers: [SocketGateway, KafkaProducerService, ApiKeyService],
})
export class SocketModule {}
