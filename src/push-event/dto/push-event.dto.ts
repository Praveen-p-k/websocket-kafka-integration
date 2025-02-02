import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class EventDataDto {
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  namespaceName: string;
}

class MetadataDto {
  @IsString()
  @IsOptional()
  dataSize?: string;

  @IsString()
  @IsOptional()
  retryCount?: string;

  @IsString()
  @IsNotEmpty()
  activityType: string;

  @IsUUID()
  @IsNotEmpty()
  trackingId: string;
}

class EventInfoDto {
  @ValidateNested()
  @Type(() => EventDataDto)
  @IsObject()
  @IsOptional()
  data?: EventDataDto;

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsObject()
  @IsOptional()
  metadata?: MetadataDto;
}

class EventMessageDto {
  @ValidateNested()
  @Type(() => EventInfoDto)
  @IsObject()
  @IsOptional()
  info?: EventInfoDto;
}

class EventErrorDto {
  @IsString()
  @IsOptional()
  errorDetail?: string;
}

export class PushEventMessageDto {
  @IsString()
  @IsNotEmpty()
  eventVersion: string;

  @IsString()
  @IsNotEmpty()
  eventSource: string;

  @IsString()
  @IsNotEmpty()
  eventTime: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ValidateNested()
  @Type(() => EventMessageDto)
  @IsObject()
  @IsOptional()
  eventMessage?: EventMessageDto;

  @ValidateNested()
  @Type(() => EventErrorDto)
  @IsObject()
  @IsOptional()
  eventError?: EventErrorDto;
}

class PushEventPayloadDto {
  @IsArray({ message: 'records must be an array' })
  @ValidateNested({ each: true })
  @Type(() => PushEventMessageDto)
  records: PushEventMessageDto[];
}

export class PushEventRootDto {
  @IsNumber()
  @Min(1)
  sourceNumber: number;

  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ValidateNested()
  @Type(() => PushEventPayloadDto)
  payload: PushEventPayloadDto;
}
