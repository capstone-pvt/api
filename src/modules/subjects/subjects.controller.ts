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
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Controller('subjects')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @RequirePermission('subjects.create')
  create(@Body() createSubjectDto: CreateSubjectDto, @GetUser() user: AuthenticatedUser) {
    // Deans can only create subjects in their own department
    const isDean = user.roles.some((r) => r.toLowerCase() === 'dean');
    if (isDean && user.department && createSubjectDto.department !== user.department) {
      throw new ForbiddenException('You can only create subjects in your own department');
    }
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @GetUser() user?: AuthenticatedUser,
  ) {
    // Check if user is a student
    const isStudent = user?.roles?.some((r) => r.toLowerCase() === 'student');

    // Students can access subjects in their department without permission
    if (isStudent && user?.department) {
      // Students can only see subjects in their department and grade level
      // Filter to ensure teachers are also from the same department
      return this.subjectsService.findByDepartmentAndGradeLevel(
        user.department,
        user.gradeLevel,
        true, // filterTeacherDepartment = true for students
      );
    }

    // For non-students, check permission
    const hasPermission = user?.permissions?.includes('subjects.read');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view subjects');
    }

    // Deans can only see subjects in their own department
    const isDean = user?.roles?.some((r) => r.toLowerCase() === 'dean');
    const effectiveDepartmentId = isDean && user?.department
      ? user.department
      : departmentId;

    if (effectiveDepartmentId) {
      return this.subjectsService.findByDepartmentAndGradeLevel(effectiveDepartmentId, gradeLevel, false);
    }
    return this.subjectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @RequirePermission('subjects.update')
  async update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    // Deans can only update subjects in their own department
    const isDean = user.roles.some((r) => r.toLowerCase() === 'dean');
    if (isDean && user.department) {
      const subject = await this.subjectsService.findOne(id);
      const subjectDepartmentId = typeof subject.department === 'string'
        ? subject.department
        : (subject.department as any)._id?.toString();

      if (subjectDepartmentId !== user.department) {
        throw new ForbiddenException('You can only update subjects in your own department');
      }

      // Also prevent changing department to a different one
      if (updateSubjectDto.department && updateSubjectDto.department !== user.department) {
        throw new ForbiddenException('You cannot change the subject to a different department');
      }
    }
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @RequirePermission('subjects.delete')
  async remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    // Deans can only delete subjects in their own department
    const isDean = user.roles.some((r) => r.toLowerCase() === 'dean');
    if (isDean && user.department) {
      const subject = await this.subjectsService.findOne(id);
      const subjectDepartmentId = typeof subject.department === 'string'
        ? subject.department
        : (subject.department as any)._id?.toString();

      if (subjectDepartmentId !== user.department) {
        throw new ForbiddenException('You can only delete subjects in your own department');
      }
    }
    return this.subjectsService.remove(id);
  }
}
