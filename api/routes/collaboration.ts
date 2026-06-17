import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToCollaborator, rowToUser } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import type { Collaborator, User } from '@shared/types';

const router = Router();

router.get('/:id/collaborators', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const rows = db
    .prepare(
      `
    SELECT c.*, u.id as user_id, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar, u.role as user_role, u.created_at as user_created_at
    FROM collaborators c
    JOIN users u ON c.user_id = u.id
    WHERE c.project_id = ?
    ORDER BY c.joined_at ASC
  `,
    )
    .all(projectId);

  const collaborators: Collaborator[] = rows.map((row: any) => {
    const user: User = {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      avatar: row.user_avatar ?? undefined,
      role: row.user_role,
      createdAt: row.user_created_at,
    };
    return rowToCollaborator(row, user);
  });

  res.json({
    success: true,
    data: collaborators,
  });
});

router.post('/:id/collaborators', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { userId, role, email } = req.body;
  const inviterId = req.user?.id || 'u-001';

  if (!role || !['data_manager', 'editor', 'viewer'].includes(role)) {
    res.status(400).json({
      success: false,
      error: '无效的角色类型',
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

  let targetUserId = userId;

  if (!targetUserId && email) {
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      targetUserId = `u-${uuidv4().slice(0, 8)}`;
      db.prepare(
        `
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, 'mock_hash', 'viewer', ?)
      `,
      ).run(targetUserId, email.split('@')[0], email, new Date().toISOString());
    }
  }

  if (!targetUserId) {
    res.status(400).json({
      success: false,
      error: '用户ID或邮箱不能为空',
    });
    return;
  }

  const existing = db
    .prepare('SELECT * FROM collaborators WHERE project_id = ? AND user_id = ?')
    .get(projectId, targetUserId);

  if (existing) {
    res.status(409).json({
      success: false,
      error: '该用户已是项目协作者',
    });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO collaborators (id, project_id, user_id, role, joined_at, invited_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(uuidv4(), projectId, targetUserId, role, now, inviterId);

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
  const user: User = rowToUser(userRow);

  const collabRow = db
    .prepare('SELECT * FROM collaborators WHERE project_id = ? AND user_id = ?')
    .get(projectId, targetUserId);

  const collaborator: Collaborator = rowToCollaborator(collabRow, user);

  res.status(201).json({
    success: true,
    data: collaborator,
  });
});

router.put('/:id/collaborators/:userId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId, userId } = req.params;
  const { role } = req.body;

  if (!role || !['data_manager', 'editor', 'viewer'].includes(role)) {
    res.status(400).json({
      success: false,
      error: '无效的角色类型',
    });
    return;
  }

  const db = getDb();

  const existing = db
    .prepare('SELECT * FROM collaborators WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '协作者不存在',
    });
    return;
  }

  db.prepare(
    `
    UPDATE collaborators
    SET role = ?
    WHERE project_id = ? AND user_id = ?
  `,
  ).run(role, projectId, userId);

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const user: User = rowToUser(userRow);

  const collabRow = db
    .prepare('SELECT * FROM collaborators WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);

  const collaborator: Collaborator = rowToCollaborator(collabRow, user);

  res.json({
    success: true,
    data: collaborator,
  });
});

router.delete('/:id/collaborators/:userId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId, userId } = req.params;
  const db = getDb();

  const existing = db
    .prepare('SELECT * FROM collaborators WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '协作者不存在',
    });
    return;
  }

  db.prepare('DELETE FROM collaborators WHERE project_id = ? AND user_id = ?').run(projectId, userId);

  res.json({
    success: true,
    message: '协作者已移除',
  });
});

export default router;
