import { create } from 'zustand';
import type {
  User,
  Project,
  DataSource,
  PageSection,
  Template,
  ThemeConfig,
  ChartConfig,
} from '@shared/types';
import {
  MOCK_USER,
  MOCK_PROJECTS,
  MOCK_DATA_SOURCES,
  MOCK_TEMPLATES,
  buildDefaultSections,
} from '@shared/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createId = () => Math.random().toString(36).slice(2, 10);

interface SelectedItem {
  sectionId: string | null;
  chartId: string | null;
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
}

const defaultTheme: ThemeConfig = MOCK_TEMPLATES[0].theme;

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: MOCK_USER,
  projects: [],
  currentProjectId: null,
  dataSources: [],
  sections: [],
  templates: [],
  currentTheme: defaultTheme,
  selectedItem: { sectionId: null, chartId: null },
  loading: false,

  getCurrentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },

  fetchProjects: async () => {
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
  },

  deleteProject: async (id) => {
    set({ loading: true });
    await delay(300);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      sections: state.currentProjectId === id ? [] : state.sections,
      dataSources: state.dataSources.filter((ds) => ds.projectId !== id),
      loading: false,
    }));
  },

  setCurrentProject: async (projectId) => {
    set({ loading: true });
    await delay(300);
    set({ currentProjectId: projectId, loading: false });
    if (projectId) {
      await get().fetchSections();
      await get().fetchDataSources();
    }
  },

  fetchDataSources: async () => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
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
  },

  deleteDataSource: async (id) => {
    set({ loading: true });
    await delay(300);
    set((state) => ({
      dataSources: state.dataSources.filter((ds) => ds.id !== id),
      loading: false,
    }));
  },

  fetchSections: async () => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;
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
  },

  setSelectedItem: (selected) => {
    set({ selectedItem: selected });
  },
}));
