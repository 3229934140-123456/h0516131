import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import DashboardPage from "@/pages/DashboardPage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import DataImportPage from "@/pages/DataImportPage";
import EditorPage from "@/pages/EditorPage";
import TemplateCenterPage from "@/pages/TemplateCenterPage";
import CollaborationPage from "@/pages/CollaborationPage";
import PublishPage from "@/pages/PublishPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ViewReportPage from "@/pages/ViewReportPage";

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
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <DataImportPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/:id/editor"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <EditorPage />
            </motion.div>
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
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <CollaborationPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/:id/publish"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <PublishPage />
            </motion.div>
          }
        />
        <Route
          path="/projects/:id/analytics"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <AnalyticsPage />
            </motion.div>
          }
        />
        <Route
          path="/view/:publishId"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <ViewReportPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-body">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
