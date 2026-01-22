import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing roles.read permission',
  })
  @Get()
  @RequirePermission('roles.read')
  async findAll() {
    const roles = await this.rolesService.findAll();

    return {
      success: true,
      data: {
        roles,
      },
    };
  }

  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Role with this name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing roles.create permission',
  })
  @Post()
  @RequirePermission('roles.create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    // Check if role with same name already exists
    const existingRole = await this.rolesService.findByName(createRoleDto.name);

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = await this.rolesService.create(createRoleDto);

    return {
      success: true,
      message: 'Role created successfully',
      data: {
        role,
      },
    };
  }

  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing roles.read permission',
  })
  @Get(':id')
  @RequirePermission('roles.read')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      success: true,
      data: {
        role,
      },
    };
  }

  @ApiOperation({ summary: 'Update role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot update system roles' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing roles.update permission',
  })
  @Put(':id')
  @RequirePermission('roles.update')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent updating system roles
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot update system roles');
    }

    const updatedRole = await this.rolesService.update(id, updateRoleDto);

    return {
      success: true,
      message: 'Role updated successfully',
      data: {
        role: updatedRole,
      },
    };
  }

  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system roles' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing roles.delete permission',
  })
  @Delete(':id')
  @RequirePermission('roles.delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.rolesService.delete(id);

    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}
