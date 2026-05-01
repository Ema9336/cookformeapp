import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ComplianceStatusDto {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  REJECTED = 'REJECTED',
}

export class UpdateComplianceDto {
  @IsEnum(ComplianceStatusDto)
  status: ComplianceStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
