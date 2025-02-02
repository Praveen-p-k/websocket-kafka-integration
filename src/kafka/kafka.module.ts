import { Module } from '@nestjs/common';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';

@Module({
  providers: [KafkaProducerService],
})
export class KafkaModule {}
