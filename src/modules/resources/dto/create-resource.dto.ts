import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'Sala de Conferencias A' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'meeting_room' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  capacity?: number;
}
