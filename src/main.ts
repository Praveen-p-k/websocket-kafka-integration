import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { config as configVars } from 'src/config';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { kafkaProducerConfig } from './kafka/kafka-producer.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /** Data size limits */
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  /** BACKEND CONFIGS */
  // For handling validation of input datas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(configVars.APP_BACKEND_PREFIX);
  app.connectMicroservice<MicroserviceOptions>(kafkaProducerConfig());

  await app.listen(configVars.PORT);
}
bootstrap();
