import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import type { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '../../common/filters/http-exception.filter';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.read permission',
  })
  @Get()
  @RequirePermission('users.read')
  async findAll(@Query() filters: UserFiltersDto) {
    const { users, total, page, limit, totalPages } =
      await this.usersService.findAll(filters);

    return {
      success: true,
      data: {
        users: users.map((user) => this.sanitizeUser(user)),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    };
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.create permission',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post()
  @RequirePermission('users.create')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return {
      success: true,
      message: 'User created successfully',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.read permission',
  })
  @Get(':id')
  @RequirePermission('users.read')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  @ApiOperation({ summary: 'Update user by ID (self or with permission)' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update other users without permission',
  })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    // Users can update their own profile, or need users.update permission
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is updating themselves
    const isSelf = currentUser.userId === id;

    // If not updating themselves, check permission
    if (!isSelf && !currentUser.permissions.includes('users.update')) {
      throw new UnauthorizedException(
        'You can only update your own profile or need users.update permission',
      );
    }

    // If updating roles or isActive, require users.update permission
    if (
      (updateUserDto.roles || updateUserDto.isActive !== undefined) &&
      !currentUser.permissions.includes('users.update')
    ) {
      throw new UnauthorizedException(
        'Only administrators can update roles or active status',
      );
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        user: this.sanitizeUser(updatedUser),
      },
    };
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete own account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.delete permission',
  })
  @Delete(':id')
  @RequirePermission('users.delete')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    // Prevent users from deleting themselves
    if (currentUser.userId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.delete(id);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: AssignRolesDto })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing users.update permission',
  })
  @Put(':id/roles')
  @RequirePermission('users.update')
  async assignRoles(
    @Param('id') id: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersService.updateRoles(
      id,
      assignRolesDto.roleIds,
    );

    return {
      success: true,
      message: 'User roles updated successfully',
      data: {
        user: this.sanitizeUser(updatedUser),
      },
    };
  }

  private sanitizeUser(user: any): any {
    const sanitized = user.toObject ? user.toObject() : user;
    const {
      password: _password,
      passwordResetToken: _passwordResetToken,
      emailVerificationToken: _emailVerificationToken,
      ...rest
    } = sanitized;
    return rest;
  }
}
