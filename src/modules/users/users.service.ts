import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si ya existe un usuario con el mismo email
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `User with email "${createUserDto.email}" already exists`,
      );
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userRepository.findByIds(ids);
  }
}
