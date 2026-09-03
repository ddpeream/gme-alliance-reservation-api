import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationRepository: any;
  let resourcesService: any;
  let usersService: any;

  // Datos de prueba
  const mockUser = {
    id: '3c25d1fc-cad7-4a66-829a-33e77add5121',
    email: 'juan.perez@example.com',
    name: 'Juan Pérez',
    createdAt: new Date('2026-09-02T19:16:38.265Z'),
    updatedAt: new Date('2026-09-02T19:16:38.265Z'),
  };

  const mockResource = {
    id: '8cfd4286-d408-4603-b4c6-073fc609059a',
    name: 'Sala de Conferencias A',
    type: 'meeting_room',
    capacity: 20,
    isActive: true,
    createdAt: new Date('2026-09-02T19:17:26.721Z'),
    updatedAt: new Date('2026-09-02T19:17:26.721Z'),
  };

  const mockReservation: Reservation = {
    id: 'a88ccedf-c96d-46c3-8548-b779f3170e6c',
    resourceId: mockResource.id,
    userId: mockUser.id,
    startTime: new Date('2026-09-03T10:00:00.000Z'),
    endTime: new Date('2026-09-03T11:00:00.000Z'),
    status: ReservationStatus.PENDING,
    period: null,
    createdAt: new Date('2026-09-02T19:18:43.415Z'),
    updatedAt: new Date('2026-09-02T19:18:43.415Z'),
  } as unknown as Reservation;

  beforeEach(async () => {
    reservationRepository = {
      create: jest.fn().mockImplementation((dto: CreateReservationDto) => {
        return { ...dto, status: ReservationStatus.PENDING };
      }),
      save: jest.fn().mockImplementation((reservation: Reservation) => {
        return Promise.resolve({
          ...reservation,
          id: mockReservation.id,
          createdAt: mockReservation.createdAt,
          updatedAt: mockReservation.updatedAt,
        });
      }),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
    };

    // Mocks de los servicios dependientes
    resourcesService = {
      findOne: jest.fn().mockResolvedValue(mockResource),
    };

    usersService = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: reservationRepository,
        },
        {
          provide: ResourcesService,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: resourcesService,
        },
        {
          provide: UsersService,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new pending reservation successfully', async () => {
      const dto: CreateReservationDto = {
        resourceId: mockResource.id,
        userId: mockUser.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      };

      // Simular que no hay solapamiento
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.create(dto);

      expect(result.status).toBe(ReservationStatus.PENDING);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if there is an overlap', async () => {
      const dto: CreateReservationDto = {
        resourceId: mockResource.id,
        userId: mockUser.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      };

      // Simular que hay solapamiento
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if startTime is after endTime', async () => {
      const dto: CreateReservationDto = {
        resourceId: mockResource.id,
        userId: mockUser.id,
        startTime: '2026-09-03T12:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated reservations', async () => {
      const query: QueryReservationsDto = {
        page: 1,
        limit: 10,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findAndCount.mockResolvedValue([
        [mockReservation],
        1,
      ]);

      const result = await service.findAll(query);

      expect(result.data).toEqual([mockReservation]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue(mockReservation);

      const result = await service.findOne(mockReservation.id);

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a reservation status to confirmed', async () => {
      const updateDto: UpdateReservationDto = {
        status: ReservationStatus.CONFIRMED,
      };

      // Simular reserva existente (pending)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne
        .mockResolvedValueOnce({
          ...mockReservation,
          status: ReservationStatus.PENDING,
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ...mockReservation,
          status: ReservationStatus.PENDING,
        });

      // Simular que no hay solapamiento en la confirmación
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.update(mockReservation.id, updateDto);

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should throw ConflictException if confirming causes overlap', async () => {
      const updateDto: UpdateReservationDto = {
        status: ReservationStatus.CONFIRMED,
      };

      // Simular reserva existente (pending)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne
        .mockResolvedValueOnce({
          ...mockReservation,
          status: ReservationStatus.PENDING,
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ...mockReservation,
          status: ReservationStatus.PENDING,
        });

      // Simular que hay solapamiento
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await expect(
        service.update(mockReservation.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('should cancel a reservation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.PENDING,
      });

      const result = await service.cancel(mockReservation.id);

      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should throw BadRequestException if already cancelled', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      });

      await expect(service.cancel(mockReservation.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return true if resource is available', async () => {
      // Simular que el recurso existe y no hay solapamiento
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.checkAvailability(
        mockResource.id,
        new Date('2026-09-03T10:00:00.000Z'),
        new Date('2026-09-03T11:00:00.000Z'),
      );

      expect(result).toBe(true);
    });

    it('should return false if resource is not available', async () => {
      // Simular que hay solapamiento
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.checkAvailability(
        mockResource.id,
        new Date('2026-09-03T10:00:00.000Z'),
        new Date('2026-09-03T11:00:00.000Z'),
      );

      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a pending reservation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.PENDING,
      });

      await service.remove(mockReservation.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(reservationRepository.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException if trying to remove a confirmed reservation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      reservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      });

      await expect(service.remove(mockReservation.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
