import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';

describe('ResourcesController', () => {
  let controller: ResourcesController;
  let resourcesService: any;

  const mockResource: ResourceResponseDto = {
    id: '8cfd4286-d408-4603-b4c6-073fc609059a',
    name: 'Sala de Conferencias A',
    type: 'meeting_room',
    capacity: 20,
    isActive: true,
    createdAt: new Date('2026-09-02T19:17:26.721Z'),
    updatedAt: new Date('2026-09-02T19:17:26.721Z'),
  };

  beforeEach(async () => {
    resourcesService = {
      create: jest.fn().mockResolvedValue(mockResource),
      findAll: jest.fn().mockResolvedValue([mockResource]),
      findOne: jest.fn().mockResolvedValue(mockResource),
      update: jest.fn().mockResolvedValue(mockResource),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: resourcesService,
        },
      ],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the service and return the created resource', async () => {
      const dto: CreateResourceDto = {
        name: 'Sala de Conferencias A',
        type: 'meeting_room',
        capacity: 20,
      };

      const result = await controller.create(dto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourcesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResource);
    });
  });

  describe('findAll', () => {
    it('should return an array of resources', async () => {
      const result = await controller.findAll();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourcesService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockResource]);
    });
  });

  describe('findOne', () => {
    it('should call the service with the id', async () => {
      const result = await controller.findOne(mockResource.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourcesService.findOne).toHaveBeenCalledWith(mockResource.id);
      expect(result).toEqual(mockResource);
    });
  });

  describe('update', () => {
    it('should call the service with id and dto', async () => {
      const updateDto: UpdateResourceDto = { name: 'Sala de Conferencias B' };

      const result = await controller.update(mockResource.id, updateDto);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourcesService.update).toHaveBeenCalledWith(
        mockResource.id,
        updateDto,
      );
      expect(result).toEqual(mockResource);
    });
  });

  describe('remove', () => {
    it('should call the service with id and return void', async () => {
      await controller.remove(mockResource.id);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(resourcesService.remove).toHaveBeenCalledWith(mockResource.id);
    });
  });
});
