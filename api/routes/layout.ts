import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToReportLayout } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { ReportLayout } from '@shared/types';

const router = Router();

router.get('/:id/layout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { version } = req.query;
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  let row;
  if (version) {
    row = db
      .prepare('SELECT * FROM report_layouts WHERE project_id = ? AND version = ?')
      .get(projectId, parseInt(version as string));
  } else {
    row = db
      .prepare('SELECT * FROM report_layouts WHERE project_id = ? ORDER BY version DESC LIMIT 1')
      .get(projectId);
  }

  if (!row) {
    res.json({
      success: true,
      data: null,
    });
    return;
  }

  const layout: ReportLayout = rowToReportLayout(row);

  res.json({
    success: true,
    data: layout,
  });
});

router.put('/:id/layout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { sections, pageSize } = req.body;
  const userId = req.user?.id || 'u-001';

  if (!sections) {
    res.status(400).json({
      success: false,
      error: '页面布局内容不能为空',
    });
    return;
  }

  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

  if (!project) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const now = new Date().toISOString();

  const latest = db
    .prepare('SELECT MAX(version) as max_version FROM report_layouts WHERE project_id = ?')
    .get(projectId) as { max_version: number | null };

  const newVersion = (latest.max_version ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO report_layouts (id, project_id, version, sections_json, page_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    uuidv4(),
    projectId,
    newVersion,
    JSON.stringify(sections),
    pageSize ?? 'A4',
    now,
  );

  db.prepare(
    `
    UPDATE projects
    SET updated_at = ?, last_edited_by = ?
    WHERE id = ?
  `,
  ).run(now, userId, projectId);

  const row = db
    .prepare('SELECT * FROM report_layouts WHERE project_id = ? AND version = ?')
    .get(projectId, newVersion);

  const layout: ReportLayout = rowToReportLayout(row);

  res.json({
    success: true,
    data: layout,
  });
});

export default router;
