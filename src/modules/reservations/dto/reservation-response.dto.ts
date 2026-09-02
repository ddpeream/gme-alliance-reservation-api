import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';
import { ResourceResponseDto } from '../../resources/dto/resource-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ReservationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  resourceId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  startTime!: Date;

  @ApiProperty()
  endTime!: Date;

  @ApiProperty({ enum: ReservationStatus })
  status!: ReservationStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  resource?: ResourceResponseDto;

  @ApiProperty({ required: false })
  user?: UserResponseDto;
}
