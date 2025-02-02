import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PushEventRootDto } from './dto/push-event.dto';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { CustomException } from 'src/shared-kernel/exceptions/custom-exception/custom-exception';

@Injectable()
export class PushEventService {
  private readonly logger = new Logger(PushEventService.name);

  constructor(
    private readonly socketGateway: SocketGateway,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  public async pushEvent(pushEventRootDto: PushEventRootDto) {
    try {
      const trackingId = uuid();
      this.logger.log(`Received event: ${JSON.stringify(pushEventRootDto)}`);

      await this.kafkaProducerService.produceMessage({
        payload: pushEventRootDto,
        trackingId,
      });

      this.logger.log(
        `Event processed successfully with trackingId: ${trackingId}`,
      );

      this.logger.log(
        `Received event for channel: ${pushEventRootDto.channelId}`,
      );

      // Emit event to WebSocket clients
      this.socketGateway.sendEventToChannel(
        pushEventRootDto.channelId,
        pushEventRootDto,
      );

      return { trackingId };
    } catch (error) {
      this.logger.error(`Failed to process event: ${error}`);
      throw new CustomException(
        `Unknown error occurred: ${error}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
