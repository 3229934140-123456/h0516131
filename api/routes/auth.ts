import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, rowToUser } from '@api/db/index';
import { MOCK_USER } from '@shared/mockData';
import type { User } from '@shared/types';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mock-jwt-secret-for-development';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = MOCK_USER;
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (row) {
      req.user = rowToUser(row);
    } else {
      req.user = MOCK_USER;
    }
  } catch {
    req.user = MOCK_USER;
  }

  next();
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      error: '邮箱不能为空',
    });
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  let user: User;
  if (row) {
    user = rowToUser(row);
  } else {
    user = MOCK_USER;
  }

  const token = generateToken(user);

  res.json({
    success: true,
    data: {
      token,
      user,
    },
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: req.user || MOCK_USER,
  });
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '登出成功',
  });
});

export default router;
