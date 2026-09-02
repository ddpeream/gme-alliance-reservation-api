import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
  ) {}

  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    // Verificar si ya existe un recurso con el mismo nombre
    const existing = await this.resourceRepository.findOne({
      where: { name: createResourceDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Resource with name "${createResourceDto.name}" already exists`,
      );
    }

    const resource = this.resourceRepository.create(createResourceDto);
    return this.resourceRepository.save(resource);
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    return resource;
  }

  async update(
    id: string,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
    if (updateResourceDto.name && updateResourceDto.name !== resource.name) {
      const existing = await this.resourceRepository.findOne({
        where: { name: updateResourceDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Resource with name "${updateResourceDto.name}" already exists`,
        );
      }
    }

    Object.assign(resource, updateResourceDto);
    return this.resourceRepository.save(resource);
  }

  async remove(id: string): Promise<void> {
    const resource = await this.findOne(id);

    // Soft delete: solo desactivar en lugar de eliminar físicamente
    resource.isActive = false;
    await this.resourceRepository.save(resource);
  }

  async findByIds(ids: string[]): Promise<Resource[]> {
    return this.resourceRepository.findByIds(ids);
  }
}
