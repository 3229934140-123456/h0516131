import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { getDb, rowToDataSource } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { DataSource, DataField } from '@shared/types';

const router = Router();

router.get('/:projectId/data', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const db = getDb();

  const rows = db
    .prepare('SELECT * FROM data_sources WHERE project_id = ? ORDER BY imported_at DESC')
    .all(projectId);

  const dataSources: DataSource[] = rows.map((row) => rowToDataSource(row));

  res.json({
    success: true,
    data: dataSources,
  });
});

router.post('/:id/import', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { name, fileName, fields, rows } = req.body;
  const userId = req.user?.id || 'u-001';

  if (!name || !fileName || !fields || !rows) {
    res.status(400).json({
      success: false,
      error: '数据源名称、文件名、字段和数据不能为空',
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
  const dataId = `ds-${uuidv4().slice(0, 8)}`;
  const fileContent = JSON.stringify({ fields, rows });
  const fileHash = CryptoJS.MD5(fileContent).toString();

  db.prepare(
    `
    INSERT INTO data_sources (id, project_id, name, file_name, fields_json, rows_json, row_count, file_hash, imported_at, imported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    dataId,
    projectId,
    name,
    fileName,
    JSON.stringify(fields as DataField[]),
    JSON.stringify(rows),
    Array.isArray(rows) ? rows.length : 0,
    fileHash,
    now,
    userId,
  );

  const row = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(dataId);
  const dataSource: DataSource = rowToDataSource(row);

  res.status(201).json({
    success: true,
    data: dataSource,
  });
});

router.get('/:projectId/data/:sourceId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, sourceId } = req.params;
  const db = getDb();

  const row = db
    .prepare('SELECT * FROM data_sources WHERE id = ? AND project_id = ?')
    .get(sourceId, projectId);

  if (!row) {
    res.status(404).json({
      success: false,
      error: '数据源不存在',
    });
    return;
  }

  const dataSource: DataSource = rowToDataSource(row);

  res.json({
    success: true,
    data: dataSource,
  });
});

router.delete('/:projectId/data/:sourceId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, sourceId } = req.params;
  const db = getDb();

  const existing = db
    .prepare('SELECT * FROM data_sources WHERE id = ? AND project_id = ?')
    .get(sourceId, projectId);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '数据源不存在',
    });
    return;
  }

  db.prepare('DELETE FROM data_sources WHERE id = ?').run(sourceId);

  res.json({
    success: true,
    message: '数据源已删除',
  });
});

export default router;
