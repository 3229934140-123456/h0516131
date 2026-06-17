import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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
  Plus,
  Sparkles,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import type { DataField } from "@shared/types";

function inferFieldType(values: any[]): DataField["type"] {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );

  if (nonEmpty.length === 0) return "string";

  const strValues = nonEmpty.map((v) => String(v).trim());

  const hasPercent = strValues.some((v) => v.includes("%"));
  if (hasPercent) return "percentage";

  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/,
    /^\d{4}年\d{1,2}月/,
  ];
  const allDates = strValues.every((v) => datePatterns.some((p) => p.test(v)));
  if (allDates) return "date";

  const numericValues = values
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => {
      if (typeof v === "number") return v;
      const cleaned = String(v).replace(/[,%¥￥\s]/g, "");
      return parseFloat(cleaned);
    })
    .filter((v) => !isNaN(v));

  if (numericValues.length === 0) return "string";

  const allNumeric = numericValues.length === nonEmpty.length;
  if (!allNumeric) return "string";

  const largeEnough = numericValues.every((v) => Math.abs(v) >= 1000);
  if (largeEnough) return "currency";

  const allWithin100 = numericValues.every((v) => v >= 0 && v <= 100);
  const hasDecimal = numericValues.some((v) => v % 1 !== 0);
  if (allWithin100 && hasDecimal) return "percentage";

  return "number";
}

async function computeFileHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

