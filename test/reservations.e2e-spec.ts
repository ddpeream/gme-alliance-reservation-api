import { TestApp } from './utils/test-app';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../src/modules/reservations/entities/reservation.entity';

describe('Reservations (e2e)', () => {
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

  // Helper para crear una reserva confirmada directamente en la BD (sin pasar por la API)
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

  it('/reservations (POST) - should create a new pending reservation', async () => {
    // Creamos el usuario y el recurso en la BD
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      })
      .expect(201);

    // Validamos la estructura del JSON de respuesta
    expect(response.body).toHaveProperty('id');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toBe('pending');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.resourceId).toBe(resource.id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.userId).toBe(user.id);
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('/reservations (POST) - should return 409 Conflict if resource is already booked', async () => {
    // Creamos el usuario y el recurso en la BD
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos una reserva CONFIRMADA directamente en la BD
    await createConfirmedReservationInDb(resource.id, user.id);

    // Intentamos crear una segunda reserva que se solapa con la anterior
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:30:00.000Z',
        endTime: '2026-09-03T11:30:00.000Z',
      })
      .expect(409);
  });

  it('/reservations (PUT) - should confirm a reservation', async () => {
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos la reserva
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const createResponse = await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const reservationId = createResponse.body.id;

    // Confirmamos la reserva
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const updateResponse = await request(testApp.app.getHttpServer())
      .put(`/reservations/${reservationId}`)
      .send({
        status: 'confirmed',
      })
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(updateResponse.body.status).toBe('confirmed');
  });

  it('/reservations (GET) - should return reservations with filters and pagination', async () => {
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos una reserva confirmada
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      })
      .expect(201);

    // Filtramos por resourceId y status
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .get(
        `/reservations?resourceId=${resource.id}&status=pending&page=1&limit=10`,
      )
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.total).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.page).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.limit).toBe(10);
  });

  it('/reservations/:id (GET) - should return a reservation with relations', async () => {
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos la reserva
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const createResponse = await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const reservationId = createResponse.body.id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const getResponse = await request(testApp.app.getHttpServer())
      .get(`/reservations/${reservationId}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getResponse.body.id).toBe(reservationId);
    // Verificamos que las relaciones vengan incluidas
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getResponse.body.resource).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(getResponse.body.user).toBeDefined();
  });

  it('/reservations/:id (GET) - should return 404 if reservation does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(testApp.app.getHttpServer())
      .get('/reservations/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('/reservations/:id (PUT) - should cancel a reservation', async () => {
    const user = await testApp.helpers.createUserInDb();
    const resource = await testApp.helpers.createResourceInDb();

    // Creamos la reserva
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const createResponse = await request(testApp.app.getHttpServer())
      .post('/reservations')
      .send({
        resourceId: resource.id,
        userId: user.id,
        startTime: '2026-09-03T10:00:00.000Z',
        endTime: '2026-09-03T11:00:00.000Z',
      })
      .expect(201);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const reservationId = createResponse.body.id;

    // Cancelamos la reserva
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(testApp.app.getHttpServer())
      .put(`/reservations/${reservationId}/cancel`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.status).toBe('cancelled');
  });
});
