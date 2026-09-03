import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Definimos el mock sin tipos estrictos para evitar conflictos con TypeORM
describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any; // Usamos 'any' para evitar peleas con los tipos complejos del repositorio

  const mockUser: User = {
    id: '3c25d1fc-cad7-4a66-829a-33e77add5121',
    email: 'juan.perez@example.com',
    name: 'Juan Pérez',
    createdAt: new Date('2026-09-02T19:16:38.265Z'),
    updatedAt: new Date('2026-09-02T19:16:38.265Z'),
  } as User;

  beforeEach(async () => {
    userRepository = {
      create: jest.fn().mockImplementation((dto: CreateUserDto) => {
        return { ...dto };
      }),
      save: jest.fn().mockImplementation((user: User) => {
        return Promise.resolve({
          ...user,
          id: mockUser.id,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        });
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully and return it', async () => {
      const dto: CreateUserDto = {
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.create).toHaveBeenCalledWith(dto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.save).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockUser.id,
        email: dto.email,
        name: dto.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw a ConflictException if the email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'juan.perez@example.com',
        name: 'Juan Pérez',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw a NotFoundException if user does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
