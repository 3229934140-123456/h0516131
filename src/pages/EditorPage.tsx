import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Upload,
  Share2,
  Settings,
  TrendingUp,
  Target,
  Loader2,
  Check,
  Lock,
} from "lucide-react";
import { DEFAULT_PALETTES } from "@shared/mockData";
import type { PageSection, ChartConfig, DataSource, DataField } from "@shared/types";
import { useAppStore } from "@/store/appStore";
import { ChartRenderer } from "@/components/charts/ChartRenderer";

const sectionTypeConfig = {
  cover: { icon: Image, label: "封面" },
  toc: { icon: List, label: "目录" },
  chart: { icon: BarChart3, label: "图表" },
  content: { icon: Type, label: "内容" },
  text: { icon: Type, label: "文本" },
  divider: { icon: Minus, label: "分隔" },
};

const formatSaveTime = (date: Date | string | null): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚保存";
  if (diffMin < 60) return `${diffMin}分钟前保存`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前保存`;
  return d.toLocaleDateString("zh-CN");
};

const SwitchToggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${checked ? "bg-deep-blue" : "bg-gray-200"}`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-5" : ""
      }`}
    />
  </div>
);

const ToggleGroup: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ options, value, onChange, disabled }) => (
  <div className={`grid grid-cols-${options.length} gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
    {options.map((opt) => (
      <button
        key={opt.value}
        disabled={disabled}
        onClick={() => !disabled && onChange(opt.value)}
        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${
          value === opt.value
            ? "bg-deep-blue text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);

  const {
    sections,
    dataSources,
    projects,
    templates,
    selectedItem,
    saveStatus,
    lastSavedAt,
    setCurrentProject,
    fetchProjects,
    fetchTemplates,
    updateSection,
    updateChart,
    reorderSections,
    setSelectedItem,
    canEditData,
    canEditContent,
    triggerManualSave,
  } = useAppStore();

  const editContent = canEditContent();
  const editData = canEditData();

  useEffect(() => {
    if (id) {
      fetchProjects();
      fetchTemplates();
      setCurrentProject(id);
    }
  }, [id]);

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id]
  );
  const template = useMemo(
    () => templates.find((t) => t.id === project?.templateId),
    [templates, project]
  );

  const selectedSectionId = selectedItem.sectionId;
  const selectedChartId = selectedItem.chartId;

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const selectedChart = useMemo(() => {
    if (!selectedSection?.charts) return null;
    return selectedSection.charts.find((c) => c.id === selectedChartId) || null;
  }, [selectedSection, selectedChartId]);

  const selectedDataSource = useMemo(
    () => dataSources.find((ds) => ds.id === selectedChart?.dataSourceId) || null,
    [dataSources, selectedChart]
  );

  const selectSection = (sectionId: string) => {
    setSelectedItem({ sectionId, chartId: null });
  };

  const selectChart = (sectionId: string, chartId: string) => {
    setSelectedItem({ sectionId, chartId });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (!editContent) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    reorderSections(index, targetIndex);
  };

  const handleUpdateChartConfig = (updates: Partial<ChartConfig>) => {
    if (!selectedSectionId || !selectedChartId || !editContent) return;
    updateChart(selectedSectionId, selectedChartId, updates);
  };

  const handleUpdateStyleConfig = (styleUpdates: Partial<ChartConfig["styleConfig"]>) => {
    if (!selectedChart || !editContent) return;
    handleUpdateChartConfig({
      styleConfig: { ...selectedChart.styleConfig, ...styleUpdates },
    });
  };

  const handleToggleYField = (field: string) => {
    if (!selectedChart || !editContent) return;
    const current = selectedChart.yFields || [];
    const next = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    handleUpdateChartConfig({ yFields: next });
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
                {(saveStatus as string) === "saving" && (
                  <span className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    保存中...
                  </span>
                )}
                {(saveStatus as string) === "saved" && lastSavedAt && (
                  <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                    <Check className="w-3 h-3" />
                    已保存 · {formatSaveTime(lastSavedAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: template?.theme.primaryColor || "#1e3a5f" }}
                />
                模板：{template?.name || "默认"}
                {!editContent && (
                  <span className="flex items-center gap-1 text-amber-600 ml-2">
                    <Lock className="w-3 h-3" />
                    只读模式
                  </span>
                )}
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
                triggerManualSave();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!editContent}
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <Link
              to={`/preview/${id}`}
              target="_blank"
              rel="noopener noreferrer"
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
                    onClick={() => selectSection(section.id)}
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
                    <div className={`hidden group-hover:flex items-center gap-0.5 absolute right-2 bg-white rounded-lg shadow-sm border border-gray-100 p-0.5 ${!editContent ? "!hidden" : ""}`}>
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
                              selectChart(section.id, chart.id);
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
          <div className={`p-4 border-t border-gray-100 space-y-2 ${!editContent ? "opacity-50 pointer-events-none" : ""}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">快速添加</p>
            {Object.entries(sectionTypeConfig).map(([key, { icon: Icon, label }]) => (
              <button
                key={key}
                disabled={!editContent}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-deep-blue/5 hover:text-deep-blue transition-colors disabled:cursor-not-allowed"
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
                  selectedChartId={selectedChartId}
                  dataSources={dataSources}
                  onSelect={() => selectSection(section.id)}
                  onSelectChart={(chartId) => selectChart(section.id, chartId)}
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
              {!editContent && (
                <Lock className="w-3.5 h-3.5 text-amber-500 ml-auto" />
              )}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {selectedChart && selectedSectionId ? (
              <ChartPropertyPanel
                chart={selectedChart}
                dataSource={selectedDataSource}
                dataSources={dataSources}
                disabled={!editContent}
                onChange={handleUpdateChartConfig}
                onStyleChange={handleUpdateStyleConfig}
                onToggleYField={handleToggleYField}
              />
            ) : selectedSection && selectedSectionId ? (
              <SectionPropertyPanel
                section={selectedSection}
                selectedChartId={selectedChartId}
                disabled={!editContent}
                onSelectChart={(chartId) => selectChart(selectedSectionId, chartId)}
                onChange={(updates) => {
                  if (!editContent) return;
                  updateSection(selectedSectionId, updates);
                }}
              />
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
            {editData ? (
              <Link
                to={`/projects/${id}/data-import`}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-deep-blue hover:text-white transition-all"
              >
                <Upload className="w-4 h-4" />
                管理数据
              </Link>
            ) : (
              <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-400 cursor-not-allowed">
                <Lock className="w-4 h-4" />
                管理数据（无权限）
              </div>
            )}
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

function SectionBlock({
  section,
  isSelected,
  selectedChartId,
  dataSources,
  onSelect,
  onSelectChart,
}: {
  section: PageSection;
  isSelected: boolean;
  selectedChartId: string | null;
  dataSources: DataSource[];
  onSelect: () => void;
  onSelectChart: (chartId: string) => void;
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
          <div className="flex flex-wrap -mx-2">
            {section.charts.map((chart) => (
              <ChartRenderer
                key={chart.id}
                config={chart}
                dataSources={dataSources}
                sectionId={section.id}
                isSelected={chart.id === selectedChartId}
                onClick={() => onSelectChart(chart.id)}
              />
            ))}
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

function SectionPropertyPanel({
  section,
  selectedChartId,
  disabled,
  onSelectChart,
  onChange,
}: {
  section: PageSection;
  selectedChartId: string | null;
  disabled: boolean;
  onSelectChart: (chartId: string) => void;
  onChange: (updates: Partial<PageSection>) => void;
}) {
  const borderClass = disabled ? "border-dashed border-gray-300 bg-gray-50" : "border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-gold/50 focus:border-gold";
  return (
    <>
      <div className="bg-gradient-to-br from-deep-blue/10 to-transparent rounded-xl p-4 border border-deep-blue/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-deep-blue/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-deep-blue" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">章节属性</p>
            <p className="text-xs text-gray-500">
              {sectionTypeConfig[section.type as keyof typeof sectionTypeConfig]?.label || section.type}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">章节标题</label>
        <input
          type="text"
          value={section.title || ""}
          disabled={disabled}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="输入章节标题..."
          className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "cursor-not-allowed text-gray-500" : ""}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">副标题</label>
        <input
          type="text"
          value={section.subtitle || ""}
          disabled={disabled}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="添加副标题..."
          className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "cursor-not-allowed text-gray-500" : ""}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">章节类型</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(sectionTypeConfig).map(([key, { icon: Icon, label }]) => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onChange({ type: key as any })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              } ${
                section.type === key
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

      {section.charts && section.charts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            包含图表 ({section.charts.length})
          </label>
          <div className="space-y-2">
            {section.charts.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectChart(c.id)}
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
  );
}

function ChartPropertyPanel({
  chart,
  dataSource,
  dataSources,
  disabled,
  onChange,
  onStyleChange,
  onToggleYField,
}: {
  chart: ChartConfig;
  dataSource: DataSource | null;
  dataSources: DataSource[];
  disabled: boolean;
  onChange: (updates: Partial<ChartConfig>) => void;
  onStyleChange: (updates: Partial<ChartConfig["styleConfig"]>) => void;
  onToggleYField: (field: string) => void;
}) {
  const borderClass = disabled
    ? "border-dashed border-gray-300 bg-gray-50 cursor-not-allowed"
    : "border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-gold/50 focus:border-gold";

  const needsXField = chart.type === "line" || chart.type === "bar";
  const needsYFields = chart.type === "line" || chart.type === "bar";
  const needsValueField = chart.type === "pie";
  const needsLabelField = chart.type === "pie";

  const stringFields = dataSource?.fields.filter((f) => f.type === "string") || [];
  const numericFields = dataSource?.fields.filter(
    (f) => f.type === "number" || f.type === "currency" || f.type === "percentage"
  ) || [];

  return (
    <>
      <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-xl p-4 border border-gold/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">图表属性</p>
            <p className="text-xs text-gray-500">{chart.type} 类型</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">图表标题</label>
        <input
          type="text"
          value={chart.title}
          disabled={disabled}
          onChange={(e) => onChange({ title: e.target.value })}
          className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">副标题 (可选)</label>
        <input
          type="text"
          value={chart.subtitle || ""}
          disabled={disabled}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="添加副标题..."
          className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">尺寸宽度</label>
        <ToggleGroup
          disabled={disabled}
          options={[
            { value: "quarter", label: "1/4" },
            { value: "third", label: "1/3" },
            { value: "half", label: "1/2" },
            { value: "full", label: "全宽" },
          ]}
          value={chart.width}
          onChange={(v) => onChange({ width: v as any })}
        />
      </div>

      {(chart.type === "number") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">数值</label>
          <input
            type="number"
            value={chart.numberValue ?? 0}
            disabled={disabled}
            onChange={(e) => onChange({ numberValue: Number(e.target.value) })}
            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              type="text"
              placeholder="前缀"
              value={chart.numberPrefix || ""}
              disabled={disabled}
              onChange={(e) => onChange({ numberPrefix: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
            />
            <input
              type="text"
              placeholder="后缀"
              value={chart.numberSuffix || ""}
              disabled={disabled}
              onChange={(e) => onChange({ numberSuffix: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
            />
          </div>
        </div>
      )}

      {(chart.type === "progress") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">进度</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500 mb-1 block">当前值</span>
              <input
                type="number"
                value={chart.progressValue ?? 0}
                disabled={disabled}
                onChange={(e) => onChange({ progressValue: Number(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
              />
            </div>
            <div>
              <span className="text-xs text-gray-500 mb-1 block">最大值</span>
              <input
                type="number"
                value={chart.progressMax ?? 100}
                disabled={disabled}
                onChange={(e) => onChange({ progressMax: Number(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
              />
            </div>
          </div>
        </div>
      )}

      {needsXField || needsYFields || needsValueField || needsLabelField ? (
        <>
          <div className="h-px bg-gray-100 -mx-1" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数据源</label>
              <select
                value={chart.dataSourceId}
                disabled={disabled}
                onChange={(e) => onChange({ dataSourceId: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
              >
                {dataSources.length === 0 && <option value="">暂无数据源</option>}
                {dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.rowCount} 行)
                  </option>
                ))}
              </select>
            </div>

            {needsXField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">X轴字段 (分类)</label>
                <select
                  value={chart.xField || ""}
                  disabled={disabled || !dataSource}
                  onChange={(e) => onChange({ xField: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled || !dataSource ? "text-gray-500" : ""}`}
                >
                  <option value="">请选择字段</option>
                  {(dataSource?.fields || []).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} ({f.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsYFields && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Y轴字段 (可多选)</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {numericFields.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-2 py-2">
                      {dataSource ? "当前数据源无可选数值字段" : "请先选择数据源"}
                    </p>
                  )}
                  {numericFields.map((f) => {
                    const checked = (chart.yFields || []).includes(f.key);
                    return (
                      <label
                        key={f.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        } ${
                          checked
                            ? "bg-deep-blue/10 text-deep-blue border border-deep-blue/20"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => onToggleYField(f.key)}
                          className="w-3.5 h-3.5 rounded accent-deep-blue"
                        />
                        <span className="flex-1">{f.label}</span>
                        <span className="text-xs opacity-60">{f.type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {needsValueField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">数值字段</label>
                <select
                  value={chart.valueField || ""}
                  disabled={disabled || !dataSource}
                  onChange={(e) => onChange({ valueField: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled || !dataSource ? "text-gray-500" : ""}`}
                >
                  <option value="">请选择字段</option>
                  {numericFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} ({f.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsLabelField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签字段</label>
                <select
                  value={chart.labelField || ""}
                  disabled={disabled || !dataSource}
                  onChange={(e) => onChange({ labelField: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled || !dataSource ? "text-gray-500" : ""}`}
                >
                  <option value="">请选择字段</option>
                  {(dataSource?.fields || []).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} ({f.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className="h-px bg-gray-100 -mx-1" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">配色方案</label>
        <div className="space-y-2">
          {DEFAULT_PALETTES.map((palette, i) => {
            const isSelected =
              JSON.stringify(chart.styleConfig.colorPalette) === JSON.stringify(palette);
            return (
              <div
                key={i}
                onClick={() => !disabled && onStyleChange({ colorPalette: palette })}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  isSelected
                    ? "border-gold bg-gold/5"
                    : "border-transparent bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className="flex gap-1">
                  {palette.slice(0, 4).map((c, j) => (
                    <div
                      key={j}
                      className="w-6 h-6 rounded-lg shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 font-medium">方案 {i + 1}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-gold ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">显示图例</span>
          <SwitchToggle
            checked={chart.styleConfig.showLegend}
            disabled={disabled}
            onChange={(v) => onStyleChange({ showLegend: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">显示网格</span>
          <SwitchToggle
            checked={chart.styleConfig.showGrid}
            disabled={disabled}
            onChange={(v) => onStyleChange({ showGrid: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">显示数据标签</span>
          <SwitchToggle
            checked={chart.styleConfig.showLabels}
            disabled={disabled}
            onChange={(v) => onStyleChange({ showLabels: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">开启动画</span>
          <SwitchToggle
            checked={chart.styleConfig.animationEnabled}
            disabled={disabled}
            onChange={(v) => onStyleChange({ animationEnabled: v })}
          />
        </div>
      </div>

      {(chart.type === "line" || chart.type === "bar") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {chart.type === "line" ? "线条粗细" : "柱体圆角"}
          </label>
          <input
            type="number"
            min={1}
            max={chart.type === "line" ? 10 : 20}
            value={chart.type === "line" ? chart.styleConfig.strokeWidth : chart.styleConfig.barRadius}
            disabled={disabled}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (chart.type === "line") {
                onStyleChange({ strokeWidth: v });
              } else {
                onStyleChange({ barRadius: v });
              }
            }}
            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">字体</label>
        <select
          value={chart.styleConfig.fontFamily}
          disabled={disabled}
          onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
          className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${borderClass} focus:outline-none ${disabled ? "text-gray-500" : ""}`}
        >
          <option value="Manrope">Manrope</option>
          <option value="Inter">Inter</option>
          <option value="Helvetica Neue">Helvetica Neue</option>
          <option value="Space Grotesk">Space Grotesk</option>
          <option value="Playfair Display">Playfair Display</option>
        </select>
      </div>
    </>
  );
}
