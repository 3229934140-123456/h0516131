export type UserRole = 'admin' | 'data_manager' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: 'sm' | 'md' | 'lg' | 'xl';
  shadowIntensity: 'none' | 'light' | 'medium' | 'strong';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  templateId: string;
  customTheme?: ThemeConfig;
  status: 'draft' | 'published';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
}

export interface DataField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
  mappedFrom?: string;
}

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  fileName: string;
  fields: DataField[];
  rows: Record<string, any>[];
  importedAt: string;
  importedBy: string;
  rowCount: number;
  fileHash: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'number' | 'progress' | 'table' | 'map';

export interface ChartStyleConfig {
  colorPalette: string[];
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  animationEnabled: boolean;
  strokeWidth: number;
  barRadius: number;
  fontFamily: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  dataSourceId: string;
  xField?: string;
  yFields?: string[];
  valueField?: string;
  labelField?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  styleConfig: ChartStyleConfig;
  width: 'full' | 'half' | 'third' | 'quarter';
  numberValue?: number;
  numberSuffix?: string;
  numberPrefix?: string;
  progressValue?: number;
  progressMax?: number;
}

export type SectionType = 'cover' | 'toc' | 'content' | 'chart' | 'text' | 'divider';

export interface PageSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  charts?: ChartConfig[];
  templateVariant?: number;
  backgroundStyle?: string;
}

export interface ReportLayout {
  projectId: string;
  version: number;
  sections: PageSection[];
  pageSize: 'A4' | 'Letter' | 'Web';
  createdAt: string;
}

export interface Collaborator {
  userId: string;
  user?: User;
  projectId: string;
  role: 'data_manager' | 'editor' | 'viewer';
  joinedAt: string;
  invitedBy: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string;
  theme: ThemeConfig;
  isCustom: boolean;
  creatorId?: string;
  createdAt: string;
}

export interface Publication {
  id: string;
  projectId: string;
  publishId: string;
  version: number;
  type: 'web' | 'pdf';
  url?: string;
  pdfPath?: string;
  password?: string;
  expiresAt?: string;
  publishedAt: string;
  publishedBy: string;
}

export interface VisitRecord {
  id: string;
  publishId: string;
  visitorId: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  startTime: string;
  endTime?: string;
  totalDuration: number;
  scrollDepth: number;
  sectionDurations: Record<string, number>;
  downloadedPdf: boolean;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
  completionRate: number;
  visitsByDay: { date: string; count: number }[];
  sectionAvgDurations: { sectionId: string; sectionTitle: string; avgDuration: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  countryBreakdown: { country: string; count: number; percentage: number }[];
}
