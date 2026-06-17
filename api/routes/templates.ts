import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToTemplate } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { Template } from '@shared/types';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { category } = req.query;
  const db = getDb();

  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY created_at DESC').all(category);
  } else {
    rows = db.prepare('SELECT * FROM templates ORDER BY is_custom ASC, created_at DESC').all();
  }

  const templates: Template[] = rows.map((row) => rowToTemplate(row));

  res.json({
    success: true,
    data: templates,
  });
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();

  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);

  if (!row) {
    res.status(404).json({
      success: false,
      error: '模板不存在',
    });
    return;
  }

  const template: Template = rowToTemplate(row);

  res.json({
    success: true,
    data: template,
  });
});

router.post('/custom', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, category, thumbnailUrl, theme } = req.body;
  const userId = req.user?.id || 'u-001';

  if (!name || !theme) {
    res.status(400).json({
      success: false,
      error: '模板名称和主题配置不能为空',
    });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const id = `tpl-custom-${uuidv4().slice(0, 8)}`;

  db.prepare(
    `
    INSERT INTO templates (id, name, category, thumbnail_url, theme_json, is_custom, creator_id, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `,
  ).run(
    id,
    name,
    category ?? '自定义',
    thumbnailUrl ?? null,
    JSON.stringify(theme),
    userId,
    now,
  );

  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  const template: Template = rowToTemplate(row);

  res.status(201).json({
    success: true,
    data: template,
  });
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '模板不存在',
    });
    return;
  }

  if ((existing as any).is_custom !== 1) {
    res.status(403).json({
      success: false,
      error: '不能删除系统内置模板',
    });
    return;
  }

  db.prepare('DELETE FROM templates WHERE id = ?').run(id);

  res.json({
    success: true,
    message: '模板已删除',
  });
});

export default router;
