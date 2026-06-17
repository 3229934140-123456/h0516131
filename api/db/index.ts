import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import {
  MOCK_USER,
  MOCK_COLLABORATORS,
  MOCK_TEMPLATES,
  MOCK_PROJECTS,
  MOCK_DATA_SOURCES,
  MOCK_ANALYTICS,
  buildDefaultSections,
  MOCK_REVENUE_DATA,
  MOCK_SEGMENT_DATA,
} from '@shared/mockData';
import type {
  User,
  Project,
  Template,
  DataSource,
  ReportLayout,
  Collaborator,
  Publication,
  VisitRecord,
  ThemeConfig,
  PageSection,
} from '@shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', '..', 'data.sqlite');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function initDatabase(): Database.Database {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedMockData();

  return db;
}

function createTables(): void {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'data_manager', 'editor', 'viewer')),
      avatar_url TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      template_id TEXT,
      custom_theme_json TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_edited_by TEXT REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('data_manager', 'editor', 'viewer')),
      joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      invited_by TEXT NOT NULL REFERENCES users(id),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      fields_json TEXT NOT NULL,
      rows_json TEXT NOT NULL,
      row_count INTEGER NOT NULL DEFAULT 0,
      file_hash TEXT NOT NULL,
      imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      imported_by TEXT NOT NULL REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS report_layouts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      sections_json TEXT NOT NULL,
      page_size TEXT NOT NULL DEFAULT 'A4',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, version)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      thumbnail_url TEXT,
      theme_json TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      creator_id TEXT REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      publish_id TEXT NOT NULL UNIQUE,
      version INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL CHECK (type IN ('web', 'pdf')),
      url TEXT,
      pdf_path TEXT,
      password_hash TEXT,
      expires_at DATETIME,
      published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_by TEXT NOT NULL REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      publish_id TEXT NOT NULL REFERENCES publications(publish_id) ON DELETE CASCADE,
      visitor_id TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      referrer TEXT,
      country TEXT,
      device_type TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      total_duration_ms INTEGER NOT NULL DEFAULT 0,
      scroll_depth_percent INTEGER NOT NULL DEFAULT 0,
      section_durations_json TEXT,
      downloaded_pdf INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(user_id);
    CREATE INDEX IF NOT EXISTS idx_data_sources_project ON data_sources(project_id);
    CREATE INDEX IF NOT EXISTS idx_publications_project ON publications(project_id);
    CREATE INDEX IF NOT EXISTS idx_visit_records_publish ON visit_records(publish_id);
    CREATE INDEX IF NOT EXISTS idx_visit_records_time ON visit_records(start_time);
  `);
}

function seedMockData(): void {
  if (!db) return;

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const allUsers: (User & { password_hash: string })[] = [
    { ...MOCK_USER, password_hash: 'mock_hash' },
    ...MOCK_COLLABORATORS.map((u) => ({
      ...u,
      password_hash: 'mock_hash',
      createdAt: '2024-01-15T09:00:00Z',
    })),
  ];

  const insertManyUsers = db.transaction((users) => {
    for (const u of users) {
      insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.avatar ?? null, u.createdAt);
    }
  });
  insertManyUsers(allUsers);

  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, name, category, thumbnail_url, theme_json, is_custom, creator_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertManyTemplates = db.transaction((templates: Template[]) => {
    for (const t of templates) {
      insertTemplate.run(
        t.id,
        t.name,
        t.category,
        t.thumbnailUrl ?? null,
        JSON.stringify(t.theme),
        t.isCustom ? 1 : 0,
        t.creatorId ?? null,
        t.createdAt,
      );
    }
  });
  insertManyTemplates(MOCK_TEMPLATES);

  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, description, cover_image, template_id, custom_theme_json, status, owner_id, created_at, updated_at, last_edited_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertManyProjects = db.transaction((projects: Project[]) => {
    for (const p of projects) {
      insertProject.run(
        p.id,
        p.name,
        p.description ?? null,
        p.coverImage ?? null,
        p.templateId,
        p.customTheme ? JSON.stringify(p.customTheme) : null,
        p.status,
        p.ownerId,
        p.createdAt,
        p.updatedAt,
        p.lastEditedBy ?? null,
      );
    }
  });
  insertManyProjects(MOCK_PROJECTS);

  const insertCollaborator = db.prepare(`
    INSERT INTO collaborators (id, project_id, user_id, role, joined_at, invited_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const mockCollaboratorsList: Collaborator[] = [
    { userId: 'u-002', projectId: 'proj-2024-annual', role: 'data_manager', joinedAt: '2024-12-10T10:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-003', projectId: 'proj-2024-annual', role: 'editor', joinedAt: '2024-12-11T09:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-004', projectId: 'proj-2024-annual', role: 'editor', joinedAt: '2024-12-12T14:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-005', projectId: 'proj-2024-annual', role: 'viewer', joinedAt: '2024-12-15T11:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-002', projectId: 'proj-2024-sustain', role: 'data_manager', joinedAt: '2024-11-20T15:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-003', projectId: 'proj-2024-sustain', role: 'editor', joinedAt: '2024-11-21T10:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-003', projectId: 'proj-2024-brand', role: 'editor', joinedAt: '2024-12-25T12:00:00Z', invitedBy: 'u-001' },
    { userId: 'u-005', projectId: 'proj-2024-brand', role: 'viewer', joinedAt: '2024-12-26T09:00:00Z', invitedBy: 'u-001' },
  ];

  const insertManyCollaborators = db.transaction((collabs: Collaborator[]) => {
    for (const c of collabs) {
      insertCollaborator.run(uuidv4(), c.projectId, c.userId, c.role, c.joinedAt, c.invitedBy);
    }
  });
  insertManyCollaborators(mockCollaboratorsList);

  const insertDataSource = db.prepare(`
    INSERT INTO data_sources (id, project_id, name, file_name, fields_json, rows_json, row_count, file_hash, imported_at, imported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const extraDataSources: DataSource[] = [
    {
      id: 'ds-segment-001',
      projectId: 'proj-2024-annual',
      name: '客户群体构成',
      fileName: 'customer_segments_2024.xlsx',
      fields: [
        { key: 'name', label: '客户类型', type: 'string' },
        { key: 'value', label: '占比(%)', type: 'percentage' },
        { key: 'color', label: '颜色', type: 'string' },
      ],
      rows: MOCK_SEGMENT_DATA,
      importedAt: '2024-12-13T10:00:00Z',
      importedBy: 'u-002',
      rowCount: 4,
      fileHash: 'ghi789rst',
    },
    {
      id: 'ds-revenue-sustain',
      projectId: 'proj-2024-sustain',
      name: '可持续投入数据',
      fileName: 'sustainability_investment.xlsx',
      fields: [
        { key: 'quarter', label: '季度', type: 'string' },
        { key: 'revenue', label: '环保投入(万元)', type: 'currency' },
        { key: 'profit', label: '减排量(吨)', type: 'number' },
        { key: 'users', label: '志愿者人数', type: 'number' },
      ],
      rows: MOCK_REVENUE_DATA,
      importedAt: '2024-11-22T09:30:00Z',
      importedBy: 'u-002',
      rowCount: 8,
      fileHash: 'jkl012mno',
    },
  ];

  const allDataSources = [...MOCK_DATA_SOURCES, ...extraDataSources];

  const insertManyDataSources = db.transaction((sources: DataSource[]) => {
    for (const ds of sources) {
      insertDataSource.run(
        ds.id,
        ds.projectId,
        ds.name,
        ds.fileName,
        JSON.stringify(ds.fields),
        JSON.stringify(ds.rows),
        ds.rowCount,
        ds.fileHash,
        ds.importedAt,
        ds.importedBy,
      );
    }
  });
  insertManyDataSources(allDataSources);

  const insertLayout = db.prepare(`
    INSERT INTO report_layouts (id, project_id, version, sections_json, page_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const layouts: ReportLayout[] = [
    {
      projectId: 'proj-2024-annual',
      version: 1,
      sections: buildDefaultSections('proj-2024-annual'),
      pageSize: 'A4',
      createdAt: '2024-12-10T10:00:00Z',
    },
    {
      projectId: 'proj-2024-sustain',
      version: 1,
      sections: buildDefaultSections('proj-2024-sustain'),
      pageSize: 'A4',
      createdAt: '2024-11-20T16:00:00Z',
    },
  ];

  const insertManyLayouts = db.transaction((layoutList: ReportLayout[]) => {
    for (const l of layoutList) {
      insertLayout.run(uuidv4(), l.projectId, l.version, JSON.stringify(l.sections), l.pageSize, l.createdAt);
    }
  });
  insertManyLayouts(layouts);

  const insertPublication = db.prepare(`
    INSERT INTO publications (id, project_id, publish_id, version, type, url, pdf_path, password_hash, expires_at, published_at, published_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const publications: Publication[] = [
    {
      id: uuidv4(),
      projectId: 'proj-2024-sustain',
      publishId: 'pub-sustain-2024',
      version: 1,
      type: 'web',
      url: '/view/pub-sustain-2024',
      publishedAt: '2024-12-28T10:00:00Z',
      publishedBy: 'u-001',
    },
    {
      id: uuidv4(),
      projectId: 'proj-2024-sustain',
      publishId: 'pub-sustain-2024-pdf',
      version: 1,
      type: 'pdf',
      pdfPath: '/exports/proj-2024-sustain-v1.pdf',
      publishedAt: '2024-12-28T10:05:00Z',
      publishedBy: 'u-001',
    },
  ];

  const insertManyPublications = db.transaction((pubs: Publication[]) => {
    for (const p of pubs) {
      insertPublication.run(
        p.id,
        p.projectId,
        p.publishId,
        p.version,
        p.type,
        p.url ?? null,
        p.pdfPath ?? null,
        p.password ?? null,
        p.expiresAt ?? null,
        p.publishedAt,
        p.publishedBy,
      );
    }
  });
  insertManyPublications(publications);

  const insertVisitRecord = db.prepare(`
    INSERT INTO visit_records (
      id, publish_id, visitor_id, ip, user_agent, referrer, country, device_type,
      start_time, end_time, total_duration_ms, scroll_depth_percent,
      section_durations_json, downloaded_pdf
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const visitRecords: VisitRecord[] = [];
  const sections = MOCK_ANALYTICS.sectionAvgDurations;

  for (let i = 0; i < 50; i++) {
    const deviceRoll = Math.random();
    const device: 'desktop' | 'mobile' | 'tablet' =
      deviceRoll < 0.58 ? 'desktop' : deviceRoll < 0.93 ? 'mobile' : 'tablet';

    const countries = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '其他'];
    const countryWeights = [0.229, 0.194, 0.157, 0.100, 0.087, 0.06, 0.05, 0.123];
    let r = Math.random();
    let country = countries[countries.length - 1];
    let cumulative = 0;
    for (let j = 0; j < countries.length; j++) {
      cumulative += countryWeights[j];
      if (r < cumulative) {
        country = countries[j];
        break;
      }
    }

    const secDurations: Record<string, number> = {};
    sections.forEach((s) => {
      secDurations[s.sectionId] = Math.round(s.avgDuration * (0.5 + Math.random()));
    });

    const startTime = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString();
    const duration = Math.round(MOCK_ANALYTICS.avgDuration * (0.3 + Math.random() * 1.4));

    visitRecords.push({
      id: uuidv4(),
      publishId: 'pub-sustain-2024',
      visitorId: `v-${Math.random().toString(36).slice(2, 10)}`,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: Math.random() > 0.6 ? 'https://www.baidu.com' : undefined,
      country,
      deviceType: device,
      startTime,
      endTime: new Date(new Date(startTime).getTime() + duration * 1000).toISOString(),
      totalDuration: duration * 1000,
      scrollDepth: Math.round(30 + Math.random() * 70),
      sectionDurations: secDurations,
      downloadedPdf: Math.random() > 0.8,
    });
  }

  const insertManyVisits = db.transaction((records: VisitRecord[]) => {
    for (const v of records) {
      insertVisitRecord.run(
        v.id,
        v.publishId,
        v.visitorId,
        v.ip ?? null,
        v.userAgent ?? null,
        v.referrer ?? null,
        v.country ?? null,
        v.deviceType ?? null,
        v.startTime,
        v.endTime ?? null,
        v.totalDuration,
        v.scrollDepth,
        JSON.stringify(v.sectionDurations),
        v.downloadedPdf ? 1 : 0,
      );
    }
  });
  insertManyVisits(visitRecords);
}

export function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    coverImage: row.cover_image ?? undefined,
    templateId: row.template_id,
    customTheme: row.custom_theme_json ? JSON.parse(row.custom_theme_json) : undefined,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastEditedBy: row.last_edited_by ?? undefined,
  };
}

export function rowToTemplate(row: any): Template {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    theme: JSON.parse(row.theme_json) as ThemeConfig,
    isCustom: row.is_custom === 1,
    creatorId: row.creator_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function rowToDataSource(row: any): DataSource {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    fileName: row.file_name,
    fields: JSON.parse(row.fields_json),
    rows: JSON.parse(row.rows_json),
    importedAt: row.imported_at,
    importedBy: row.imported_by,
    rowCount: row.row_count,
    fileHash: row.file_hash,
  };
}

export function rowToReportLayout(row: any): ReportLayout {
  return {
    projectId: row.project_id,
    version: row.version,
    sections: JSON.parse(row.sections_json) as PageSection[],
    pageSize: row.page_size,
    createdAt: row.created_at,
  };
}

export function rowToCollaborator(row: any, user?: User): Collaborator {
  return {
    userId: row.user_id,
    user,
    projectId: row.project_id,
    role: row.role,
    joinedAt: row.joined_at,
    invitedBy: row.invited_by,
  };
}

export function rowToPublication(row: any): Publication {
  return {
    id: row.id,
    projectId: row.project_id,
    publishId: row.publish_id,
    version: row.version,
    type: row.type,
    url: row.url ?? undefined,
    pdfPath: row.pdf_path ?? undefined,
    password: row.password_hash ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
  };
}

export function rowToVisitRecord(row: any): VisitRecord {
  return {
    id: row.id,
    publishId: row.publish_id,
    visitorId: row.visitor_id,
    ip: row.ip ?? undefined,
    userAgent: row.user_agent ?? undefined,
    referrer: row.referrer ?? undefined,
    country: row.country ?? undefined,
    deviceType: row.device_type as 'desktop' | 'mobile' | 'tablet' | undefined,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    totalDuration: row.total_duration_ms,
    scrollDepth: row.scroll_depth_percent,
    sectionDurations: row.section_durations_json ? JSON.parse(row.section_durations_json) : {},
    downloadedPdf: row.downloaded_pdf === 1,
  };
}
