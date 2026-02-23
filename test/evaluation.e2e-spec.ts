import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';

/**
 * E2E: Evaluation flows
 * - As student: submit evaluation for a subject teacher
 * - As Dean: generate evaluation report (average by item, summary)
 *
 * Prerequisites: run migrations and seeds so that:
 * - There are users with role 'student' and at least one with role 'dean'
 * - There is at least one evaluation form
 * - Optionally run seed:evaluation-forms to create form + 5 student responses
 *
 * Test users (from fake-data migration): password P@ssw0rd123
 * - Dean: daisa.gupit@jcd.edu
 * - Super Admin (to list users): superadmin@jcd.edu
 */
describe('Evaluation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = (path: string) => `/api${path}`;

  function extractCookies(res: request.Response): string[] {
    const setCookie = res.headers['set-cookie'];
    return Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  }

  function cookieHeader(cookies: string[]): string {
    return cookies
      .map((c) => c.split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
  }

  it('as student: can submit an evaluation for a teacher', async () => {
    // 1) Login as superadmin to get a student email and a form id
    const loginAdmin = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send({ email: 'superadmin@jcd.edu', password: 'P@ssw0rd123' })
      .expect(201);

    const adminCookies = extractCookies(loginAdmin);
    const adminCookie = cookieHeader(adminCookies);

    const usersRes = await request(app.getHttpServer())
      .get(api('/users?role=student&limit=1&page=1'))
      .set('Cookie', adminCookie)
      .expect(200);

    const body = usersRes.body?.data ?? usersRes.body;
    const users = body?.users ?? [];
    if (users.length === 0) {
      console.warn('No student user in DB – skip student submit test. Run fake-data migration.');
      return;
    }

    const studentEmail = users[0].email;

    const formsRes = await request(app.getHttpServer())
      .get(api('/evaluation-forms'))
      .set('Cookie', adminCookie)
      .expect(200);

    const formsData = formsRes.body?.data ?? formsRes.body;
    const forms = Array.isArray(formsData) ? formsData : formsData?.forms ?? [];
    if (forms.length === 0) {
      console.warn('No evaluation form in DB – skip student submit test. Run seed:evaluation-forms.');
      return;
    }

    const formId = forms[0]._id;
    const form = forms[0];
    const sections = form.sections ?? [];
    const answers: { section: string; item: string; score: number }[] = [];
    sections.forEach((s: { title: string; items: string[] }) => {
      (s.items || []).forEach((item: string) => {
        answers.push({ section: s.title, item, score: 4 });
      });
    });

    // 2) Login as student
    const loginStudent = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send({ email: studentEmail, password: 'P@ssw0rd123' })
      .expect(201);

    const studentCookies = extractCookies(loginStudent);
    const studentCookie = cookieHeader(studentCookies);

    // 3) Submit evaluation
    const submitRes = await request(app.getHttpServer())
      .post(api('/evaluation-form-responses/submit'))
      .set('Cookie', studentCookie)
      .set('Content-Type', 'application/json')
      .send({
        formId,
        semester: '1st Semester 2024-2025',
        evaluator: 'Test Teacher',
        answers,
      });

    if (submitRes.status === 201 || submitRes.status === 200) {
      expect(submitRes.body?.data ?? submitRes.body).toBeDefined();
    } else {
      expect([200, 201]).toContain(submitRes.status);
    }
  });

  it('as Dean: can generate evaluation report (average by item, summary)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post(api('/auth/login'))
      .send({ email: 'daisa.gupit@jcd.edu', password: 'P@ssw0rd123' })
      .expect(201);

    const cookies = extractCookies(loginRes);
    const cookie = cookieHeader(cookies);

    const formsRes = await request(app.getHttpServer())
      .get(api('/evaluation-forms'))
      .set('Cookie', cookie)
      .expect(200);

    const formsData = formsRes.body?.data ?? formsRes.body;
    const forms = Array.isArray(formsData) ? formsData : formsData?.forms ?? [];
    if (forms.length === 0) {
      console.warn('No evaluation form in DB – skip Dean report test. Run seed:evaluation-forms.');
      return;
    }

    const formId = forms[0]._id;

    const reportRes = await request(app.getHttpServer())
      .get(api(`/evaluation-form-responses/${formId}/report`))
      .set('Cookie', cookie)
      .expect(200);

    const report = reportRes.body?.data ?? reportRes.body;
    expect(report).toBeDefined();
    expect(typeof report.totalResponses).toBe('number');
    expect(typeof report.overallAverageScore).toBe('number');
    expect(typeof report.overallPercentage).toBe('number');
    expect(Array.isArray(report.items)).toBe(true);
    report.items.forEach((item: { section: string; item: string; respondentCount: number; averageScore: number; percentage: number }) => {
      expect(item).toHaveProperty('section');
      expect(item).toHaveProperty('item');
      expect(typeof item.respondentCount).toBe('number');
      expect(typeof item.averageScore).toBe('number');
      expect(typeof item.percentage).toBe('number');
    });
  });
});
