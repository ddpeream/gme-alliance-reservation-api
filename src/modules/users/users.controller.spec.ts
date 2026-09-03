import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any; // Mock del servicio

  // Datos de prueba
  const mockUser: UserResponseDto = {
    id: '3c25d1fc-cad7-4a66-829a-33e77add5121',
    email: 'juan.perez@example.com',
    name: 'Juan Pérez',
    createdAt: new Date('2026-09-02T19:16:38.265Z'),
    updatedAt: new Date('2026-09-02T19:16:38.265Z'),
  };

  beforeEach(async () => {
    // Creamos un mock del servicio con las mismas funciones que tiene el real
    usersService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findAll: jest.fn().mockResolvedValue([mockUser]),
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the service and return the created user', async () => {
      const dto: CreateUserDto = {
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      };

      const result = await controller.create(dto);

      // Verificamos que el controlador llamó al servicio con el DTO correcto
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(usersService.create).toHaveBeenCalledWith(dto);
      // Verificamos que devolvió lo que el servicio le dio
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should call the service with the id and return the user', async () => {
      const id = '3c25d1fc-cad7-4a66-829a-33e77add5121';

      const result = await controller.findOne(id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(usersService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });
  });
});
