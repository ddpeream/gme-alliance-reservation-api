import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ReservationStatus } from './entities/reservation.entity';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let reservationsService: any;

  const mockReservation = {
    id: 'a88ccedf-c96d-46c3-8548-b779f3170e6c',
    resourceId: '8cfd4286-d408-4603-b4c6-073fc609059a',
    userId: '3c25d1fc-cad7-4a66-829a-33e77add5121',
    startTime: new Date('2026-09-03T10:00:00.000Z'),
    endTime: new Date('2026-09-03T11:00:00.000Z'),
    status: ReservationStatus.PENDING,
    createdAt: new Date('2026-09-02T19:18:43.415Z'),
    updatedAt: new Date('2026-09-02T19:18:43.415Z'),
  };

  beforeEach(async () => {
    reservationsService = {
      create: jest.fn().mockResolvedValue(mockReservation),
      findAll: jest.fn().mockResolvedValue({
        data: [mockReservation],
        total: 1,
        page: 1,
        limit: 10,
      }),
      findOne: jest.fn().mockResolvedValue(mockReservation),
      update: jest.fn().mockResolvedValue(mockReservation),
      cancel: jest.fn().mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      }),
      remove: jest.fn().mockResolvedValue(undefined),
      checkAvailability: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: reservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the service and return the created reservation', async () => {
      const dto: CreateReservationDto = {
        resourceId: '8cfd4286-d408-4603-b4c6-073fc609059a',
        userId: '3c25d1fc-cad7-4a66-829a-33e77add5121',
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      };

      const result = await controller.create(dto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockReservation);
    });
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      const query: QueryReservationsDto = { page: 1, limit: 10 };

      const result = await controller.findAll(query);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toEqual([mockReservation]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should call the service with the id', async () => {
      const result = await controller.findOne(mockReservation.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.findOne).toHaveBeenCalledWith(
        mockReservation.id,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('update', () => {
    it('should call the service with id and dto', async () => {
      const updateDto: UpdateReservationDto = {
        status: ReservationStatus.CONFIRMED,
      };

      const result = await controller.update(mockReservation.id, updateDto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.update).toHaveBeenCalledWith(
        mockReservation.id,
        updateDto,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('cancel', () => {
    it('should call the service and return cancelled reservation', async () => {
      const result = await controller.cancel(mockReservation.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.cancel).toHaveBeenCalledWith(
        mockReservation.id,
      );
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });
  });

  describe('remove', () => {
    it('should call the service with id', async () => {
      await controller.remove(mockReservation.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.remove).toHaveBeenCalledWith(
        mockReservation.id,
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return available true for valid dates', async () => {
      const start = '2026-09-03T10:00:00.000Z';
      const end = '2026-09-03T11:00:00.000Z';

      const result = await controller.checkAvailability(
        mockReservation.resourceId,
        start,
        end,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationsService.checkAvailability).toHaveBeenCalledWith(
        mockReservation.resourceId,
        new Date(start),
        new Date(end),
      );
      expect(result).toEqual({ available: true });
    });
  });
});
