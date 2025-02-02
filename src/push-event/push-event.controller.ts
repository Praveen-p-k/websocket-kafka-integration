import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PushEventRootDto } from './dto/push-event.dto';
import { PublishEventAuthGuard } from './guards/push-event.guard';
import { PushEventService } from './push-event.service';

@Controller('')
export class PushEventController {
  constructor(private readonly pushEventService: PushEventService) {}

  @Post('/push-event')
  @UseGuards(PublishEventAuthGuard)
  async pushEvent(
    @Body() pushEventRootDto: PushEventRootDto,
  ): Promise<{ trackingId: string }> {
    return this.pushEventService.pushEvent(pushEventRootDto);
  }
}
