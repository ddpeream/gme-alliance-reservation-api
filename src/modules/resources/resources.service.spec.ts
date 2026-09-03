import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let resourceRepository: any;

  const mockResource: Resource = {
    id: '8cfd4286-d408-4603-b4c6-073fc609059a',
    name: 'Sala de Conferencias A',
    type: 'meeting_room',
    capacity: 20,
    isActive: true,
    createdAt: new Date('2026-09-02T19:17:26.721Z'),
    updatedAt: new Date('2026-09-02T19:17:26.721Z'),
  } as Resource;

  beforeEach(async () => {
    resourceRepository = {
      create: jest.fn().mockImplementation((dto: CreateResourceDto) => {
        return { ...dto, isActive: true } as Resource;
      }),
      save: jest.fn().mockImplementation((resource: Resource) => {
        return Promise.resolve({
          ...resource,
          id: mockResource.id,
          createdAt: mockResource.createdAt,
          updatedAt: mockResource.updatedAt,
        });
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: getRepositoryToken(Resource),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: resourceRepository,
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new resource successfully', async () => {
      const dto: CreateResourceDto = {
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.create).toHaveBeenCalledWith(dto);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.save).toHaveBeenCalled();

      expect(result).toEqual(mockResource);
    });

    it('should throw ConflictException if resource name already exists', async () => {
      const dto: CreateResourceDto = {
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne.mockResolvedValue(mockResource);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return active resources sorted by name', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.find.mockResolvedValue([mockResource]);

      const result = await service.findAll();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockResource]);
    });
  });

  describe('findOne', () => {
    it('should return a resource by id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne.mockResolvedValue(mockResource);

      const result = await service.findOne(mockResource.id);

      expect(result).toEqual(mockResource);
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a resource name if no conflict exists', async () => {
      const updateDto: UpdateResourceDto = { name: 'Sala de Conferencias B' };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne
        .mockResolvedValueOnce({ ...mockResource })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce(null);

      const result = await service.update(mockResource.id, updateDto);

      expect(result.name).toEqual('Sala de Conferencias B');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if updating to an existing name', async () => {
      const updateDto: UpdateResourceDto = { name: 'Sala de Conferencias B' };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne
        .mockResolvedValueOnce({ ...mockResource })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .mockResolvedValueOnce({
          ...mockResource,
          name: 'Sala de Conferencias B',
        });

      await expect(service.update(mockResource.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a resource (set isActive to false)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findOne.mockResolvedValue(mockResource);

      await service.remove(mockResource.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourceRepository.save).toHaveBeenCalledWith({
        ...mockResource,
        isActive: false,
      });
    });
  });

  describe('findByIds', () => {
    it('should return resources by ids', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      resourceRepository.findByIds.mockResolvedValue([mockResource]);

      const result = await service.findByIds([mockResource.id]);

      expect(result).toEqual([mockResource]);
    });
  });
});
