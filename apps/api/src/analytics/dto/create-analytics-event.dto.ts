import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const EVENT_TYPES = ['PAGE_VIEW', 'CLICK', 'FORM_SUBMIT', 'CUSTOM'] as const;

type EventType = (typeof EVENT_TYPES)[number];

export class CreateAnalyticsEventDto {
  @IsIn(EVENT_TYPES)
  eventType: EventType;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  element?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  label?: string;

  @IsString()
  @MaxLength(120)
  sessionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  referrer?: string;
}
