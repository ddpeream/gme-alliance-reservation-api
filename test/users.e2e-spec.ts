import { TestApp } from './utils/test-app';
import request from 'supertest';

describe('Users (e2e)', () => {
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

  it('/users (POST) - should create a new user', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/users')
      .send({
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      })
      .expect(201);

    // Validamos la estructura del JSON de respuesta
    expect(response.body).toHaveProperty('id');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.email).toBe('juan.perez@example.com');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.name).toBe('Juan Pérez');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('/users (POST) - should return 400 if email is invalid', async () => {
    await request(testApp.app.getHttpServer())
      .post('/users')
      .send({
        email: 'invalid-email',
        name: 'Juan Pérez',
      })
      .expect(400);
  });

  it('/users (POST) - should return 409 if email already exists', async () => {
    // Creamos el usuario una vez
    await request(testApp.app.getHttpServer())
      .post('/users')
      .send({
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      })
      .expect(201);

    // Intentamos crear el mismo usuario de nuevo
    await request(testApp.app.getHttpServer())
      .post('/users')
      .send({
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      })
      .expect(409);
  });

  it('/users (GET) - should return all users', async () => {
    // Creamos un usuario directamente en la BD para no depender de la API
    await testApp.helpers.createUserInDb();

    const response = await request(testApp.app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(response.body).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body[0].email).toBe('juan.perez@example.com');
  });

  it('/users/:id (GET) - should return a user by id', async () => {
    const user = await testApp.helpers.createUserInDb();

    const response = await request(testApp.app.getHttpServer())
      .get(`/users/${user.id}`)
      .expect(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.id).toBe(user.id);
  });

  it('/users/:id (GET) - should return 404 if user does not exist', async () => {
    await request(testApp.app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
