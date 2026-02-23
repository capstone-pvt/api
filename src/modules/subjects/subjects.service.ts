import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<SubjectDocument> {
    const subject = new this.subjectModel(createSubjectDto);
    return subject.save();
  }

  async findAll(): Promise<SubjectDocument[]> {
    return this.subjectModel
      .find()
      .populate('department')
      .populate('teacher')
      .sort({ code: 1 })
      .exec();
  }

  async findByDepartment(departmentId: string): Promise<SubjectDocument[]> {
    if (!Types.ObjectId.isValid(departmentId)) {
      return [];
    }
    return this.subjectModel
      .find({ department: new Types.ObjectId(departmentId), isActive: true })
      .populate('department')
      .populate('teacher')
      .sort({ code: 1 })
      .exec();
  }

  async findByDepartmentAndGradeLevel(
    departmentId: string,
    gradeLevel?: string,
    filterTeacherDepartment: boolean = false,
  ): Promise<SubjectDocument[]> {
    if (!Types.ObjectId.isValid(departmentId)) {
      return [];
    }
    const query: any = {
      department: new Types.ObjectId(departmentId),
      isActive: true,
    };
    if (gradeLevel) {
      query.gradeLevel = gradeLevel;
    }
    let subjects = await this.subjectModel
      .find(query)
      .populate('department')
      .populate({
        path: 'teacher',
        populate: { path: 'department' }
      })
      .sort({ code: 1 })
      .exec();

    // If filterTeacherDepartment is true, filter out subjects where teacher is from different department
    if (filterTeacherDepartment) {
      subjects = subjects.filter(subject => {
        // Keep subjects without teachers
        if (!subject.teacher) return true;

        // If teacher has a department, check if it matches the subject's department
        const teacherObj = subject.teacher as any;
        if (teacherObj.department) {
          const teacherDeptId = typeof teacherObj.department === 'string'
            ? teacherObj.department
            : teacherObj.department._id?.toString();
          const subjectDeptId = typeof subject.department === 'string'
            ? subject.department
            : (subject.department as any)._id?.toString();

          return teacherDeptId === subjectDeptId;
        }

        // Keep subjects where teacher doesn't have a department
        return true;
      });
    }

    return subjects;
  }

  async findOne(id: string): Promise<SubjectDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID');
    }
    const subject = await this.subjectModel
      .findById(id)
      .populate('department')
      .populate('teacher')
      .exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID');
    }
    const subject = await this.subjectModel
      .findByIdAndUpdate(id, updateSubjectDto, { new: true })
      .populate('department')
      .populate('teacher')
      .exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID');
    }
    const result = await this.subjectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Subject not found');
    }
  }
}
