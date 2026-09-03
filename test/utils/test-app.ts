import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { Resource } from '../../src/modules/resources/entities/resource.entity';
import { Reservation } from '../../src/modules/reservations/entities/reservation.entity';
import { UsersModule } from '../../src/modules/users/users.module';
import { ResourcesModule } from '../../src/modules/resources/resources.module';
import { ReservationsModule } from '../../src/modules/reservations/reservations.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { TestHelpers } from './test-helpers';

export class TestApp {
  public app!: INestApplication;
  public helpers!: TestHelpers;

  async init() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'reservation_db',
          entities: [User, Resource, Reservation],
          synchronize: true,
          dropSchema: true,
        }),
        UsersModule,
        ResourcesModule,
        ReservationsModule,
      ],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();

    this.helpers = new TestHelpers(this.app);
  }

  async close() {
    await this.app.close();
  }

  async cleanDatabase() {
    const userRepo = this.app.get<Repository<User>>(getRepositoryToken(User));
    const resourceRepo = this.app.get<Repository<Resource>>(
      getRepositoryToken(Resource),
    );
    const reservationRepo = this.app.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );

    // Usamos DELETE en lugar de TRUNCATE para evitar el error de Foreign Keys
    await reservationRepo.createQueryBuilder().delete().execute();
    await resourceRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
  }
}
