import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Save,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo,
  Redo,
  MoreHorizontal,
  Layers,
  Type,
  BarChart3,
  PieChart,
  Table,
  Image,
  Minus,
  List,
  ArrowUp,
  ArrowDown,
  Pencil,
  Home,
  FolderOpen,
  Upload,
  Share2,
  Settings,
  TrendingUp,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  MOCK_PROJECTS,
  MOCK_TEMPLATES,
  buildDefaultSections,
  MOCK_REVENUE_DATA,
  MOCK_CITY_DATA,
  MOCK_SEGMENT_DATA,
} from "@shared/mockData";
import type { PageSection, ChartConfig } from "@shared/types";

const sectionTypeConfig = {
  cover: { icon: Image, label: "封面" },
  toc: { icon: List, label: "目录" },
  chart: { icon: BarChart3, label: "图表" },
  content: { icon: Type, label: "内容" },
  text: { icon: Type, label: "文本" },
  divider: { icon: Minus, label: "分隔" },
};

function ChartRenderer({ chart }: { chart: ChartConfig }) {
  const colors = chart.styleConfig.colorPalette;

  if (chart.type === "number") {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full flex flex-col justify-center">
        <p className="text-sm text-gray-500 mb-2">{chart.title}</p>
        <p className="text-3xl font-bold text-deep-blue">
          {chart.numberPrefix}
          {chart.numberValue?.toLocaleString()}
          {chart.numberSuffix}
        </p>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-gradient-to-r from-gold to-gold-light" />
      </div>
    );
  }

  if (chart.type === "progress") {
    const percent = ((chart.progressValue || 0) / (chart.progressMax || 100)) * 100;
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">{chart.title}</p>
            <p className="text-3xl font-bold text-deep-blue">{percent.toFixed(1)}%</p>
          </div>
          <Target className="w-8 h-8 text-gold" />
        </div>
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-deep-blue via-deep-blue-light to-gold"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>0</span>
          <span>目标 {chart.progressMax}%</span>
        </div>
      </div>
    );
  }

  if (chart.type === "line") {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full">
        <p className="text-sm font-semibold text-gray-700 mb-4">{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={MOCK_REVENUE_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: "16px" }} />
            <Line type="monotone" dataKey="revenue" name="营收" stroke={colors[0]} strokeWidth={3} dot={{ r: 4, fill: colors[0] }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="profit" name="利润" stroke={colors[1]} strokeWidth={3} dot={{ r: 4, fill: colors[1] }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "bar") {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full">
        <p className="text-sm font-semibold text-gray-700 mb-4">{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={MOCK_CITY_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="city" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            />
            <Bar dataKey="users" name="用户数" fill={colors[0]} radius={[6, 6, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "pie") {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full">
        <p className="text-sm font-semibold text-gray-700 mb-4">{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <RechartsPieChart>
            <Pie
              data={MOCK_SEGMENT_DATA}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
            >
              {MOCK_SEGMENT_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              formatter={(value) => `${value}%`}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: "12px" }} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "table") {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 mb-4">{chart.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">城市</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">用户数</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">营收(万)</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">增长率</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CITY_DATA.slice(0, 5).map((row) => (
                <tr key={row.city} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-900 font-medium">{row.city}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{row.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{row.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {row.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

function SectionBlock({
  section,
  isSelected,
  onSelect,
}: {
  section: PageSection;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = sectionTypeConfig[section.type as keyof typeof sectionTypeConfig]?.icon || Type;

  const renderContent = () => {
    if (section.type === "cover") {
      return (
        <div className="relative h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue-dark">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gold/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-gold/30"
            >
              <Image className="w-8 h-8 text-gold" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-heading font-bold text-white mb-3 tracking-wide"
            >
              {section.title || "年度报告标题"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gold-light text-lg tracking-widest"
            >
              {section.subtitle || "2024 ANNUAL REPORT"}
            </motion.p>
          </div>
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-gold/15 blur-2xl" />
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
        </div>
      );
    }

    if (section.type === "toc") {
      const items = ["封面", "核心经营数据", "业务结构分析", "战略成果与展望", "结语"];
      return (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-heading font-bold text-deep-blue mb-8 text-center">
            {section.title || "目 录"}
          </h3>
          <div className="max-w-xl mx-auto space-y-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 py-3 border-b border-dashed border-gray-200 last:border-0 group hover:pl-2 transition-all"
              >
                <span className="w-8 h-8 rounded-lg bg-deep-blue/5 text-deep-blue flex items-center justify-center text-sm font-semibold group-hover:bg-gold group-hover:text-white transition-all">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-gray-700 group-hover:text-deep-blue font-medium transition-colors">
                  {item}
                </span>
                <span className="text-gray-400 text-sm font-mono">p.{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (section.type === "content" || section.type === "text") {
      return (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          {section.title && (
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold text-deep-blue mb-2">
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-gold font-medium">{section.subtitle}</p>
              )}
              <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold to-gold-light" />
            </div>
          )}
          <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
            {(section.content || "").split("\n\n").map((para, i) => {
              if (para.startsWith("### ")) {
                return (
                  <h4 key={i} className="text-lg font-bold text-deep-blue mt-8 mb-3">
                    {para.replace("### ", "")}
                  </h4>
                );
              }
              if (para.startsWith("- ") || para.startsWith("1. ")) {
                const isOrdered = para.startsWith("1. ");
                const items = para.split("\n").map((l) => l.replace(/^[-1-9].\s*/, ""));
                return isOrdered ? (
                  <ol key={i} className="list-decimal pl-6 space-y-2 text-gray-600">
                    {items.map((it, j) => (
                      <li key={j} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.+?)\*\*/, '<strong class="text-deep-blue">$1</strong>') }} />
                    ))}
                  </ol>
                ) : (
                  <ul key={i} className="list-disc pl-6 space-y-2 text-gray-600">
                    {items.map((it, j) => (
                      <li key={j} dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.+?)\*\*/, '<strong class="text-deep-blue">$1</strong>') }} />
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={i}
                  className="leading-8"
                  dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.+?)\*\*/g, '<strong class="text-deep-blue">$1</strong>') }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    if (section.type === "divider") {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <div className="w-3 h-3 rounded-full bg-gold" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>
        </div>
      );
    }

    if (section.type === "chart" && section.charts) {
      return (
        <div className="bg-gradient-to-b from-gray-50/50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          {section.title && (
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-bold text-deep-blue mb-2">
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-gold font-medium">{section.subtitle}</p>
              )}
              <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold to-gold-light" />
            </div>
          )}
          <div className="grid grid-cols-12 gap-5">
            {section.charts.map((chart) => {
              const span =
                chart.width === "full"
                  ? "col-span-12"
                  : chart.width === "half"
                  ? "col-span-12 lg:col-span-6"
                  : chart.width === "third"
                  ? "col-span-12 md:col-span-6 lg:col-span-4"
                  : "col-span-6 lg:col-span-3";
              return (
                <div key={chart.id} className={span}>
                  <ChartRenderer chart={chart} />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      layoutId={`section-${section.id}`}
      onClick={onSelect}
      className={`group relative rounded-2xl transition-all duration-200 cursor-pointer ${
        isSelected ? "ring-2 ring-gold shadow-xl" : "hover:shadow-lg"
      }`}
    >
      {isSelected && (
        <div className="absolute -left-12 top-8 w-10 h-10 rounded-xl bg-gold text-white flex items-center justify-center shadow-lg shadow-gold/30 z-10">
          <Pencil className="w-5 h-5" />
        </div>
      )}
      {renderContent()}
    </motion.div>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const [sections, setSections] = useState<PageSection[]>(() => buildDefaultSections(id || ""));
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(sections[0]?.id || null);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isSaved, setIsSaved] = useState(true);

  const project = MOCK_PROJECTS.find((p) => p.id === id);
  const template = MOCK_TEMPLATES.find((t) => t.id === project?.templateId);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const selectedChart = useMemo(() => {
    if (!selectedSection?.charts) return null;
    return selectedSection.charts.find((c) => c.id === selectedChartId) || null;
  }, [selectedSection, selectedChartId]);

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
    setIsSaved(false);
  };

  const updateChartTitle = (newTitle: string) => {
    if (!selectedSectionId || !selectedChartId) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSectionId) return s;
        return {
          ...s,
          charts: s.charts?.map((c) => (c.id === selectedChartId ? { ...c, title: newTitle } : c)),
        };
      })
    );
    setIsSaved(false);
  };

  const updateSectionTitle = (newTitle: string) => {
    if (!selectedSectionId) return;
    setSections((prev) =>
      prev.map((s) => (s.id === selectedSectionId ? { ...s, title: newTitle } : s))
    );
    setIsSaved(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-semibold text-gray-900 text-lg">
                  {project?.name || "未命名项目"}
                </h1>
                {!isSaved && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    未保存
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: template?.theme.primaryColor || "#1e3a5f" }}
                />
                模板：{template?.name || "默认"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors">
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-14 text-center text-sm font-medium text-gray-700">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button className="p-2 rounded-lg hover:bg-white text-gray-500 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 2000);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <Link
              to={`/view/${id}-pub`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:border-deep-blue/30 hover:text-deep-blue transition-all"
            >
              <Eye className="w-4 h-4" />
              预览
            </Link>
            <button className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-deep-blue" />
                章节列表
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                {sections.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sections.map((section, index) => {
              const Icon = sectionTypeConfig[section.type as keyof typeof sectionTypeConfig]?.icon || Type;
              const isSelected = section.id === selectedSectionId;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group"
                >
                  <div
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setSelectedChartId(null);
                    }}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-deep-blue/10 to-transparent text-deep-blue border border-deep-blue/20"
                        : "hover:bg-gray-50 text-gray-700 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? "bg-deep-blue text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {section.title || sectionTypeConfig[section.type as keyof typeof sectionTypeConfig]?.label || "未命名"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {sectionTypeConfig[section.type as keyof typeof sectionTypeConfig]?.label || section.type}
                        {section.charts?.length ? ` · ${section.charts.length}个图表` : ""}
                      </p>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5 absolute right-2 bg-white rounded-lg shadow-sm border border-gray-100 p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, "up");
                        }}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-deep-blue disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(index, "down");
                        }}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-deep-blue disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {isSelected && section.charts && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="ml-6 mt-1.5 space-y-1 overflow-hidden"
                    >
                      {section.charts.map((chart) => {
                        const isChartSelected = chart.id === selectedChartId;
                        const ChartIcon =
                          chart.type === "line"
                            ? TrendingUp
                            : chart.type === "bar"
                            ? BarChart3
                            : chart.type === "pie"
                            ? PieChart
                            : chart.type === "table"
                            ? Table
                            : chart.type === "number"
                            ? Target
                            : BarChart3;
                        return (
                          <div
                            key={chart.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChartId(chart.id);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                              isChartSelected
                                ? "bg-gold/10 text-gold border border-gold/20"
                                : "text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <ChartIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{chart.title}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">快速添加</p>
            {Object.entries(sectionTypeConfig).map(([key, { icon: Icon, label }]) => (
              <button
                key={key}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-deep-blue/5 hover:text-deep-blue transition-colors"
              >
                <Icon className="w-4 h-4" />
                添加{label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-100 to-gray-50">
          <div
            className="max-w-5xl mx-auto p-8 space-y-6 transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <AnimatePresence>
              {sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  onSelect={() => {
                    setSelectedSectionId(section.id);
                    setSelectedChartId(null);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </main>

        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold" />
              属性面板
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {selectedChart ? (
              <>
                <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-xl p-4 border border-gold/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">图表属性</p>
                      <p className="text-xs text-gray-500">{selectedChart.type} 类型</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图表标题</label>
                  <input
                    type="text"
                    value={selectedChart.title}
                    onChange={(e) => updateChartTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">副标题 (可选)</label>
                  <input
                    type="text"
                    placeholder="添加副标题..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">尺寸宽度</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["quarter", "third", "half", "full"] as const).map((w) => (
                      <button
                        key={w}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedChart.width === w
                            ? "bg-deep-blue text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {w === "quarter" ? "1/4" : w === "third" ? "1/3" : w === "half" ? "1/2" : "全宽"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">配色方案</label>
                  <div className="space-y-2">
                    {[
                      ["#1e3a5f", "#c9a962", "#4a90a4", "#7cb342"],
                      ["#0d7377", "#14ffec", "#323232", "#21d4fd"],
                      ["#2d3436", "#e17055", "#00b894", "#0984e3"],
                    ].map((palette, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                          i === 0 ? "border-gold bg-gold/5" : "border-transparent bg-gray-50 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex gap-1">
                          {palette.map((c, j) => (
                            <div
                              key={j}
                              className="w-6 h-6 rounded-lg shadow-sm"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">方案 {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">显示图例</span>
                    <div className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${selectedChart.styleConfig.showLegend ? "bg-deep-blue" : "bg-gray-200"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${selectedChart.styleConfig.showLegend ? "translate-x-5" : ""}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">显示网格</span>
                    <div className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${selectedChart.styleConfig.showGrid ? "bg-deep-blue" : "bg-gray-200"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${selectedChart.styleConfig.showGrid ? "translate-x-5" : ""}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">开启动画</span>
                    <div className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${selectedChart.styleConfig.animationEnabled ? "bg-deep-blue" : "bg-gray-200"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${selectedChart.styleConfig.animationEnabled ? "translate-x-5" : ""}`} />
                    </div>
                  </div>
                </div>
              </>
            ) : selectedSection ? (
              <>
                <div className="bg-gradient-to-br from-deep-blue/10 to-transparent rounded-xl p-4 border border-deep-blue/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-deep-blue/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-deep-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">章节属性</p>
                      <p className="text-xs text-gray-500">
                        {sectionTypeConfig[selectedSection.type as keyof typeof sectionTypeConfig]?.label || selectedSection.type}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">章节标题</label>
                  <input
                    type="text"
                    value={selectedSection.title || ""}
                    onChange={(e) => updateSectionTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">副标题</label>
                  <input
                    type="text"
                    value={selectedSection.subtitle || ""}
                    placeholder="添加副标题..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">章节类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sectionTypeConfig).map(([key, { icon: Icon, label }]) => (
                      <button
                        key={key}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          selectedSection.type === key
                            ? "bg-deep-blue text-white shadow-md shadow-deep-blue/20"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSection.charts && selectedSection.charts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      包含图表 ({selectedSection.charts.length})
                    </label>
                    <div className="space-y-2">
                      {selectedSection.charts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedChartId(c.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            c.id === selectedChartId
                              ? "bg-gold/10 border border-gold/20"
                              : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            c.id === selectedChartId ? "bg-gold text-white" : "bg-deep-blue/10 text-deep-blue"
                          }`}>
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                            <p className="text-xs text-gray-500">{c.type} · {c.width}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">选择一个元素</p>
                <p className="text-xs text-gray-400">点击画布中的章节或图表查看属性</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Link
              to={`/projects/${id}/data-import`}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-deep-blue hover:text-white transition-all"
            >
              <Upload className="w-4 h-4" />
              管理数据
            </Link>
            <Link
              to={`/projects/${id}/collaboration`}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-deep-blue hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
              协作设置
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
