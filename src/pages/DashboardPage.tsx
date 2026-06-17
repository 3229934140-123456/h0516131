import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  Eye,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  ChevronRight,
  FolderPlus,
  BarChart3,
  Palette,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_TEMPLATES, MOCK_USER, MOCK_ANALYTICS } from "@shared/mockData";
import type { Project, Template } from "@shared/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPublished
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-amber-100 text-amber-800 border border-amber-200"
      }`}
    >
      {isPublished ? "已发布" : "草稿中"}
    </span>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const template = MOCK_TEMPLATES.find((t) => t.id === project.templateId);
  const themeColor = template?.theme.primaryColor || "#1e3a5f";
  const accentColor = template?.theme.accentColor || "#c9a962";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
    >
      <Link to={`/projects/${project.id}/editor`} className="block">
        <div
          className="h-36 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 100%)`,
          }}
        >
          <div
            className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-md"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
          >
            {template?.name || "默认模板"}
          </div>
          <div className="absolute top-4 right-4">
            <StatusBadge status={project.status} />
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-bold text-lg truncate group-hover:text-white/90">
              {project.name}
            </h3>
          </div>
          <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: accentColor }} />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15" style={{ backgroundColor: "white" }} />
        </div>
        <div className="p-5">
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
            {project.description || "暂无描述"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-400 text-xs">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {formatDate(project.updatedAt)}
            </div>
            <button className="text-gray-400 hover:text-deep-blue transition-colors p-1.5 rounded-lg hover:bg-gray-50">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TemplateCard({ template, index }: { template: Template; index: number }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -4 }}
      className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden cursor-pointer group transition-all duration-300"
    >
      <div
        className="h-40 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor} 100%)`,
        }}
      >
        <div
          className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: template.theme.accentColor, color: template.theme.primaryColor }}
        >
          {index + 1}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div
            className="h-1.5 w-16 rounded-full mb-2"
            style={{ backgroundColor: template.theme.accentColor }}
          />
          <div
            className="h-1.5 w-24 rounded-full opacity-60"
            style={{ backgroundColor: template.theme.backgroundColor || "white" }}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-deep-blue transition-colors">
            {template.name}
          </h4>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold group-hover:translate-x-1 transition-all" />
        </div>
        <span className="text-xs text-gray-500">{template.category}</span>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredProjects = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-deep-blue to-deep-blue-dark flex items-center justify-center shadow-lg shadow-deep-blue/20">
                <FileText className="w-5 h-5 text-gold" />
              </div>
              <span className="font-heading text-xl font-bold text-deep-blue tracking-wide">
                年报工坊
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-deep-blue/5 text-deep-blue"
              >
                <LayoutDashboard className="w-4 h-4" />
                工作台
              </Link>
              <Link
                to="/templates"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Palette className="w-4 h-4" />
                模板中心
              </Link>
              <Link
                to="/projects/proj-2024-sustain/analytics"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                数据分析
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              />
            </div>

            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-deep-blue to-gold flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {MOCK_USER.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{MOCK_USER.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">管理员</p>
                </div>
              </button>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-gray-900">{MOCK_USER.name}</p>
                    <p className="text-sm text-gray-500">{MOCK_USER.email}</p>
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4" /> 账户设置
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                早上好，{MOCK_USER.name} <span className="text-gold">👋</span>
              </h1>
              <p className="text-gray-500">欢迎回到年报工坊，您有 {MOCK_PROJECTS.length} 个项目正在进行中</p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <Link
                to="/templates"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:border-deep-blue/30 hover:text-deep-blue transition-all"
              >
                <Palette className="w-4 h-4" />
                浏览模板
              </Link>
              <Link
                to="/projects/create"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                创建项目
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
          >
            <StatCard
              icon={FileText}
              label="总项目数"
              value={MOCK_PROJECTS.length}
              trend="+1 本月"
              color="#1e3a5f"
            />
            <StatCard
              icon={Eye}
              label="已发布"
              value={MOCK_PROJECTS.filter((p) => p.status === "published").length}
              trend="+12.5%"
              color="#10b981"
            />
            <StatCard
              icon={Users}
              label="协作者"
              value={12}
              trend="+3 本周"
              color="#c9a962"
            />
            <StatCard
              icon={BarChart3}
              label="总访问量"
              value={MOCK_ANALYTICS.totalVisits.toLocaleString()}
              trend="+8.3%"
              color="#6366f1"
            />
          </motion.div>

          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-heading font-bold text-gray-900">精选模板</h2>
                <p className="text-sm text-gray-500 mt-0.5">从专业模板开始，快速创建精美年报</p>
              </div>
              <Link
                to="/templates"
                className="flex items-center gap-1.5 text-sm font-medium text-deep-blue hover:text-gold transition-colors"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex gap-5">
                  {MOCK_TEMPLATES.map((template, idx) => (
                    <TemplateCard key={template.id} template={template} index={idx} />
                  ))}
                </motion.div>
              </div>
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-heading font-bold text-gray-900">我的项目</h2>
                <p className="text-sm text-gray-500 mt-0.5">最近编辑和进行中的项目</p>
              </div>
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-8 h-8 p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-deep-blue hover:border-deep-blue/30 transition-colors cursor-pointer" />
                <ChevronRight className="w-8 h-8 p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-deep-blue hover:border-deep-blue/30 transition-colors cursor-pointer" />
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project, idx) => (
                  <ProjectCard key={project.id} project={project} index={idx} />
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <FolderPlus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无匹配的项目</h3>
                <p className="text-gray-500 mb-6">尝试其他关键词或创建一个新项目</p>
                <Link
                  to="/projects/create"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  创建新项目
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
