import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect as useEffectReact } from "react";
import DashboardPage from "@/pages/DashboardPage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import DataImportPage from "@/pages/DataImportPage";
import EditorPage from "@/pages/EditorPage";
import TemplateCenterPage from "@/pages/TemplateCenterPage";
import CollaborationPage from "@/pages/CollaborationPage";
import PublishPage from "@/pages/PublishPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ViewReportPage from "@/pages/ViewReportPage";
import { useAppStore, type PermissionType } from "@/store/appStore";
import { Lock, Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};

function NoPermissionPage() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-deep-blue to-deep-blue-dark overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-gold/15 blur-3xl" />
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Lock className="w-12 h-12 text-gold" />
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">访问受限</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            抱歉，您没有权限访问此页面。
            <br />
            请联系项目管理员获取相应权限。
          </p>
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              <Home className="w-5 h-5" />
              返回首页
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              返回上一页
            </button>
          </div>
          {location.pathname && (
            <p className="mt-6 text-xs text-gray-400 font-mono truncate px-4 py-2 bg-gray-50 rounded-xl">
              当前路径：{location.pathname}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface ProtectedRouteProps {
  permission: PermissionType;
  children: ReactNode;
}

function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { id } = useParams();
  const projectId = id || "";
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const projects = useAppStore((s) => s.projects);
  const fetchProjects = useAppStore((s) => s.fetchProjects);
  const checkPermission = useAppStore((s) => s.checkPermission);

  useEffectReact(() => {
    const init = async () => {
      if (projects.length === 0) {
        await fetchProjects();
      }
    };
    init();
  }, [projects.length, fetchProjects]);

  useEffectReact(() => {
    if (projectId && currentProjectId !== projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, currentProjectId, setCurrentProject]);

  const hasPermission = checkPermission(permission);

  if (!hasPermission) {
    return <NoPermissionPage />;
  }

  return <>{children}</>;
}

interface ViewReportRouteProps {
  children: ReactNode;
  isPreview?: boolean;
}

function ViewReportRoute({ children, isPreview }: ViewReportRouteProps) {
  const { publishId, id } = useParams();
  const publications = useAppStore((s) => s.publications);
  const projects = useAppStore((s) => s.projects);
  const fetchProjects = useAppStore((s) => s.fetchProjects);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const projectId = isPreview ? id : publications.find((p) => p.publishId === publishId)?.projectId;

  useEffectReact(() => {
    const init = async () => {
      if (projects.length === 0) {
        await fetchProjects();
      }
    };
    init();
  }, [projects.length, fetchProjects]);

  useEffectReact(() => {
    if (projectId && currentProjectId !== projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, currentProjectId, setCurrentProject]);

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <DashboardPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/create"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <CreateProjectPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/:id/data-import"
          element={
            <ProtectedRoute permission="editData">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <DataImportPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/editor"
          element={
            <ProtectedRoute permission="editContent">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <EditorPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <TemplateCenterPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/:id/collaboration"
          element={
            <ProtectedRoute permission="manageCollab">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <CollaborationPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/publish"
          element={
            <ProtectedRoute permission="editContent">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <PublishPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview/:id"
          element={
            <ViewReportRoute isPreview>
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <ViewReportPage />
              </motion.div>
            </ViewReportRoute>
          }
        />
        <Route
          path="/projects/:id/analytics"
          element={
            <ProtectedRoute permission="editContent">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <AnalyticsPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/view/:publishId"
          element={
            <ViewReportRoute>
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <ViewReportPage />
              </motion.div>
            </ViewReportRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const fetchProjects = useAppStore((s) => s.fetchProjects);
  const fetchTemplates = useAppStore((s) => s.fetchTemplates);

  useEffectReact(() => {
    fetchProjects();
    fetchTemplates();
  }, [fetchProjects, fetchTemplates]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-body">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
