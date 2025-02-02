import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from 'src/config';
import { createKafkaClientConfig } from './kafka-producer.config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly subscribedTopicsAndCallbacks = new Map<
    string,
    Map<string, (message: any) => void>
  >();

  constructor() {
    this.kafka = new Kafka(
      createKafkaClientConfig(config.LISTENER_CONSUMER_CLIENT_ID),
    );
  }

  async onModuleInit() {
    await Promise.all([this.initializeProducer(), this.initializeConsumer()]);
  }

  async onModuleDestroy() {
    await Promise.all([this.disconnectProducer(), this.disconnectConsumer()]);
  }

  async pauseTopic(topic: string) {
    this.ensureConsumerInitialized();
    try {
      this.consumer.pause([{ topic }]);
      this.logger.log(`Topic "${topic}" paused.`);
    } catch (error) {
      this.handleError('Pausing topic', topic, error);
    }
  }

  async resumeTopic(topic: string) {
    this.ensureConsumerInitialized();
    try {
      this.consumer.resume([{ topic }]);
      this.logger.log(`Topic "${topic}" resumed.`);
    } catch (error) {
      this.handleError('Resuming topic', topic, error);
    }
  }

  async stopListening(topic: string, clientId: string) {
    const clientCallbacks = this.subscribedTopicsAndCallbacks.get(topic);
    if (!clientCallbacks?.has(clientId)) {
      this.logger.warn(
        `No subscription for client "${clientId}" on topic "${topic}".`,
      );
      return;
    }

    clientCallbacks.delete(clientId);
    if (clientCallbacks.size === 0) {
      await this.pauseTopic(topic);
      this.subscribedTopicsAndCallbacks.delete(topic);
    }
  }

  async subscribeAndConsume(
    clientId: string,
    topic: string,
    callback: (message: any) => void,
  ) {
    this.ensureConsumerInitialized();

    try {
      const isNewTopic = !this.subscribedTopicsAndCallbacks.has(topic);

      if (isNewTopic) {
        this.subscribedTopicsAndCallbacks.set(topic, new Map());
      }

      const clientCallbacks = this.subscribedTopicsAndCallbacks.get(topic);

      if (clientCallbacks.has(clientId)) {
        this.logger.warn(
          `Client "${clientId}" is already subscribed to topic "${topic}".`,
        );
        return;
      }

      clientCallbacks.set(clientId, callback);

      if (isNewTopic) {
        await this.subscribeToTopics([
          ...this.subscribedTopicsAndCallbacks.keys(),
        ]);
        this.logger.log(`Started listening to new topic "${topic}".`);
      }

      this.logger.log(`Client "${clientId}" subscribed to topic "${topic}".`);
    } catch (error) {
      this.handleError('Subscribing to topic', topic, error);
    }
  }

  private async subscribeToTopics(topics: string[]) {
    await this.consumer.stop();

    await Promise.all(
      topics.map((topic) =>
        this.consumer.subscribe({ topic, fromBeginning: true }),
      ),
    );

    await this.runConsumer();
  }

  private async runConsumer() {
    await this.consumer.connect();
    this.logger.log('Kafka consumer initialized.');

    await this.consumer.run({
      eachMessage: async (payload) => {
        this.logger.debug(payload.message);
        this.handleIncomingMessage(payload);
      },
    });
  }

  async sendMessage(topic: string, message: any) {
    this.ensureProducerInitialized();
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Message sent to "${topic}": ${JSON.stringify(message)}`);
    } catch (error) {
      this.handleError('Sending message', topic, error);
    }
  }

  private async initializeProducer() {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer initialized.');
  }

  private async initializeConsumer() {
    this.consumer = this.kafka.consumer({
      groupId: config.LISTENER_CONSUMER_GROUP_ID,
      allowAutoTopicCreation: true,
    });
    await this.consumer.connect();
    this.logger.log('Kafka consumer initialized.');

    await this.runConsumer();
  }

  private async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected.');
    }
  }

  private async disconnectConsumer() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected.');
    }
  }

  private handleIncomingMessage({ topic, message }: EachMessagePayload) {
    const messageValue = message.value?.toString();
    if (!messageValue) {
      this.logger.warn(`Empty message on topic "${topic}".`);
      return;
    }

    const parsedMessage = this.parseMessage(messageValue);
    if (parsedMessage) {
      this.logger.log(
        `Message on "${topic}": ${JSON.stringify(parsedMessage)}`,
      );
      this.subscribedTopicsAndCallbacks
        .get(topic)
        ?.forEach((callback) => callback(parsedMessage));
    }
  }

  private parseMessage(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      this.logger.warn('Failed to parse message, returning raw value.');
      return value;
    }
  }

  private ensureConsumerInitialized() {
    if (!this.consumer) throw new Error('Kafka consumer is not initialized.');
  }

  private ensureProducerInitialized() {
    if (!this.producer) throw new Error('Kafka producer is not initialized.');
  }

  private handleError(action: string, topic: string, error: any) {
    this.logger.error(
      `${action} on topic "${topic}": ${error.message}`,
      error.stack,
    );
  }
}
