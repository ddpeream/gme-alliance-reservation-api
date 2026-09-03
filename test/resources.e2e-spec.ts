import { TestApp } from './utils/test-app';
import request from 'supertest';

describe('Resources (e2e)', () => {
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

  it('/resources (POST) - should create a new resource', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/resources')
      .send({
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      })
      .expect(201);

    // Validamos la estructura del JSON de respuesta
    expect(response.body).toHaveProperty('id');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.name).toBe('Sala de Conferencias A');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.capacity).toBe(20);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.isActive).toBe(true);
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('/resources (POST) - should return 409 if resource name already exists', async () => {
    // Creamos el primer recurso
    await request(testApp.app.getHttpServer())
      .post('/resources')
      .send({
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      })
      .expect(201);

    // Intentamos crear el mismo recurso de nuevo
    await request(testApp.app.getHttpServer())
      .post('/resources')
      .send({
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      })
      .expect(409);
  });

  it('/resources (GET) - should return all active resources', async () => {
    // Creamos un recurso directamente en la BD
    await testApp.helpers.createResourceInDb();

    const response = await request(testApp.app.getHttpServer())
      .get('/resources')
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body[0].name).toBe('Sala de Conferencias A');
  });

  it('/resources/:id (GET) - should return a resource by id', async () => {
    const resource = await testApp.helpers.createResourceInDb();

    const response = await request(testApp.app.getHttpServer())
      .get(`/resources/${resource.id}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.id).toBe(resource.id);
  });

  it('/resources/:id (GET) - should return 404 if resource does not exist', async () => {
    await request(testApp.app.getHttpServer())
      .get('/resources/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('/resources/:id (PUT) - should update a resource', async () => {
    const resource = await testApp.helpers.createResourceInDb();

    const response = await request(testApp.app.getHttpServer())
      .put(`/resources/${resource.id}`)
      .send({
        name: 'Sala de Conferencias B',
      })
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.name).toBe('Sala de Conferencias B');
  });

  it('/resources/:id (DELETE) - should soft delete a resource (return 204)', async () => {
    const resource = await testApp.helpers.createResourceInDb();

    await request(testApp.app.getHttpServer())
      .delete(`/resources/${resource.id}`)
      .expect(204);
  });
});
