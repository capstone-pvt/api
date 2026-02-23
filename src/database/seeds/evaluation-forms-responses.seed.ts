import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { EvaluationFormsService } from '../../modules/evaluation-forms/evaluation-forms.service';
import { EvaluationFormResponsesService } from '../../modules/evaluation-form-responses/evaluation-form-responses.service';
import { UsersService } from '../../modules/users/users.service';
import { PersonnelService } from '../../modules/personnel/personnel.service';
import { Logger } from '@nestjs/common';
import { DEFAULT_TEACHING_SECTIONS } from '../../modules/evaluation-forms/constants/default-teaching-sections';
import type { EvaluationFormDocument } from '../../modules/evaluation-forms/schemas/evaluation-form.schema';
import type { UserDocument } from '../../modules/users/schemas/user.schema';
import type { Personnel } from '../../modules/personnel/schemas/personnel.schema';

const logger = new Logger('EvaluationFormsResponsesSeeder');

const DEFAULT_SCALE = [
  { value: 5, label: 'Outstanding' },
  { value: 4, label: 'Very Good' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Fair' },
  { value: 1, label: 'Needs Improvement' },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const evaluationFormsService = app.get(EvaluationFormsService);
    const evaluationFormResponsesService = app.get(EvaluationFormResponsesService);
    const usersService = app.get(UsersService);
    const personnelService = app.get(PersonnelService);

    logger.log('Seeding evaluation forms and responses...');

    // 1. Find or create one teaching evaluation form (with Other in evaluator options)
    const existingForms = await evaluationFormsService.findAll();
    let form = existingForms.find(
      (f) => f.audience === 'teaching' && f.name.includes('Student'),
    ) as EvaluationFormDocument | undefined;

    if (!form) {
      const created = await evaluationFormsService.create({
        name: 'Teaching Performance Evaluation (Students)',
        audience: 'teaching',
        description: 'Student evaluation of teaching performance.',
        evaluatorOptions: ['Student', 'Other'],
        scale: DEFAULT_SCALE,
        sections: DEFAULT_TEACHING_SECTIONS.map(({ key, title, items }) => ({
          key,
          title,
          items,
        })),
      });
      form = created as EvaluationFormDocument;
      logger.log(`Created evaluation form: ${form.name}`);
    } else {
      logger.log(`Using existing evaluation form: ${form.name}`);
    }

    const formId = (form as EvaluationFormDocument)._id.toString();

    // 2. Find 5 students
    const { users: studentUsers } = await usersService.findAll({
      role: 'student',
      limit: 5,
      page: 1,
    });

    if (studentUsers.length === 0) {
      logger.warn('No students found. Run the fake-data migration first (roles + users with role student).');
      await app.close();
      process.exit(0);
      return;
    }

    logger.log(`Found ${studentUsers.length} student(s)`);

    // 3. Find one teaching personnel (teacher to be evaluated)
    const allPersonnel = await personnelService.findAll();
    const teacher = allPersonnel.find(
      (p) => (p as Personnel).personnelType === 'Teaching',
    ) || allPersonnel[0];

    if (!teacher) {
      logger.warn('No personnel found. Run the fake-data migration first.');
      await app.close();
      process.exit(0);
      return;
    }

    const evaluatorName = `${(teacher as Personnel).firstName} ${(teacher as Personnel).lastName}`;
    logger.log(`Teacher to be evaluated: ${evaluatorName}`);

    // 4. Build answers for all section items from the form (same structure for every response)
    const sections =
      (form as EvaluationFormDocument).sections ||
      DEFAULT_TEACHING_SECTIONS.map(({ key, title, items }) => ({ key, title, items }));
    const allItems: { section: string; item: string }[] = [];
    sections.forEach((section: { title: string; items: string[] }) => {
      (section.items || []).forEach((item: string) => {
        allItems.push({ section: section.title, item });
      });
    });

    const semesterLabel = '1st Semester 2024-2025';

    // 5. Create one response per student (5 responses)
    let created = 0;
    for (const student of studentUsers as UserDocument[]) {
      const studentObj = student.toObject ? student.toObject() : student;
      const departmentId =
        typeof studentObj.department === 'object' && studentObj.department?._id
          ? studentObj.department._id.toString()
          : studentObj.department?.toString?.() || undefined;

      const answers = allItems.map(({ section, item }) => ({
        section,
        item,
        score: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5
      }));

      try {
        await evaluationFormResponsesService.createResponse(
          {
            formId,
            semester: semesterLabel,
            evaluator: evaluatorName,
            answers,
          },
          {
            fullName: `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim(),
            email: studentObj.email,
            department: departmentId,
          },
        );
        created++;
        logger.log(`  Created response for student: ${studentObj.email}`);
      } catch (err) {
        logger.warn(`  Skip response for ${studentObj.email}: ${(err as Error).message}`);
      }
    }

    logger.log(`✅ Evaluation forms and responses seeding done. Created ${created} responses.`);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
