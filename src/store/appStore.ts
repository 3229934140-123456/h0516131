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
  sectionsMap: Record<string, PageSection[]>;
  templates: Template[];
  currentTheme: ThemeConfig;
  selectedItem: SelectedItem;
  loading: boolean;

  saveStatus: SaveStatus;
  saveStatusMap: Record<string, SaveStatus>;
  lastSavedAt: Date | null;
  lastSavedAtMap: Record<string, string>;

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
  extractProjectIdFromPublishId: (publishId: string) => string | null;
}

const defaultTheme: ThemeConfig = MOCK_TEMPLATES[0].theme;

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let savedStatusTimer: ReturnType<typeof setTimeout> | null = null;

const triggerSave = (
  set: (partial: Partial<AppState>) => void,
  get: () => AppState
) => {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  const { currentProjectId, saveStatusMap, lastSavedAtMap } = get();
  if (!currentProjectId) return;
  set({ saveStatus: 'saving', saveStatusMap: { ...saveStatusMap, [currentProjectId]: 'saving' } });
  saveDebounceTimer = setTimeout(() => {
    const now = new Date();
    const nowStr = now.toISOString();
    set({
      saveStatus: 'saved',
      lastSavedAt: now,
      saveStatusMap: { ...saveStatusMap, [currentProjectId]: 'saved' },
      lastSavedAtMap: { ...lastSavedAtMap, [currentProjectId]: nowStr },
    });
  }, 500);
};

const extractProjectIdFromPublishId = (publishId: string): string | null => {
  for (let i = publishId.length - 1; i >= 0; i--) {
    if (publishId[i] === '-' && publishId.length - i - 1 >= 8) {
      return publishId.slice(0, i);
    }
  }
  return null;
};

