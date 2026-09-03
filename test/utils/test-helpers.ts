import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { Resource } from '../../src/modules/resources/entities/resource.entity';

export class TestHelpers {
  constructor(private readonly app: INestApplication) {}

  async createUserInDb(overrides: Partial<User> = {}): Promise<User> {
    const userRepo = this.app.get<Repository<User>>(getRepositoryToken(User));
    const user = userRepo.create({
      email: 'juan.perez@example.com',
      name: 'Juan Pérez',
      ...overrides,
    });
    return userRepo.save(user);
  }

  async createResourceInDb(
    overrides: Partial<Resource> = {},
  ): Promise<Resource> {
    const resourceRepo = this.app.get<Repository<Resource>>(
      getRepositoryToken(Resource),
    );
    const resource = resourceRepo.create({
      name: 'Sala de Conferencias A',
      type: 'meeting_room',
      capacity: 20,
      isActive: true,
      ...overrides,
    });
    return resourceRepo.save(resource);
  }

  getHttpServer() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.app.getHttpServer();
  }
}
