import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resource' })
  @ApiResponse({ status: 201, type: ResourceResponseDto })
  @ApiResponse({ status: 409, description: 'Resource name already exists' })
  async create(
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active resources' })
  @ApiResponse({ status: 200, type: [ResourceResponseDto] })
  async findAll(): Promise<ResourceResponseDto[]> {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a resource by ID' })
  @ApiResponse({ status: 200, type: ResourceResponseDto })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findOne(@Param('id') id: string): Promise<ResourceResponseDto> {
    return this.resourcesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a resource' })
  @ApiResponse({ status: 200, type: ResourceResponseDto })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @ApiResponse({ status: 409, description: 'Resource name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a resource (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Resource deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.resourcesService.remove(id);
  }
}