type ToastType = "success" | "info" | "warning" | "error";
interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export default function DataImportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = useAppStore((s) => s.getCurrentProject());
  const dataSources = useAppStore((s) => s.dataSources);
  const addDataSource = useAppStore((s) => s.addDataSource);
  const updateDataSource = useAppStore((s) => s.updateDataSource);
  const deleteDataSource = useAppStore((s) => s.deleteDataSource);
  const editDataSourceFields = useAppStore((s) => s.editDataSourceFields);
  const currentUser = useAppStore((s) => s.currentUser);
  const canEditData = useAppStore((s) => s.canEditData);

  const [selectedSource, setSelectedSource] = useState<string | null>(
    dataSources[0]?.id || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"sources" | "preview">("sources");
  const [uploading, setUploading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [syncSourceId, setSyncSourceId] = useState<string | null>(null);

  const editable = canEditData();

  useEffect(() => {
    if (!selectedSource && dataSources.length > 0) {
      setSelectedSource(dataSources[0].id);
    }
  }, [dataSources, selectedSource]);

  const activeSource = dataSources.find((d) => d.id === selectedSource);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg backdrop-blur-xl border ${
              toast.type === "success"
                ? "bg-green-50/95 border-green-200 text-green-800"
                : toast.type === "warning"
                ? "bg-amber-50/95 border-amber-200 text-amber-800"
                : toast.type === "error"
                ? "bg-red-50/95 border-red-200 text-red-800"
                : "bg-blue-50/95 border-blue-200 text-blue-800"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            )}
            {toast.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
            {toast.type === "warning" && (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            {toast.type === "error" && <X className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium whitespace-nowrap">
              {toast.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const parseFile = async (
    file: File
  ): Promise<{ fields: DataField[]; rows: Record<string, any>[]; fileHash: string }> => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const content = await file.text();
    const fileHash = await computeFileHash(content + file.size + file.lastModified);

    let rows: Record<string, any>[] = [];
    let headers: string[] = [];

    if (extension === "csv") {
      const result = Papa.parse<string[]>(content, {
        header: false,
        skipEmptyLines: true,
      });
      const data = (result as any).data as string[][];
      if (data.length > 0) {
        headers = data[0].map((h) => String(h).trim());
        rows = data.slice(1).map((row) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => {
            const val = row[i];
            if (val !== undefined && val !== "") {
              const num = Number(val);
              obj[h] = isNaN(num) ? val : num;
            } else {
              obj[h] = null;
            }
          });
          return obj;
        });
      }
    } else if (extension === "xlsx" || extension === "xls") {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(firstSheet, {
        header: 1,
        defval: null,
      });
      if (jsonData.length > 0) {
        headers = (jsonData[0] as any[]).map((h) =>
          h !== null && h !== undefined ? String(h).trim() : ""
        );
        rows = (jsonData.slice(1) as any[][]).map((row) => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => {
            if (!h) return;
            const val = row[i];
            if (val !== undefined && val !== null && val !== "") {
              obj[h] = val;
            } else {
              obj[h] = null;
            }
          });
          return obj;
        });
      }
    }

    rows = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== ""));

    const fields: DataField[] = headers
      .filter((h) => h)
      .map((key, idx) => {
        const colValues = rows.map((r) => r[key]);
        return {
          key: `col_${idx}_${key}`,
          label: key,
          type: inferFieldType(colValues),
          mappedFrom: key,
        };
      });

    return { fields, rows, fileHash };
  };

  const handleFileSelect = async (
    file: File,
    options?: { syncExisting?: boolean; existingSourceId?: string }
  ) => {
    if (!editable) {
      showToast("warning", "您没有数据管理权限");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension || "")) {
      showToast("error", "不支持的文件格式，请上传 CSV 或 Excel 文件");
      return;
    }

    setUploading(true);
    try {
      const { fields, rows, fileHash } = await parseFile(file);

      if (fields.length === 0 || rows.length === 0) {
        showToast("error", "文件内容为空或格式不正确");
        return;
      }

      if (options?.syncExisting && options.existingSourceId) {
        const existing = dataSources.find((d) => d.id === options.existingSourceId);
        if (existing) {
          if (existing.fileHash === fileHash) {
            showToast("info", "文件内容未发生变化");
          } else {
            await updateDataSource(options.existingSourceId, {
              fields,
              rows,
              fileHash,
              rowCount: rows.length,
              fileName: file.name,
            });
            showToast("success", "数据有更新，图表将自动刷新");
          }
        }
      } else {
        const existingSameName = dataSources.find(
          (d) => d.fileName === file.name && d.projectId === id
        );
        if (existingSameName) {
          if (existingSameName.fileHash === fileHash) {
            showToast("info", "该文件已导入且内容未变化");
            setSelectedSource(existingSameName.id);
          } else {
            const proceed = window.confirm(
              `已存在同名文件 "${file.name}"，是否更新现有数据源？`
            );
            if (proceed) {
              await updateDataSource(existingSameName.id, {
                fields,
                rows,
                fileHash,
                rowCount: rows.length,
              });
              setSelectedSource(existingSameName.id);
              showToast("success", "数据有更新，图表将自动刷新");
            }
          }
        } else {
          const nameWithoutExt = file.name.replace(/\.(csv|xlsx|xls)$/i, "");
          const newSource = await addDataSource({
            projectId: id!,
            name: nameWithoutExt,
            fileName: file.name,
            fields,
            rows,
            importedBy: currentUser.id,
            rowCount: rows.length,
            fileHash,
          });
          setSelectedSource(newSource.id);
          showToast("success", `导入成功！共 ${rows.length} 行 ${fields.length} 个字段`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "文件解析失败，请检查文件格式");
    } finally {
      setUploading(false);
      setSyncLoading(false);
      setSyncSourceId(null);
    }
  };

  const triggerFileInput = (syncForId?: string) => {
    if (!editable) return;
    if (syncForId) {
      setSyncSourceId(syncForId);
      setSyncLoading(true);
    }
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (syncSourceId) {
        handleFileSelect(files[0], {
          syncExisting: true,
          existingSourceId: syncSourceId,
        });
      } else {
        handleFileSelect(files[0]);
      }
    } else {
      setSyncLoading(false);
      setSyncSourceId(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFieldLabelChange = async (
    sourceId: string,
    fieldKey: string,
    newLabel: string
  ) => {
    const source = dataSources.find((d) => d.id === sourceId);
    if (!source) return;
    const updatedFields = source.fields.map((f) =>
      f.key === fieldKey ? { ...f, label: newLabel } : f
    );
    await updateDataSource(sourceId, { fields: updatedFields });
    showToast("success", "保存成功");
  };

  const handleFieldTypeChange = async (
    sourceId: string,
    fieldKey: string,
    newType: DataField["type"]
  ) => {
    await editDataSourceFields(sourceId, [
      { key: fieldKey, updates: { type: newType } },
    ]);
    showToast("success", "保存成功");
  };

  const handleDelete = async (sourceId: string) => {
    const source = dataSources.find((d) => d.id === sourceId);
    if (!source) return;
    const confirmed = window.confirm(`确认删除数据源 "${source.name}"吗？此操作不可撤销。`);
    if (!confirmed) return;
    await deleteDataSource(sourceId);
    if (selectedSource === sourceId) {
      const remaining = dataSources.filter((d) => d.id !== sourceId);
      setSelectedSource(remaining[0]?.id || null);
    }
    showToast("success", "数据源已删除");
  };

  const formatCellValue = (value: any, type: DataField["type"]) => {
    if (value === null || value === undefined || value === "") return "-";
    switch (type) {
      case "currency":
        return `¥${Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      case "percentage": {
        const num = Number(value);
        if (isNaN(num)) return String(value);
        if (num >= 0 && num <= 1 && num % 1 !== 0) {
          return `${(num * 100).toFixed(1)}%`;
        }
        if (String(value).includes("%")) return String(value);
        return `${num.toFixed(1)}%`;
      }
      case "number": {
        const num = Number(value);
        return isNaN(num) ? String(value) : num.toLocaleString("zh-CN");
      }
      case "date": {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
          }
          return String(value);
        } catch {
          return String(value);
        }
      }
      default:
        return String(value);
    }
  };

  const handleGoEditor = () => {
    navigate(`/projects/${id}/editor`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <ToastContainer />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleInputChange}
      />

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              to={`/projects/${id}/editor`}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">
                  数据导入
                </h1>
                <p className="text-xs text-gray-500 leading-tight truncate">
                  {project?.name || "加载中..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => activeSource && triggerFileInput(activeSource.id)}
              disabled={!editable || !activeSource || syncLoading}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border rounded-xl text-sm font-medium transition-all ${
                !editable || !activeSource
                  ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                  : syncLoading
                  ? "border-gray-200 text-gray-500 bg-gray-50 cursor-wait"
                  : "border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue"
              }`}
            >
              {syncLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">同步数据</span>
            </button>
            <button
              onClick={handleGoEditor}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              <span className="hidden sm:inline">前往编辑器</span>
              <span className="sm:hidden">编辑器</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div
          className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 mb-8 sm:mb-10 text-center transition-all overflow-hidden ${
            isDragging
              ? "border-gold bg-gold/5"
              : editable
              ? "border-gray-200 bg-white hover:border-deep-blue/30 hover:bg-deep-blue/5"
              : "border-gray-200 bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (editable) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!editable) return;
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
          onClick={() => editable && triggerFileInput()}
          style={{ cursor: editable ? "pointer" : "not-allowed" }}
        >
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-deep-blue/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
          </div>
          <div className="relative z-10">
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl ${
                editable
                  ? "bg-gradient-to-br from-deep-blue to-deep-blue-light shadow-deep-blue/20"
                  : "bg-gray-200 shadow-gray-200/50"
              }`}
            >
              {uploading ? (
                <Loader2 className="w-7 h-7 sm:w-10 sm:h-10 text-white animate-spin" />
              ) : editable ? (
                <Upload className="w-7 h-7 sm:w-10 sm:h-10 text-gold" />
              ) : (
                <Lock className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" />
              )}
            </motion.div>

            {editable ? (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  拖放文件到此处上传
                </h2>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
                  或者点击区域选择文件，支持 Excel (.xlsx, .xls) 和 CSV 格式
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                    disabled={uploading}
                    className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-xl hover:shadow-deep-blue/30 transition-all disabled:opacity-60 disabled:cursor-wait"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">选择 Excel/CSV 文件</span>
                    <span className="sm:hidden">选择文件</span>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>智能识别数据类型，自动完成字段映射</span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-500 mb-2 sm:mb-3">
                  您没有数据管理权限
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  请联系项目管理员或数据管理员获取相应权限
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">数据源列表</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {dataSources.length} 个数据源已导入
                  </p>
                </div>
                <button
                  onClick={() => triggerFileInput()}
                  disabled={!editable}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    editable
                      ? "bg-gradient-to-br from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 sm:p-3 space-y-2 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {dataSources.length === 0 ? (
                    <div className="py-10 text-center">
                      <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400">暂无数据源</p>
                      {editable && (
                        <p className="text-xs text-gray-400 mt-1">点击上方按钮导入数据</p>
                      )}
                    </div>
                  ) : (
                    dataSources.map((source, idx) => {
                      const isActive = selectedSource === source.id;
                      const isExcel = source.fileName.endsWith(".xlsx") || source.fileName.endsWith(".xls");
                      return (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => {
                            setSelectedSource(source.id);
                            setActiveTab("sources");
                          }}
                          className={`group relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-deep-blue/10 to-transparent border border-deep-blue/20"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                                className={`font-semibold truncate text-sm sm:text-base ${
                                  isActive ? "text-deep-blue" : "text-gray-900"
                                }`}
                              >
                                {source.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {source.fileName}
                              </p>
                              <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                  <Database className="w-3 h-3" />
                                  {source.rowCount} 行
                                </span>
                                <span className="text-xs text-gray-400">
                                  {source.fields.length} 字段
                                </span>
                              </div>
                            </div>
                            {editable && (
                              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerFileInput(source.id);
                                  }}
                                  className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all"
                                  title="同步数据"
                                >
                                  <RefreshCw className={`w-4 h-4 ${syncLoading && syncSourceId === source.id ? "animate-spin" : ""}`} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(source.id);
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-gradient-to-b from-deep-blue to-gold" />
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeSource ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-2 sm:justify-between">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveTab("sources")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "sources"
                          ? "bg-white text-deep-blue shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      字段映射
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "preview"
                          ? "bg-white text-deep-blue shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      数据预览
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">查看</span>
                    </button>
                    <button
                      onClick={() => triggerFileInput(activeSource.id)}
                      disabled={!editable}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editable
                          ? "text-gray-600 hover:bg-gray-100"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${syncLoading && syncSourceId === activeSource.id ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">同步</span>
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
                      className="p-4 sm:p-6"
                    >
                      <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 flex items-start gap-4">
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
                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-sm font-bold text-deep-blue flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">源字段</p>
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {field.mappedFrom || field.key}
                                </p>
                              </div>
                              <div className="hidden sm:flex justify-center">
                                <ArrowRight className="w-5 h-5 text-gray-300" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">显示名称</p>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) =>
                                    handleFieldLabelChange(activeSource.id, field.key, e.target.value)
                                  }
                                  disabled={!editable}
                                  className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors ${
                                    editable
                                      ? "bg-white border-gray-200"
                                      : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                                  }`}
                                />
                              </div>
                            </div>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleFieldTypeChange(
                                  activeSource.id,
                                  field.key,
                                  e.target.value as DataField["type"]
                                )
                              }
                              disabled={!editable}
                              className={`px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold w-full sm:w-auto transition-colors ${
                                editable
                                  ? "bg-white border-gray-200"
                                  : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
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
                              <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  #
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                </div>
                              </th>
                              {activeSource.fields.map((field) => (
                                <th
                                  key={field.key}
                                  className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold whitespace-nowrap"
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
                            {(activeSource.rows || []).slice(0, 15).map((row, i) => (
                              <tr
                                key={i}
                                className={`border-b border-gray-50 ${
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                } hover:bg-deep-blue/5 transition-colors`}
                              >
                                <td className="py-3 sm:py-3.5 px-4 sm:px-6 text-gray-400 font-mono text-xs whitespace-nowrap">
                                  {String(i + 1).padStart(2, "0")}
                                </td>
                                {activeSource.fields.map((field) => (
                                  <td
                                    key={field.key}
                                    className="py-3 sm:py-3.5 px-4 sm:px-6 text-gray-700 whitespace-nowrap"
                                  >
                                    {formatCellValue(row[field.mappedFrom || field.key], field.type)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {(activeSource.rows || []).length === 0 && (
                              <tr>
                                <td
                                  colSpan={activeSource.fields.length + 1}
                                  className="py-16 text-center text-gray-400"
                                >
                                  暂无数据
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                          显示 1 - {Math.min(15, activeSource.rowCount)} 条，共{" "}
                          <span className="font-semibold text-gray-900">
                            {activeSource.rowCount}
                          </span>{" "}
                          条数据
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            disabled
                            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button className="w-9 h-9 rounded-lg bg-deep-blue text-white font-semibold text-sm">
                            1
                          </button>
                          {activeSource.rowCount > 15 && (
                            <>
                              <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-deep-blue hover:border-deep-blue/30 transition-colors text-sm font-medium">
                                2
                              </button>
                              {activeSource.rowCount > 30 && (
                                <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-deep-blue hover:border-deep-blue/30 transition-colors text-sm font-medium">
                                  3
                                </button>
                              )}
                              <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-deep-blue hover:border-deep-blue/30 transition-colors">
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 sm:p-16 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gray-100 flex items-center justify-center">
                  <Database className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  选择一个数据源
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  {editable
                    ? "点击左侧列表中的数据源查看详细信息和数据预览，或导入新的数据源"
                    : "点击左侧列表中的数据源查看详细信息和数据预览"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
