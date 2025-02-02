import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): { status: 'Ok' } {
    return {
      status: 'Ok',
    };
  }
}
