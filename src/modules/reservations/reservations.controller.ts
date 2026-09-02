import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation (always PENDING)' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 404, description: 'Resource or User not found' })
  @ApiResponse({ status: 409, description: 'Time slot already reserved' })
  async create(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get reservations with filters and pagination' })
  @ApiResponse({ status: 200, type: [ReservationResponseDto] })
  async findAll(@Query() query: QueryReservationsDto): Promise<{
    data: ReservationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async findOne(@Param('id') id: string): Promise<ReservationResponseDto> {
    return this.reservationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a reservation (status, dates, resource, user)',
  })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 409, description: 'Time slot already reserved' })
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Put(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a reservation (change status to CANCELLED)',
  })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Reservation already cancelled' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancel(@Param('id') id: string): Promise<ReservationResponseDto> {
    return this.reservationsService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reservation (only PENDING or CANCELLED)' })
  @ApiResponse({ status: 204, description: 'Reservation deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete CONFIRMED reservation',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.reservationsService.remove(id);
  }

  @Get(':resourceId/availability')
  @ApiOperation({ summary: 'Check resource availability for a time range' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { available: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async checkAvailability(
    @Param('resourceId') resourceId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<{ available: boolean }> {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new Error('start must be before end');
    }

    const available = await this.reservationsService.checkAvailability(
      resourceId,
      startDate,
      endDate,
    );

    return { available };
  }
}
