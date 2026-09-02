import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  Validate,
  ValidationArguments,
} from 'class-validator';

// Validator personalizado
export class IsEndAfterStart {
  static validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateReservationDto;
    if (!object.startTime || !value) return true;
    return new Date(object.startTime) < new Date(value);
  }

  static defaultMessage() {
    return 'endTime must be after startTime';
  }
}

export class CreateReservationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  resourceId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: '2026-09-03T10:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-09-03T11:00:00Z' })
  @IsDateString()
  @Validate(IsEndAfterStart)
  endTime!: string;
}
