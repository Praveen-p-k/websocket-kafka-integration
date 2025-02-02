import { Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Module({
  providers: [ApiKeyService],
})
export class ApiKeyModule {}
