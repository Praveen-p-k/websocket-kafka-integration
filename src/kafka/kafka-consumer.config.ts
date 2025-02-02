import { KafkaOptions, Transport } from '@nestjs/microservices';
import { KafkaConfig } from 'kafkajs';
import { config } from 'src/config';
import { NodeEnvironments } from 'src/shared-kernel/utils/constants';

export const createIrysKafkaClientConfig = (
  clientId: string,
  brokers: string[],
): KafkaConfig => {
  const baseConfig: KafkaConfig = {
    clientId,
    brokers,
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

// Helper function to create Kafka Consumer configuration
const createKafkaConsumerConfig = (
  groupId: string,
): KafkaOptions['options']['consumer'] => ({
  groupId,
});

const createKafkaConfig = (
  clientId: string,
  brokers: string[],
  groupId: string,
): KafkaOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: createIrysKafkaClientConfig(clientId, brokers),
    consumer: createKafkaConsumerConfig(groupId),
    subscribe: {
      fromBeginning: true,
    },
  },
});

/**
 * Kafka Consumer Configuration for Listener Service
 */
export const irysKafkaConsumerConfig = (): KafkaOptions =>
  createKafkaConfig(
    config.LISTENER_CONSUMER_CLIENT_ID,
    config.IRYS_KAFKA_BROKER.split(','),
    config.LISTENER_CONSUMER_GROUP_ID,
  );
