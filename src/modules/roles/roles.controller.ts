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
} from '../../common/filters/http-exception.filter';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

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

  @Post()
  @RequirePermission('roles.create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    // Check if role with same name already exists
    const existingRole = await this.rolesService.findByName(
      createRoleDto.name,
    );

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

  @Put(':id')
  @RequirePermission('roles.update')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
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
