import { KafkaOptions, Transport } from '@nestjs/microservices';
import { KafkaConfig } from 'kafkajs';
import { config } from 'src/config';
import { NodeEnvironments } from 'src/shared-kernel/utils/constants';

export const createKafkaClientConfig = (clientId: string): KafkaConfig => {
  const baseConfig: KafkaConfig = {
    clientId,
    brokers: [config.IRYS_KAFKA_BROKER],
  };

  if (config.NODE_ENV !== NodeEnvironments.LOCAL) {
    return {
      ...baseConfig,
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: config.SASL_USERNAME,
        password: config.SASL_PASSWORD,
      },
    };
  }
  return baseConfig;
};

const createKafkaConsumerConfig = (groupId: string) => ({
  groupId,
});

/**
 * Kafka Producer Configuration for Notification Service
 */
export const kafkaProducerConfig = (): KafkaOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: createKafkaClientConfig(config.NOTIFICATION_PRODUCER_CLIENT_ID),
    consumer: createKafkaConsumerConfig(config.NOTIFICATION_PRODUCER_GROUP_ID),
  },
});
