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
    @InjectModel(Personnel.name) private readonly personnelModel: Model<Personnel>,
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    @InjectModel(PerformanceEvaluation.name) private readonly performanceEvaluationModel: Model<PerformanceEvaluation>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async getDashboardAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalUsers = this.userModel.countDocuments();
    const totalPersonnel = this.personnelModel.countDocuments();
    const totalDepartments = this.departmentModel.countDocuments();
    const evaluationsThisMonth = this.performanceEvaluationModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const personnelByDepartment = this.personnelModel.aggregate([
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'departmentInfo' } },
      { $unwind: '$departmentInfo' },
      { $group: { _id: '$departmentInfo.name', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]);

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
    const recentActivities = this.auditLogModel.find().sort({ timestamp: -1 }).limit(5).populate('userId', 'email');

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
