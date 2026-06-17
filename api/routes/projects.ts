import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToProject } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { Project } from '@shared/types';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const userId = req.user?.id || 'u-001';

  const rows = db
    .prepare(
      `
    SELECT p.* FROM projects p
    LEFT JOIN collaborators c ON p.id = c.project_id AND c.user_id = ?
    WHERE p.owner_id = ? OR c.user_id IS NOT NULL
    ORDER BY p.updated_at DESC
  `,
    )
    .all(userId, userId);

  const projects: Project[] = rows.map((row) => rowToProject(row));

  res.json({
    success: true,
    data: projects,
  });
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

  if (!row) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const project: Project = rowToProject(row);

  res.json({
    success: true,
    data: project,
  });
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, templateId, customTheme, coverImage } = req.body;
  const userId = req.user?.id || 'u-001';

  if (!name || !templateId) {
    res.status(400).json({
      success: false,
      error: '项目名称和模板ID不能为空',
    });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const id = `proj-${uuidv4().slice(0, 8)}`;

  db.prepare(
    `
    INSERT INTO projects (id, name, description, cover_image, template_id, custom_theme_json, status, owner_id, created_at, updated_at, last_edited_by)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
  `,
  ).run(
    id,
    name,
    description ?? null,
    coverImage ?? null,
    templateId,
    customTheme ? JSON.stringify(customTheme) : null,
    userId,
    now,
    now,
    userId,
  );

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  const project: Project = rowToProject(row);

  res.status(201).json({
    success: true,
    data: project,
  });
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, templateId, customTheme, status, coverImage } = req.body;
  const userId = req.user?.id || 'u-001';

  const db = getDb();
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE projects
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        template_id = COALESCE(?, template_id),
        custom_theme_json = COALESCE(?, custom_theme_json),
        status = COALESCE(?, status),
        updated_at = ?,
        last_edited_by = ?
    WHERE id = ?
  `,
  ).run(
    name ?? null,
    description ?? null,
    coverImage ?? null,
    templateId ?? null,
    customTheme ? JSON.stringify(customTheme) : null,
    status ?? null,
    now,
    userId,
    id,
  );

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  const project: Project = rowToProject(row);

  res.json({
    success: true,
    data: project,
  });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);

  res.json({
    success: true,
    message: '项目已删除',
  });
});

export default router;
