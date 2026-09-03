import { TestApp } from './utils/test-app';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../src/modules/reservations/entities/reservation.entity';

describe('Availability (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = new TestApp();
    await testApp.init();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.cleanDatabase();
  });

  // Helper para crear una reserva confirmada directamente en la BD
  async function createConfirmedReservationInDb(
    resourceId: string,
    userId: string,
  ) {
    const reservationRepo = testApp.app.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    const reservation = reservationRepo.create({
      resourceId,
      userId,
      startTime: new Date('2026-09-03T10:00:00.000Z'),
      endTime: new Date('2026-09-03T11:00:00.000Z'),
      status: ReservationStatus.CONFIRMED,
    });
    return reservationRepo.save(reservation);
  }

  it('/reservations/:resourceId/availability (GET) - should return available true when no reservation exists', async () => {
    // Creamos el recurso en la BD
    const resource = await testApp.helpers.createResourceInDb();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .get(
        `/reservations/${resource.id}/availability?start=2026-09-03T10:00:00.000Z&end=2026-09-03T11:00:00.000Z`,
      )
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.available).toBe(true);
  });

  it('/reservations/:resourceId/availability (GET) - should return available false when there is a confirmed reservation', async () => {
    // Creamos el usuario y el recurso en la BD
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos una reserva confirmada directamente en la BD
    await createConfirmedReservationInDb(resource.id, user.id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .get(
        `/reservations/${resource.id}/availability?start=2026-09-03T10:30:00.000Z&end=2026-09-03T11:30:00.000Z`,
      )
      .expect(200);

    // Verificamos que no está disponible
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.available).toBe(false);
  });

  it('/reservations/:resourceId/availability (GET) - should return available true when reservation is pending', async () => {
    // Creamos el usuario y el recurso en la BD
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos una reserva pendiente en la BD
    const reservationRepo = testApp.app.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    await reservationRepo.save(
      reservationRepo.create({
        resourceId: resource.id,
        userId: user.id,
        startTime: new Date('2026-09-03T10:00:00.000Z'),
        endTime: new Date('2026-09-03T11:00:00.000Z'),
        status: ReservationStatus.PENDING,
      }),
    );

    // Disponibilidad debería ser true porque la lógica solo bloquea CONFIRMED
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .get(
        `/reservations/${resource.id}/availability?start=2026-09-03T10:30:00.000Z&end=2026-09-03T11:30:00.000Z`,
      )
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.available).toBe(true);
  });

  it('/reservations/:resourceId/availability (GET) - should return 404 if resource does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testApp.app.getHttpServer())
      .get(
        '/reservations/00000000-0000-0000-0000-000000000000/availability?start=2026-09-03T10:00:00.000Z&end=2026-09-03T11:00:00.000Z',
      )
      .expect(404);
  });
});
