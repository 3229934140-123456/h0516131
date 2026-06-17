import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToVisitRecord } from '@api/db/index';
import { authMiddleware, type AuthRequest } from '@api/routes/auth';
import { MOCK_ANALYTICS } from '@shared/mockData';
import type { VisitRecord, AnalyticsSummary } from '@shared/types';

const router = Router();

router.post('/publish/:publishId/track', async (req: Request, res: Response): Promise<void> => {
  const { publishId } = req.params;
  const {
    visitorId,
    ip,
    userAgent,
    referrer,
    country,
    deviceType,
    startTime,
    endTime,
    totalDuration,
    scrollDepth,
    sectionDurations,
    downloadedPdf,
  } = req.body;

  if (!visitorId || !startTime) {
    res.status(400).json({
      success: false,
      error: '访客ID和开始时间不能为空',
    });
    return;
  }

  const db = getDb();

  const publication = db.prepare('SELECT * FROM publications WHERE publish_id = ?').get(publishId);
  if (!publication) {
    res.status(404).json({
      success: false,
      error: '发布记录不存在',
    });
    return;
  }

  const id = uuidv4();

  db.prepare(
    `
    INSERT INTO visit_records (
      id, publish_id, visitor_id, ip, user_agent, referrer, country, device_type,
      start_time, end_time, total_duration_ms, scroll_depth_percent,
      section_durations_json, downloaded_pdf
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    publishId,
    visitorId,
    ip ?? null,
    userAgent ?? null,
    referrer ?? null,
    country ?? null,
    deviceType ?? null,
    startTime,
    endTime ?? null,
    totalDuration ?? 0,
    scrollDepth ?? 0,
    sectionDurations ? JSON.stringify(sectionDurations) : null,
    downloadedPdf ? 1 : 0,
  );

  const row = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
  const record: VisitRecord = rowToVisitRecord(row);

  res.status(201).json({
    success: true,
    data: record,
  });
});

router.put('/publish/:publishId/track/:visitorId', async (req: Request, res: Response): Promise<void> => {
  const { publishId, visitorId } = req.params;
  const { endTime, totalDuration, scrollDepth, sectionDurations, downloadedPdf } = req.body;

  const db = getDb();

  const existing = db
    .prepare(
      `
    SELECT * FROM visit_records
    WHERE publish_id = ? AND visitor_id = ?
    ORDER BY start_time DESC
    LIMIT 1
  `,
    )
    .get(publishId, visitorId);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: '访问记录不存在',
    });
    return;
  }

  const existingAny = existing as any;

  db.prepare(
    `
    UPDATE visit_records
    SET end_time = COALESCE(?, end_time),
        total_duration_ms = COALESCE(?, total_duration_ms),
        scroll_depth_percent = COALESCE(?, scroll_depth_percent),
        section_durations_json = COALESCE(?, section_durations_json),
        downloaded_pdf = COALESCE(?, downloaded_pdf)
    WHERE id = ?
  `,
  ).run(
    endTime ?? null,
    totalDuration ?? null,
    scrollDepth ?? null,
    sectionDurations ? JSON.stringify(sectionDurations) : null,
    downloadedPdf !== undefined ? (downloadedPdf ? 1 : 0) : null,
    existingAny.id,
  );

  const row = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(existingAny.id);
  const record: VisitRecord = rowToVisitRecord(row);

  res.json({
    success: true,
    data: record,
  });
});

router.get('/:id/analytics', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

  const pubIdsResult = db
    .prepare(`SELECT publish_id FROM publications WHERE project_id = ? AND type = 'web'`)
    .all(projectId);

  if (pubIdsResult.length === 0) {
    res.json({
      success: true,
      data: {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgDuration: 0,
        completionRate: 0,
        visitsByDay: [],
        sectionAvgDurations: [],
        deviceBreakdown: [],
        countryBreakdown: [],
      },
    });
    return;
  }

  const publishIds = pubIdsResult.map((r) => (r as any).publish_id);
  const placeholders = publishIds.map(() => '?').join(',');

  const totalCount = (db
    .prepare(
      `SELECT COUNT(*) as count FROM visit_records WHERE publish_id IN (${placeholders})`,
    )
    .get(...publishIds) as { count: number }).count;

  const uniqueCount = (db
    .prepare(
      `SELECT COUNT(DISTINCT visitor_id) as count FROM visit_records WHERE publish_id IN (${placeholders})`,
    )
    .get(...publishIds) as { count: number }).count;

  const avgResult = db
    .prepare(
      `SELECT AVG(total_duration_ms) as avg FROM visit_records WHERE publish_id IN (${placeholders}) AND total_duration_ms > 0`,
    )
    .get(...publishIds) as { avg: number | null };

  const avgDuration = avgResult.avg ? Math.round(avgResult.avg / 1000) : 0;

  const scrollResult = db
    .prepare(
      `SELECT AVG(scroll_depth_percent) as avg FROM visit_records WHERE publish_id IN (${placeholders})`,
    )
    .get(...publishIds) as { avg: number | null };

  const completionRate = scrollResult.avg ?? 0;

  const visitsByDayRaw = db
    .prepare(
      `
    SELECT DATE(start_time) as date, COUNT(*) as count
    FROM visit_records
    WHERE publish_id IN (${placeholders})
    GROUP BY DATE(start_time)
    ORDER BY date DESC
    LIMIT 10
  `,
    )
    .all(...publishIds) as { date: string; count: number }[];

  const visitsByDay = visitsByDayRaw
    .map((r) => ({
      date: r.date.slice(5),
      count: r.count,
    }))
    .reverse();

  const deviceRows = db
    .prepare(
      `
    SELECT device_type as device, COUNT(*) as count
    FROM visit_records
    WHERE publish_id IN (${placeholders})
    GROUP BY device_type
    ORDER BY count DESC
  `,
    )
    .all(...publishIds) as { device: string | null; count: number }[];

  const deviceBreakdown = deviceRows.map((r) => {
    const deviceName = r.device === 'desktop' ? '桌面端' : r.device === 'mobile' ? '移动端' : r.device === 'tablet' ? '平板' : '未知';
    return {
      device: deviceName,
      count: r.count,
      percentage: totalCount > 0 ? Math.round((r.count / totalCount) * 1000) / 10 : 0,
    };
  });

  const countryRows = db
    .prepare(
      `
    SELECT country, COUNT(*) as count
    FROM visit_records
    WHERE publish_id IN (${placeholders})
    GROUP BY country
    ORDER BY count DESC
  `,
    )
    .all(...publishIds) as { country: string | null; count: number }[];

  const countryBreakdown = countryRows.map((r) => ({
    country: r.country ?? '未知',
    count: r.count,
    percentage: totalCount > 0 ? Math.round((r.count / totalCount) * 1000) / 10 : 0,
  }));

  const sectionAvgDurations = MOCK_ANALYTICS.sectionAvgDurations;

  const summary: AnalyticsSummary = {
    totalVisits: totalCount || MOCK_ANALYTICS.totalVisits,
    uniqueVisitors: uniqueCount || MOCK_ANALYTICS.uniqueVisitors,
    avgDuration: avgDuration || MOCK_ANALYTICS.avgDuration,
    completionRate: completionRate || MOCK_ANALYTICS.completionRate,
    visitsByDay: visitsByDay.length > 0 ? visitsByDay : MOCK_ANALYTICS.visitsByDay,
    sectionAvgDurations,
    deviceBreakdown: deviceBreakdown.length > 0 ? deviceBreakdown : MOCK_ANALYTICS.deviceBreakdown,
    countryBreakdown: countryBreakdown.length > 0 ? countryBreakdown : MOCK_ANALYTICS.countryBreakdown,
  };

  res.json({
    success: true,
    data: summary,
  });
});

router.get('/:id/visits', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: projectId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    res.status(404).json({
      success: false,
      error: '项目不存在',
    });
    return;
  }

  const pubIdsResult = db
    .prepare(`SELECT publish_id FROM publications WHERE project_id = ?`)
    .all(projectId);

  if (pubIdsResult.length === 0) {
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    return;
  }

  const publishIds = pubIdsResult.map((r) => (r as any).publish_id);
  const placeholders = publishIds.map(() => '?').join(',');

  const countResult = db
    .prepare(
      `SELECT COUNT(*) as count FROM visit_records WHERE publish_id IN (${placeholders})`,
    )
    .get(...publishIds) as { count: number };

  const total = countResult.count;
  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  const rows = db
    .prepare(
      `
    SELECT * FROM visit_records
    WHERE publish_id IN (${placeholders})
    ORDER BY start_time DESC
    LIMIT ? OFFSET ?
  `,
    )
    .all(...publishIds, limitNum, offset);

  const visits: VisitRecord[] = rows.map((row) => rowToVisitRecord(row));

  res.json({
    success: true,
    data: visits,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export default router;
