import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientKafka } from '@nestjs/microservices';
import { config } from 'src/config';
import { kafkaProducerConfig } from 'src/kafka/kafka-producer.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  @Client(kafkaProducerConfig())
  private readonly kafkaClient: ClientKafka;

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf(config.IRYS_KAFKA_TOPIC);
    await this.kafkaClient.connect();
  }

  async produceMessage(message: any) {
    return this.kafkaClient.emit(
      config.IRYS_KAFKA_TOPIC,
      JSON.stringify(message),
    );
  }
}
