import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Project,
  DataSource,
  DataField,
  PageSection,
  Template,
  ThemeConfig,
  ChartConfig,
  Collaborator,
  Publication,
  UserRole,
} from '@shared/types';
import {
  MOCK_USER,
  MOCK_PROJECTS,
  MOCK_DATA_SOURCES,
  MOCK_TEMPLATES,
  MOCK_COLLABORATORS,
  buildDefaultSections,
} from '@shared/mockData';

export type PermissionType = 'editData' | 'editContent' | 'publish' | 'manageCollab';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const createId = () => createUUID();

type SaveStatus = 'idle' | 'saving' | 'saved';

interface SelectedItem {
  sectionId: string | null;
  chartId: string | null;
}

interface FieldUpdate {
  key: string;
  updates: Partial<DataField>;
}

interface AddCollaboratorInput {
  email: string;
  name: string;
  role: Collaborator['role'];
}

interface PublishWebOptions {
  passwordProtect?: boolean;
  password?: string;
  expiryDate?: string;
  expiresAt?: string;
}

interface AppState {
  currentUser: User;
  projects: Project[];
  currentProjectId: string | null;
  dataSources: DataSource[];
  sections: PageSection[];
  templates: Template[];
  currentTheme: ThemeConfig;
  selectedItem: SelectedItem;
  loading: boolean;

  saveStatus: SaveStatus;
  lastSavedAt: Date | null;

  collaborators: Collaborator[];
  publications: Publication[];

  getCurrentProject: () => Project | undefined;
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (projectId: string | null) => Promise<void>;

  fetchDataSources: () => Promise<void>;
  addDataSource: (dataSource: Omit<DataSource, 'id' | 'importedAt'>) => Promise<DataSource>;
  updateDataSource: (id: string, updates: Partial<DataSource>) => Promise<void>;
  deleteDataSource: (id: string) => Promise<void>;
  editDataSourceFields: (dataSourceId: string, fieldsUpdates: FieldUpdate[]) => Promise<void>;

