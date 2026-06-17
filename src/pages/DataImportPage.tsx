import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  Check,
  X,
  Trash2,
  Database,
  ArrowRight,
  RefreshCw,
  Eye,
  ArrowUpDown,
  Download,
  Plus,
  Sparkles,
} from "lucide-react";
import { MOCK_DATA_SOURCES, MOCK_PROJECTS, MOCK_REVENUE_DATA } from "@shared/mockData";
import type { DataSource } from "@shared/types";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DataImportPage() {
  const { id } = useParams();
  const project = MOCK_PROJECTS.find((p) => p.id === id) || MOCK_PROJECTS[0];
  const [dataSources, setDataSources] = useState<DataSource[]>(MOCK_DATA_SOURCES);
  const [selectedSource, setSelectedSource] = useState<string | null>(MOCK_DATA_SOURCES[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"sources" | "preview">("sources");

  const activeSource = dataSources.find((d) => d.id === selectedSource);

  const removeSource = (sourceId: string) => {
    setDataSources((prev) => prev.filter((d) => d.id !== sourceId));
    if (selectedSource === sourceId) {
      setSelectedSource(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}/editor`}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <Database className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">数据导入</h1>
                <p className="text-xs text-gray-500 leading-tight">{project?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all">
              <RefreshCw className="w-4 h-4" />
              同步数据
            </button>
            <Link
              to={`/projects/${id}/editor`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              前往编辑器
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 mb-10 text-center transition-all ${
            isDragging
              ? "border-gold bg-gold/5"
              : "border-gray-200 bg-white hover:border-deep-blue/30 hover:bg-deep-blue/5"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
        >
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-deep-blue/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
          </div>
          <div className="relative z-10">
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center shadow-xl shadow-deep-blue/20"
            >
              <Upload className="w-10 h-10 text-gold" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">拖放文件到此处上传</h2>
            <p className="text-gray-500 mb-8">或者点击下方按钮选择文件，支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <button className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-xl hover:shadow-deep-blue/30 transition-all">
                <FileSpreadsheet className="w-5 h-5" />
                选择 Excel 文件
              </button>
              <button className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all">
                <FileText className="w-5 h-5" />
                选择 CSV 文件
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4" />
              <span>智能识别数据类型，自动完成字段映射</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">数据源列表</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{dataSources.length} 个数据源已导入</p>
                </div>
                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center text-white hover:shadow-lg hover:shadow-deep-blue/30 transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {dataSources.map((source, idx) => {
                    const isActive = selectedSource === source.id;
                    const isExcel = source.fileName.endsWith(".xlsx");
                    return (
                      <motion.div
                        key={source.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          setSelectedSource(source.id);
                          setActiveTab("preview");
                        }}
                        className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-deep-blue/10 to-transparent border border-deep-blue/20"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isExcel ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {isExcel ? (
                              <FileSpreadsheet className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-semibold truncate ${
                                isActive ? "text-deep-blue" : "text-gray-900"
                              }`}
                            >
                              {source.name}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{source.fileName}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                <Database className="w-3 h-3" />
                                {source.rowCount} 行
                              </span>
                              <span className="text-xs text-gray-400">
                                {source.fields.length} 字段
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSource(source.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-gradient-to-b from-deep-blue to-gold" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeSource ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab("sources")}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "sources"
                          ? "bg-white text-deep-blue shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      字段映射
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "preview"
                          ? "bg-white text-deep-blue shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      数据预览
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" />
                      导出
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "sources" ? (
                    <motion.div
                      key="fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-6"
                    >
                      <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-800 mb-1">智能映射完成</h4>
                          <p className="text-sm text-green-700/80">
                            系统已自动识别并完成 {activeSource.fields.length} 个字段的类型映射，您可以根据需要调整
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {activeSource.fields.map((field, idx) => (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-sm font-bold text-deep-blue">
                              {idx + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">源字段</p>
                                <p className="font-semibold text-gray-900">{field.mappedFrom || field.key}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-300 mx-auto" />
                              <div>
                                <p className="text-xs text-gray-500 mb-1">显示名称</p>
                                <input
                                  type="text"
                                  value={field.label}
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                                />
                              </div>
                            </div>
                            <select
                              value={field.type}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                            >
                              <option value="string">文本</option>
                              <option value="number">数字</option>
                              <option value="currency">货币</option>
                              <option value="percentage">百分比</option>
                              <option value="date">日期</option>
                            </select>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gradient-to-r from-deep-blue to-deep-blue-light text-white sticky top-0">
                            <tr>
                              <th className="text-left py-4 px-6 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  #
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                              </th>
                              {activeSource.fields.map((field) => (
                                <th
                                  key={field.key}
                                  className="text-left py-4 px-6 font-semibold whitespace-nowrap"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {field.label}
                                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(activeSource.rows || MOCK_REVENUE_DATA).slice(0, 15).map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-gray-50 ${
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                } hover:bg-deep-blue/5 transition-colors`}
                              >
                                <td className="py-3.5 px-6 text-gray-400 font-mono text-xs">
                                  {String(i + 1).padStart(2, "0")}
                                </td>
                                {activeSource.fields.map((field) => (
                                  <td key={field.key} className="py-3.5 px-6 text-gray-700 whitespace-nowrap">
                                    {field.type === "currency"
                                      ? `¥${Number(row[field.key] || 0).toLocaleString()}`
                                      : field.type === "percentage"
                                      ? `${row[field.key]}%`
                                      : field.type === "number"
                                      ? Number(row[field.key] || 0).toLocaleString()
                                      : String(row[field.key] ?? "-")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                          显示 1 - 15 条，共 <span className="font-semibold text-gray-900">{activeSource.rowCount}</span> 条数据
                        </p>
                        <div className="flex items-center gap-1">
                          <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-deep-blue hover:border-deep-blue/30 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button className="w-9 h-9 rounded-lg bg-deep-blue text-white font-semibold text-sm">1</button>
                          <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-deep-blue hover:border-deep-blue/30 transition-colors text-sm font-medium">2</button>
                          <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-deep-blue hover:border-deep-blue/30 transition-colors text-sm font-medium">3</button>
                          <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-deep-blue hover:border-deep-blue/30 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gray-100 flex items-center justify-center">
                  <Database className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">选择一个数据源</h3>
                <p className="text-gray-500">点击左侧列表中的数据源查看详细信息和数据预览</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
