import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToPublication, rowToReportLayout, rowToProject, rowToTemplate, rowToDataSource } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { Publication, ReportLayout, Project, Template, PageSection } from '@shared/types';

const router = Router();

router.post('/:id/publish/web', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { password, expiresAt } = req.body;
  const publisherId = req.user?.id || 'u-001';

  const db = getDb();
  const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

  if (!projectRow) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const now = new Date().toISOString();
  const publishId = `pub-${uuidv4().slice(0, 10)}`;

  const existingPubs = db
    .prepare('SELECT MAX(version) as max_ver FROM publications WHERE project_id = ? AND type = ?')
    .get(projectId, 'web') as { max_ver: number | null };

  const version = (existingPubs.max_ver ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO publications (id, project_id, publish_id, version, type, url, password_hash, expires_at, published_at, published_by)
    VALUES (?, ?, ?, ?, 'web', ?, ?, ?, ?, ?)
  `,
  ).run(
    uuidv4(),
    projectId,
    publishId,
    version,
    `/view/${publishId}`,
    password ?? null,
    expiresAt ?? null,
    now,
    publisherId,
  );

  db.prepare(
    `
    UPDATE projects
    SET status = 'published', updated_at = ?, last_edited_by = ?
    WHERE id = ?
  `,
  ).run(now, publisherId, projectId);

  const row = db.prepare('SELECT * FROM publications WHERE publish_id = ?').get(publishId);
  const publication: Publication = rowToPublication(row);

  res.status(201).json({
    success: true,
    data: publication,
  });
});

router.post('/:id/export/pdf', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const publisherId = req.user?.id || 'u-001';

  const db = getDb();
  const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

  if (!projectRow) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const now = new Date().toISOString();
  const publishId = `pdf-${uuidv4().slice(0, 10)}`;

  const existingPubs = db
    .prepare('SELECT MAX(version) as max_ver FROM publications WHERE project_id = ? AND type = ?')
    .get(projectId, 'pdf') as { max_ver: number | null };

  const version = (existingPubs.max_ver ?? 0) + 1;
  const pdfPath = `/exports/${projectId}-v${version}.pdf`;

  db.prepare(
    `
    INSERT INTO publications (id, project_id, publish_id, version, type, pdf_path, published_at, published_by)
    VALUES (?, ?, ?, ?, 'pdf', ?, ?, ?)
  `,
  ).run(uuidv4(), projectId, publishId, version, pdfPath, now, publisherId);

  const row = db.prepare('SELECT * FROM publications WHERE publish_id = ?').get(publishId);
  const publication: Publication = rowToPublication(row);

  res.status(201).json({
    success: true,
    data: publication,
    message: 'PDF导出任务已创建，文件将在处理完成后可用',
  });
});

router.get('/publish/:publishId', async (req: Request, res: Response): Promise<void> => {
  const { publishId } = req.params;
  const { password } = req.body;

  const db = getDb();
  const pubRow = db.prepare('SELECT * FROM publications WHERE publish_id = ?').get(publishId);

  if (!pubRow) {
    res.status(404).json({
      success: false,
      error: '发布内容不存在',
    });
    return;
  }

  const pub = pubRow as any;
  if (pub.expires_at && new Date(pub.expires_at) < new Date()) {
    res.status(410).json({
      success: false,
      error: '该发布内容已过期',
    });
    return;
  }

  if (pub.password_hash && pub.password_hash !== password) {
    res.status(401).json({
      success: false,
      error: '访问密码错误',
      requirePassword: true,
    });
    return;
  }

  const publication: Publication = rowToPublication(pubRow);

  const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(publication.projectId);
  const project: Project = rowToProject(projectRow);

  let template: Template | null = null;
  if (project.templateId) {
    const tplRow = db.prepare('SELECT * FROM templates WHERE id = ?').get(project.templateId);
    if (tplRow) {
      template = rowToTemplate(tplRow);
    }
  }

  const layoutRow = db
    .prepare('SELECT * FROM report_layouts WHERE project_id = ? ORDER BY version DESC LIMIT 1')
    .get(publication.projectId);

  let sections: PageSection[] = [];
  if (layoutRow) {
    const layout: ReportLayout = rowToReportLayout(layoutRow);
    sections = layout.sections;
  }

  const dataSourceRows = db
    .prepare('SELECT * FROM data_sources WHERE project_id = ?')
    .all(publication.projectId);

  const dataSources = dataSourceRows.map((row) => {
    const ds = rowToDataSource(row);
    return {
      id: ds.id,
      name: ds.name,
      fields: ds.fields,
      rows: ds.rows,
    };
  });

  res.json({
    success: true,
    data: {
      publication,
      project,
      template,
      sections,
      dataSources,
    },
  });
});

router.get('/:id/publications', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const db = getDb();

  const rows = db
    .prepare('SELECT * FROM publications WHERE project_id = ? ORDER BY published_at DESC')
    .all(projectId);

  const publications: Publication[] = rows.map((row) => rowToPublication(row));

  res.json({
    success: true,
    data: publications,
  });
});

export default router;