  fetchSections: () => Promise<void>;
  addSection: (section: Omit<PageSection, 'id'>) => Promise<PageSection>;
  updateSection: (id: string, updates: Partial<PageSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (startIndex: number, endIndex: number) => Promise<void>;

  addChart: (sectionId: string, chart: Omit<ChartConfig, 'id'>) => Promise<void>;
  updateChart: (sectionId: string, chartId: string, updates: Partial<ChartConfig>) => Promise<void>;
  deleteChart: (sectionId: string, chartId: string) => Promise<void>;

  fetchTemplates: () => Promise<void>;
  setCurrentTheme: (theme: ThemeConfig) => Promise<void>;

  setSelectedItem: (selected: SelectedItem) => void;

  getCurrentUserRole: () => UserRole | 'owner';
  canEditData: () => boolean;
  canEditContent: () => boolean;
  canPublish: () => boolean;
  canManageCollaborators: () => boolean;
  checkPermission: (permission: PermissionType) => boolean;

  fetchCollaborators: () => Promise<void>;
  addCollaborator: (input: AddCollaboratorInput) => Promise<void | { error: string }>;
  updateCollaboratorRole: (userId: string, role: Collaborator['role']) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;

  fetchPublications: () => Promise<void>;
  publishWeb: (projectId: string, options?: PublishWebOptions) => Promise<Publication>;
  exportPdf: (projectId: string, options?: { password?: string }) => Promise<Publication>;
  triggerManualSave: () => void;
  getProjectSections: (projectId: string) => PageSection[];
  getProjectDataSources: (projectId: string) => DataSource[];
}

const defaultTheme: ThemeConfig = MOCK_TEMPLATES[0].theme;

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let savedStatusTimer: ReturnType<typeof setTimeout> | null = null;

const triggerSave = (set: (partial: Partial<AppState>) => void) => {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  if (savedStatusTimer) {
    clearTimeout(savedStatusTimer);
  }
  set({ saveStatus: 'saving' });
  saveDebounceTimer = setTimeout(() => {
    const now = new Date();
    set({ saveStatus: 'saved', lastSavedAt: now });
  }, 500);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: MOCK_USER,
      projects: [],
      currentProjectId: null,
      dataSources: [],
      sections: [],
      templates: [],
      currentTheme: defaultTheme,
      selectedItem: { sectionId: null, chartId: null },
      loading: false,

      saveStatus: 'idle',
      lastSavedAt: null,

      collaborators: [],
      publications: [],

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId);
      },

      fetchProjects: async () => {
        const { projects } = get();
        if (projects.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set({ projects: [...MOCK_PROJECTS], loading: false });
      },

      addProject: async (project) => {
        set({ loading: true });
        await delay(300);
        const newProject: Project = {
          ...project,
          id: createId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          loading: false,
        }));
        triggerSave(set);
        return newProject;
      },

      updateProject: async (id, updates) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      deleteProject: async (id) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
          sections: state.currentProjectId === id ? [] : state.sections,
          dataSources: state.dataSources.filter((ds) => ds.projectId !== id),
          collaborators: state.collaborators.filter((c) => c.projectId !== id),
          publications: state.publications.filter((p) => p.projectId !== id),
          loading: false,
        }));
        triggerSave(set);
      },

      setCurrentProject: async (projectId) => {
        set({ loading: true, currentProjectId: projectId });
        if (projectId) {
          const { sections, dataSources, collaborators, publications } = get();
          const hasProjectSections = sections.length > 0;
          const hasProjectData = dataSources.some((ds) => ds.projectId === projectId);
          const hasCollabs = collaborators.some((c) => c.projectId === projectId);
          const hasPubs = publications.some((p) => p.projectId === projectId);

          if (!hasProjectSections) {
            await get().fetchSections();
          }
          if (!hasProjectData) {
            await get().fetchDataSources();
          }
          if (!hasCollabs) {
            await get().fetchCollaborators();
          }
          if (!hasPubs) {
            await get().fetchPublications();
          }

          const { lastSavedAt } = get();
          if (lastSavedAt) {
            set({ saveStatus: 'saved', loading: false });
          } else {
            set({ loading: false });
          }
        } else {
          set({ loading: false });
        }
      },

      fetchDataSources: async () => {
        const { currentProjectId, dataSources } = get();
        if (!currentProjectId) return;
        const existing = dataSources.filter((ds) => ds.projectId === currentProjectId);
        if (existing.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set({
          dataSources: MOCK_DATA_SOURCES.filter((ds) => ds.projectId === currentProjectId),
          loading: false,
        });
      },

      addDataSource: async (dataSource) => {
        set({ loading: true });
        await delay(300);
        const newDataSource: DataSource = {
          ...dataSource,
          id: createId(),
          importedAt: new Date().toISOString(),
        };
        set((state) => ({
          dataSources: [...state.dataSources, newDataSource],
          loading: false,
        }));
        triggerSave(set);
        return newDataSource;
      },

      updateDataSource: async (id, updates) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          dataSources: state.dataSources.map((ds) =>
            ds.id === id ? { ...ds, ...updates } : ds
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      deleteDataSource: async (id) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          dataSources: state.dataSources.filter((ds) => ds.id !== id),
          loading: false,
        }));
        triggerSave(set);
      },

      editDataSourceFields: async (dataSourceId, fieldsUpdates) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          dataSources: state.dataSources.map((ds) => {
            if (ds.id !== dataSourceId) return ds;
            const updatedFields = ds.fields.map((field) => {
              const update = fieldsUpdates.find((u) => u.key === field.key);
              return update ? { ...field, ...update.updates } : field;
            });
            return { ...ds, fields: updatedFields };
          }),
          loading: false,
        }));
        triggerSave(set);
      },

      fetchSections: async () => {
        const { currentProjectId, sections } = get();
        if (!currentProjectId) return;
        if (sections.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set({
          sections: buildDefaultSections(currentProjectId),
          loading: false,
        });
      },

      addSection: async (section) => {
        set({ loading: true });
        await delay(300);
        const newSection: PageSection = {
          ...section,
          id: createId(),
        };
        set((state) => ({
          sections: [...state.sections, newSection],
          loading: false,
        }));
        triggerSave(set);
        return newSection;
      },

      updateSection: async (id, updates) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      deleteSection: async (id) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
          selectedItem:
            state.selectedItem.sectionId === id
              ? { sectionId: null, chartId: null }
              : state.selectedItem,
          loading: false,
        }));
        triggerSave(set);
      },

      reorderSections: async (startIndex, endIndex) => {
        set({ loading: true });
        await delay(200);
        set((state) => {
          const result = Array.from(state.sections);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { sections: result, loading: false };
        });
        triggerSave(set);
      },

      addChart: async (sectionId, chart) => {
        set({ loading: true });
        await delay(300);
        const newChart: ChartConfig = {
          ...chart,
          id: createId(),
        };
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? { ...s, charts: [...(s.charts || []), newChart] }
              : s
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      updateChart: async (sectionId, chartId, updates) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  charts: (s.charts || []).map((c) =>
                    c.id === chartId ? { ...c, ...updates } : c
                  ),
                }
              : s
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      deleteChart: async (sectionId, chartId) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? { ...s, charts: (s.charts || []).filter((c) => c.id !== chartId) }
              : s
          ),
          selectedItem:
            state.selectedItem.chartId === chartId
              ? { sectionId: null, chartId: null }
              : state.selectedItem,
          loading: false,
        }));
        triggerSave(set);
      },

      fetchTemplates: async () => {
        set({ loading: true });
        await delay(300);
        set({ templates: [...MOCK_TEMPLATES], loading: false });
      },

      setCurrentTheme: async (theme) => {
        set({ loading: true });
        await delay(200);
        set({ currentTheme: theme, loading: false });
        triggerSave(set);
      },

      setSelectedItem: (selected) => {
        set({ selectedItem: selected });
      },

      getCurrentUserRole: () => {
        const { currentUser, currentProjectId, projects } = get();
        const project = projects.find((p) => p.id === currentProjectId);
        if (project && project.ownerId === currentUser.id) {
          return 'owner';
        }
        const collaborators = get().collaborators;
        const collab = collaborators.find(
          (c) => c.projectId === currentProjectId && c.userId === currentUser.id
        );
        if (collab) return collab.role;
        return currentUser.role;
      },

      canEditData: () => {
        const role = get().getCurrentUserRole();
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin', 'data_manager'];
        return allowedRoles.includes(role);
      },

      canEditContent: () => {
        const role = get().getCurrentUserRole();
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin', 'data_manager', 'editor'];
        return allowedRoles.includes(role);
      },

      canPublish: () => {
        const role = get().getCurrentUserRole();
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin', 'editor'];
        return allowedRoles.includes(role);
      },

      canManageCollaborators: () => {
        const role = get().getCurrentUserRole();
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin'];
        return allowedRoles.includes(role);
      },

      checkPermission: (permission: PermissionType) => {
        switch (permission) {
          case 'editData':
            return get().canEditData();
          case 'editContent':
            return get().canEditContent();
          case 'publish':
            return get().canPublish();
          case 'manageCollab':
            return get().canManageCollaborators();
          default:
            return false;
        }
      },

      fetchCollaborators: async () => {
        const { currentProjectId, collaborators } = get();
        if (!currentProjectId) return;
        const existing = collaborators.filter((c) => c.projectId === currentProjectId);
        if (existing.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set((state) => ({
          collaborators: [
            ...state.collaborators.filter((c) => c.projectId !== currentProjectId),
            ...MOCK_COLLABORATORS.map((c) => ({
              userId: c.id,
              user: { ...c, createdAt: new Date().toISOString() } as User,
              projectId: currentProjectId,
              role: c.role as Collaborator['role'],
              joinedAt: new Date().toISOString(),
              invitedBy: MOCK_USER.id,
            })),
          ],
          loading: false,
        }));
      },

      addCollaborator: async (input) => {
        const { currentProjectId, collaborators, currentUser } = get();
        if (!currentProjectId) return;
        set({ loading: true });
        await delay(300);

        const exists = collaborators.some(
          (c) => c.projectId === currentProjectId && c.user?.email === input.email
        );
        if (exists) {
          set({ loading: false });
          return { error: '该成员已加入' };
        }

        const newId = createId();
        const newCollaborator: Collaborator = {
          userId: newId,
          user: {
            id: newId,
            name: input.name,
            email: input.email,
            role: input.role,
            createdAt: new Date().toISOString(),
          },
          projectId: currentProjectId,
          role: input.role,
          joinedAt: new Date().toISOString(),
          invitedBy: currentUser.id,
        };
        set((state) => ({
          collaborators: [...state.collaborators, newCollaborator],
          loading: false,
        }));
        triggerSave(set);
      },

      updateCollaboratorRole: async (userId, role) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        set({ loading: true });
        await delay(300);
        set((state) => ({
          collaborators: state.collaborators.map((c) =>
            c.userId === userId && c.projectId === currentProjectId ? { ...c, role } : c
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      removeCollaborator: async (userId) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        set({ loading: true });
        await delay(300);
        set((state) => ({
          collaborators: state.collaborators.filter(
            (c) => !(c.userId === userId && c.projectId === currentProjectId)
          ),
          loading: false,
        }));
        triggerSave(set);
      },

      fetchPublications: async () => {
        set({ loading: true });
        await delay(300);
        set({ loading: false });
      },

      publishWeb: async (projectId, options) => {
        set({ loading: true });
        await delay(500);
        const publishId = `${projectId}-${createUUID().slice(0, 8)}`;
        const existingPublications = get().publications.filter(
          (p) => p.projectId === projectId && p.type === 'web'
        );
        const newVersion = existingPublications.length + 1;
        const baseUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/view/${publishId}`
            : `/view/${publishId}`;
        const newPublication: Publication = {
          id: createId(),
          projectId,
          publishId,
          version: newVersion,
          type: 'web',
          url: baseUrl,
          password: options?.passwordProtect ? options?.password : undefined,
          expiresAt: options?.expiresAt,
          publishedAt: new Date().toISOString(),
          publishedBy: get().currentUser.id,
        };
        set((state) => ({
          publications: [...state.publications, newPublication],
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, status: 'published', updatedAt: new Date().toISOString() }
              : p
          ),
          loading: false,
        }));
        triggerSave(set);
        return newPublication;
      },

      exportPdf: async (projectId, options) => {
        set({ loading: true });
        await delay(800);
        const publishId = `${projectId}-${createUUID().slice(0, 8)}`;
        const existingPublications = get().publications.filter(
          (p) => p.projectId === projectId && p.type === 'pdf'
        );
        const newVersion = existingPublications.length + 1;
        const newPublication: Publication = {
          id: createId(),
          projectId,
          publishId,
          version: newVersion,
          type: 'pdf',
          pdfPath: `/exports/${publishId}.pdf`,
          password: options?.password,
          publishedAt: new Date().toISOString(),
          publishedBy: get().currentUser.id,
        };
        set((state) => ({
          publications: [...state.publications, newPublication],
          loading: false,
        }));
        triggerSave(set);
        return newPublication;
      },

      triggerManualSave: () => {
        const now = new Date();
        set({ saveStatus: 'saved', lastSavedAt: now });
      },

      getProjectSections: (projectId: string) => {
        const { sections, projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project) return [];
        return sections;
      },

      getProjectDataSources: (projectId: string) => {
        const { dataSources } = get();
        return dataSources.filter((ds) => ds.projectId === projectId);
      },
    }),
    {
      name: 'annual-report-app-state',
      partialize: (state) => ({
        currentUser: state.currentUser,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        dataSources: state.dataSources,
        sections: state.sections,
        templates: state.templates,
        currentTheme: state.currentTheme,
        collaborators: state.collaborators,
        publications: state.publications,
        lastSavedAt: state.lastSavedAt,
        saveStatus: state.saveStatus === 'saved' ? 'saved' : 'idle',
      }),
    }
  )
);
