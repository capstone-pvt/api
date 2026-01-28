import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Personnel } from '../personnel/schemas/personnel.schema';
import { Department } from '../departments/schemas/department.schema';
import { PerformanceEvaluation } from '../performance-evaluations/schemas/performance-evaluation.schema';
import { AuditLog } from '../audit-logs/schemas/audit-log.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Personnel.name)
    private readonly personnelModel: Model<Personnel>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
    @InjectModel(PerformanceEvaluation.name)
    private readonly performanceEvaluationModel: Model<PerformanceEvaluation>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async getDashboardAnalytics(departmentId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build filters based on department
    const personnelFilter = departmentId ? { department: departmentId } : {};

    const totalUsers = this.userModel.countDocuments();
    const totalPersonnel = this.personnelModel.countDocuments(personnelFilter);
    const totalDepartments = departmentId
      ? Promise.resolve(1) // Dean can only see their department
      : this.departmentModel.countDocuments();

    // For evaluations, we need to filter by personnel in the department
    let evaluationsThisMonth;
    if (departmentId) {
      const personnelInDept = await this.personnelModel
        .find(personnelFilter)
        .select('_id')
        .exec();
      const personnelIds = personnelInDept.map((p) => p._id);

      evaluationsThisMonth = this.performanceEvaluationModel.countDocuments({
        personnel: { $in: personnelIds },
        createdAt: { $gte: thirtyDaysAgo },
      });
    } else {
      evaluationsThisMonth = this.performanceEvaluationModel.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });
    }

    // Personnel by department aggregation
    const personnelByDepartmentPipeline: any[] = [];
    if (departmentId) {
      personnelByDepartmentPipeline.push({ $match: personnelFilter });
    }
    personnelByDepartmentPipeline.push(
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo',
        },
      },
      { $unwind: '$departmentInfo' },
      { $group: { _id: '$departmentInfo.name', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    );

    const personnelByDepartment = this.personnelModel.aggregate(
      personnelByDepartmentPipeline,
    );

    const userSignups = this.userModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // --- Correcting the populate path from 'user' to 'userId' ---
    const recentActivities = this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('userId', 'email');

    const [
      users,
      personnel,
      departments,
      evalsMonth,
      personnelDept,
      signups,
      activities,
    ] = await Promise.all([
      totalUsers,
      totalPersonnel,
      totalDepartments,
      evaluationsThisMonth,
      personnelByDepartment,
      userSignups,
      recentActivities,
    ]);

    return {
      stats: {
        totalUsers: users,
        totalPersonnel: personnel,
        totalDepartments: departments,
        evaluationsThisMonth: evalsMonth,
      },
      personnelByDepartment: personnelDept,
      userSignups: signups,
      recentActivities: activities,
    };
  }
}
