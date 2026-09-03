import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  FindOptionsWhere,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private resourcesService: ResourcesService,
    private usersService: UsersService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    // 1. Validar que el recurso existe
    await this.resourcesService.findOne(createReservationDto.resourceId);

    // 2. Validar que el usuario existe
    await this.usersService.findOne(createReservationDto.userId);

    // 3. Validar que startTime < endTime (ya lo hace el DTO, pero validamos nuevamente)
    const start = new Date(createReservationDto.startTime);
    const end = new Date(createReservationDto.endTime);

    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // 4. Validar que no haya solapamiento (la BD lo garantiza, pero validamos antes para mejor UX)
    const overlapping = await this.checkOverlap(
      createReservationDto.resourceId,
      start,
      end,
      null, // null = sin excluir ninguna reserva (creación)
    );

    if (overlapping) {
      throw new ConflictException(
        `Resource "${createReservationDto.resourceId}" is already reserved for the requested time range`,
      );
    }

    // 5. Crear la reserva (siempre PENDING por defecto)
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      status: ReservationStatus.PENDING,
    });

    // 6. Intentar guardar - la BD rechazará si hay solapamiento (doble garantía)
    try {
      return await this.reservationRepository.save(reservation);
    } catch (error: any) {
      // Si la BD rechaza por Exclusion Constraint, capturar el error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23P01') {
        // Exclusion violation
        throw new ConflictException(
          `Resource "${createReservationDto.resourceId}" is already reserved for the requested time range`,
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryReservationsDto): Promise<{
    data: Reservation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      resourceId,
      userId,
      from,
      to,
      status,
      page = 1,
      limit = 10,
    } = query;

    // Construir filtros dinámicos
    const where: FindOptionsWhere<Reservation> = {};

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    // Filtro por rango de fechas (startTime y endTime)
    if (from && to) {
      // Reservas que intersectan el rango [from, to]
      where.startTime = Between(new Date(from), new Date(to));
    } else if (from) {
      where.startTime = MoreThanOrEqual(new Date(from));
    } else if (to) {
      where.startTime = LessThanOrEqual(new Date(to));
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Ejecutar consulta con relaciones
    const [data, total] = await this.reservationRepository.findAndCount({
      where,
      relations: ['resource', 'user'],
      order: { startTime: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['resource', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID "${id}" not found`);
    }

    return reservation;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Verificar si se está cambiando el estado a CONFIRMED o CANCELLED
    const newStatus = updateReservationDto.status;

    // Si se está confirmando, verificar solapamiento
    if (newStatus === ReservationStatus.CONFIRMED) {
      const start = updateReservationDto.startTime
        ? new Date(updateReservationDto.startTime)
        : reservation.startTime;
      const end = updateReservationDto.endTime
        ? new Date(updateReservationDto.endTime)
        : reservation.endTime;
      const resourceId =
        updateReservationDto.resourceId || reservation.resourceId;

      // Verificar que el recurso existe
      await this.resourcesService.findOne(resourceId);

      // Verificar solapamiento (excluyendo la reserva actual)
      const overlapping = await this.checkOverlap(resourceId, start, end, id);

      if (overlapping) {
        throw new ConflictException(
          `Resource "${resourceId}" is already reserved for the requested time range`,
        );
      }
    }

    // Aplicar actualizaciones
    Object.assign(reservation, updateReservationDto);

    // Intentar guardar
    try {
      return await this.reservationRepository.save(reservation);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === '23P01') {
        throw new ConflictException(
          `Resource "${updateReservationDto.resourceId || reservation.resourceId}" is already reserved`,
        );
      }
      throw error;
    }
  }

  async cancel(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);

    // Solo se puede cancelar si no está ya cancelada
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepository.save(reservation);
  }

  async checkAvailability(
    resourceId: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    // Verificar que el recurso existe
    await this.resourcesService.findOne(resourceId);

    // Verificar si hay solapamiento
    const overlapping = await this.checkOverlap(resourceId, start, end, null);
    return !overlapping;
  }

  private async checkOverlap(
    resourceId: string,
    start: Date,
    end: Date,
    excludeReservationId: string | null,
  ): Promise<boolean> {
    // Consulta para verificar solapamiento comparando directamente las fechas
    // (Ya no depende de la columna "period", que suele ser null)
    const queryBuilder = this.reservationRepository.createQueryBuilder('r');

    queryBuilder
      .where('r.resourceId = :resourceId', { resourceId })
      .andWhere('r.status = :status', { status: ReservationStatus.CONFIRMED })
      // Verificación clásica de solapamiento de rangos de tiempo
      .andWhere('r.startTime < :end', { end })
      .andWhere('r.endTime > :start', { start });

    if (excludeReservationId) {
      queryBuilder.andWhere('r.id != :excludeReservationId', {
        excludeReservationId,
      });
    }

    const result = await queryBuilder.getCount();
    return result > 0;
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);

    // Solo permitir eliminar reservas canceladas o pendientes
    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Cannot delete a confirmed reservation. Cancel it first.',
      );
    }

    await this.reservationRepository.remove(reservation);
  }
}
