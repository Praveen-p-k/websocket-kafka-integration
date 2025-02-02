import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { SocketModule } from 'src/socket/socket.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { PushEventModule } from './push-event/push-event.module';
import { ApiKeyModule } from './api-key/api-key.module';

@Module({
  imports: [SocketModule, KafkaModule, PushEventModule, ApiKeyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
