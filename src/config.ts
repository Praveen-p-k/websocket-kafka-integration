import 'dotenv/config';

export const config = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  APP_BACKEND_PREFIX: process.env.APP_BACKEND_PREFIX,

  IRYS_KAFKA_TOPIC: process.env.IRYS_KAFKA_TOPIC,
  IRYS_KAFKA_BROKER: process.env.IRYS_KAFKA_BROKER,
  KAFKA_CLIENT_TIMEOUT: process.env.KAFKA_CLIENT_TIMEOUT,

  LISTENER_CONSUMER_GROUP_ID: process.env.LISTENER_CONSUMER_GROUP_ID,
  LISTENER_CONSUMER_CLIENT_ID: process.env.LISTENER_CONSUMER_CLIENT_ID,

  LISTENER_PRODUCER_GROUP_ID: process.env.LISTENER_PRODUCER_GROUP_ID,
  LISTENER_PRODUCER_CLIENT_ID: process.env.LISTENER_PRODUCER_CLIENT_ID,

  NOTIFICATION_CONSUMER_GROUP_ID: process.env.NOTIFICATION_CONSUMER_GROUP_ID,
  NOTIFICATION_CONSUMER_CLIENT_ID: process.env.NOTIFICATION_CONSUMER_CLIENT_ID,

  NOTIFICATION_PRODUCER_GROUP_ID: process.env.NOTIFICATION_PRODUCER_GROUP_ID,
  NOTIFICATION_PRODUCER_CLIENT_ID: process.env.NOTIFICATION_PRODUCER_CLIENT_ID,

  SASL_USERNAME: process.env.SASL_USERNAME,
  SASL_PASSWORD: process.env.SASL_PASSWORD,

  WEBSOCKET_API_KEY: process.env.WEBSOCKET_API_KEY,
  WEBSOCKET_EVENT_SUBSCRIPTION_KEY:
    process.env.WEBSOCKET_EVENT_SUBSCRIPTION_KEY,
  WEBSOCKET_EVENT_PUBSUB_KEY: process.env.WEBSOCKET_EVENT_PUBSUB_KEY,

  CLIENT_MAX_CONNECTIONS: +process.env.CLIENT_MAX_CONNECTIONS,
  CLIENT_INACTIVITY_TIMEOUT_MS: +process.env.CLIENT_INACTIVITY_TIMEOUT_MS,
};