const buildInitialPublications = (): Publication[] => {
  const pubs: Publication[] = [];
  const nowStr = new Date().toISOString();
  MOCK_PROJECTS.forEach((p) => {
    pubs.push({
      id: createId(),
      projectId: p.id,
      publishId: `${p.id}-pubdefault`,
      version: 1,
      type: 'web',
      url: typeof window !== 'undefined' ? `${window.location.origin}/view/${p.id}-pubdefault` : `/view/${p.id}-pubdefault`,
      publishedAt: nowStr,
      publishedBy: MOCK_USER.id,
    });
  });
  return pubs;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: MOCK_USER,
      projects: [],
      currentProjectId: null,
      dataSources: [],
      sections: [],
      sectionsMap: {},
      templates: [],
      currentTheme: defaultTheme,
      selectedItem: { sectionId: null, chartId: null },
      loading: false,

      saveStatus: 'idle',
      saveStatusMap: {},
      lastSavedAt: null,
      lastSavedAtMap: {},

      collaborators: [],
      publications: [],

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId);
      },

      fetchProjects: async () => {
        const { projects, publications } = get();
        if (projects.length === 0) {
          set({ loading: true });
          await delay(300);
          set({ projects: [...MOCK_PROJECTS], loading: false });
        }
        if (publications.length === 0) {
          set({ publications: buildInitialPublications() });
        }
      },

      addProject: async (project) => {
        set({ loading: true });
        await delay(300);
        const newProjectId = createId();
        const newProject: Project = {
          ...project,
          id: newProjectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          sectionsMap: {
            ...state.sectionsMap,
            [newProjectId]: buildDefaultSections(newProjectId),
          },
          loading: false,
        }));
        triggerSave(set, get);
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
        triggerSave(set, get);
      },

      deleteProject: async (id) => {
        set({ loading: true });
        await delay(300);
        set((state) => {
          const nextSectionsMap = { ...state.sectionsMap };
          delete nextSectionsMap[id];
          const nextSaveStatusMap = { ...state.saveStatusMap };
          delete nextSaveStatusMap[id];
          const nextLastSavedAtMap = { ...state.lastSavedAtMap };
          delete nextLastSavedAtMap[id];
          return {
            projects: state.projects.filter((p) => p.id !== id),
            currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
            sections: state.currentProjectId === id ? [] : state.sections,
            sectionsMap: nextSectionsMap,
            saveStatusMap: nextSaveStatusMap,
            lastSavedAtMap: nextLastSavedAtMap,
            dataSources: state.dataSources.filter((ds) => ds.projectId !== id),
            collaborators: state.collaborators.filter((c) => c.projectId !== id),
            publications: state.publications.filter((p) => p.projectId !== id),
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      setCurrentProject: async (projectId) => {
        set({ loading: true, currentProjectId: projectId });
        if (projectId) {
          const { sectionsMap, dataSources, collaborators, publications } = get();
          // 从 sectionsMap 取该项目的数据，若无则初始化
          let projectSections = sectionsMap[projectId];
          if (!projectSections) {
            projectSections = buildDefaultSections(projectId);
            set({
              sectionsMap: { ...sectionsMap, [projectId]: projectSections },
            });
          }
          set({ sections: projectSections });
          const hasProjectData = dataSources.some((ds) => ds.projectId === projectId);
          const hasCollabs = collaborators.some((c) => c.projectId === projectId);
          if (!hasProjectData) {
            await get().fetchDataSources();
          }
          if (!hasCollabs) {
            await get().fetchCollaborators();
          }
          if (publications.length === 0) {
            set({ publications: buildInitialPublications() });
          }
          // 恢复当前项目的保存状态
          const { saveStatusMap, lastSavedAtMap } = get();
          const projSaveStatus = saveStatusMap[projectId] || 'idle';
          const projLastSavedAt = lastSavedAtMap[projectId] ? new Date(lastSavedAtMap[projectId]) : null;
          if (projLastSavedAt) {
            set({ saveStatus: 'saved', lastSavedAt: projLastSavedAt, loading: false });
          } else if (projSaveStatus !== 'idle') {
            set({ saveStatus: projSaveStatus, loading: false });
          } else {
            set({ loading: false });
          }
        } else {
          set({ sections: [], saveStatus: 'idle', lastSavedAt: null, loading: false });
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
          dataSources: [...dataSources, ...MOCK_DATA_SOURCES.filter((ds) => ds.projectId === currentProjectId)],
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
        triggerSave(set, get);
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
        triggerSave(set, get);
      },

      deleteDataSource: async (id) => {
        set({ loading: true });
        await delay(300);
        set((state) => ({
          dataSources: state.dataSources.filter((ds) => ds.id !== id),
          loading: false,
        }));
        triggerSave(set, get);
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
        triggerSave(set, get);
      },

      fetchSections: async () => {
        const { currentProjectId, sectionsMap } = get();
        if (!currentProjectId) return;
        if (sectionsMap[currentProjectId] && sectionsMap[currentProjectId].length > 0) {
          set({ sections: sectionsMap[currentProjectId], loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        const defaultSections = buildDefaultSections(currentProjectId);
        set({
          sections: defaultSections,
          sectionsMap: { ...sectionsMap, [currentProjectId]: defaultSections },
          loading: false,
        });
      },

      addSection: async (section) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        const newSection: PageSection = {
          ...section,
          id: createId(),
        };
        set((state) => {
          const nextSections = [...state.sections, newSection];
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            loading: false,
          };
        });
        triggerSave(set, get);
        return newSection;
      },

      updateSection: async (id, updates) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        set((state) => {
          const nextSections = state.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      deleteSection: async (id) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        set((state) => {
          const nextSections = state.sections.filter((s) => s.id !== id);
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            selectedItem:
              state.selectedItem.sectionId === id
                ? { sectionId: null, chartId: null }
                : state.selectedItem,
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      reorderSections: async (startIndex, endIndex) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(200);
        set((state) => {
          const result = Array.from(state.sections);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: result }
            : state.sectionsMap;
          return { sections: result, sectionsMap: nextMap, loading: false };
        });
        triggerSave(set, get);
      },

      addChart: async (sectionId, chart) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        const newChart: ChartConfig = {
          ...chart,
          id: createId(),
        };
        set((state) => {
          const nextSections = state.sections.map((s) =>
            s.id === sectionId
              ? { ...s, charts: [...(s.charts || []), newChart] }
              : s
          );
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      updateChart: async (sectionId, chartId, updates) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        set((state) => {
          const nextSections = state.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  charts: (s.charts || []).map((c) =>
                    c.id === chartId ? { ...c, ...updates } : c
                  ),
                }
              : s
          );
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      deleteChart: async (sectionId, chartId) => {
        const { currentProjectId } = get();
        set({ loading: true });
        await delay(300);
        set((state) => {
          const nextSections = state.sections.map((s) =>
            s.id === sectionId
              ? { ...s, charts: (s.charts || []).filter((c) => c.id !== chartId) }
              : s
          );
          const nextMap = currentProjectId
            ? { ...state.sectionsMap, [currentProjectId]: nextSections }
            : state.sectionsMap;
          return {
            sections: nextSections,
            sectionsMap: nextMap,
            selectedItem:
              state.selectedItem.chartId === chartId
                ? { sectionId: null, chartId: null }
                : state.selectedItem,
            loading: false,
          };
        });
        triggerSave(set, get);
      },

      fetchTemplates: async () => {
        const { templates } = get();
        if (templates.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set({ templates: [...MOCK_TEMPLATES], loading: false });
      },

      setCurrentTheme: async (theme) => {
        set({ loading: true });
        await delay(200);
        set({ currentTheme: theme, loading: false });
        triggerSave(set, get);
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
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin', 'data_manager', 'editor'];
        return allowedRoles.includes(role);
      },

      canManageCollaborators: () => {
        const role = get().getCurrentUserRole();
        const allowedRoles: (UserRole | 'owner')[] = ['owner', 'admin', 'data_manager'];
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
        triggerSave(set, get);
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
        triggerSave(set, get);
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
        triggerSave(set, get);
      },

      fetchPublications: async () => {
        const { publications } = get();
        if (publications.length > 0) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        await delay(300);
        set({ publications: buildInitialPublications(), loading: false });
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
        triggerSave(set, get);
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
        triggerSave(set, get);
        return newPublication;
      },

      triggerManualSave: () => {
        const { currentProjectId, saveStatusMap, lastSavedAtMap } = get();
        if (!currentProjectId) return;
        const now = new Date();
        const nowStr = now.toISOString();
        set({
          saveStatus: 'saved',
          lastSavedAt: now,
          saveStatusMap: { ...saveStatusMap, [currentProjectId]: 'saved' },
          lastSavedAtMap: { ...lastSavedAtMap, [currentProjectId]: nowStr },
        });
      },

      getProjectSections: (projectId: string) => {
        const { sectionsMap } = get();
        return sectionsMap[projectId] || [];
      },

      getProjectDataSources: (projectId: string) => {
        const { dataSources } = get();
        return dataSources.filter((ds) => ds.projectId === projectId);
      },

      extractProjectIdFromPublishId,
    }),
    {
      name: 'annual-report-app-state',
      partialize: (state) => ({
        currentUser: state.currentUser,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        dataSources: state.dataSources,
        sectionsMap: state.sectionsMap,
        saveStatusMap: state.saveStatusMap,
        lastSavedAtMap: state.lastSavedAtMap,
        templates: state.templates,
        currentTheme: state.currentTheme,
        collaborators: state.collaborators,
        publications: state.publications,
      }),
    }
  )
);
