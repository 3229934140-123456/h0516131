import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Upload,
  Eye,
  Globe,
  FileDown,
  Lock,
  Calendar,
  QrCode,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Link as LinkIcon,
  Shield,
  Clock,
  Share2,
  Download,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  X,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { useAppStore } from "@/store/appStore";

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to fallback
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};

export default function PublishPage() {
  const { id } = useParams();
  const projectId = id || "";

  const currentProject = useAppStore((s) => s.getCurrentProject());
  const publications = useAppStore((s) => s.publications);
  const publishWeb = useAppStore((s) => s.publishWeb);
  const exportPdf = useAppStore((s) => s.exportPdf);
  const saveStatus = useAppStore((s) => s.saveStatus);
  const lastSavedAt = useAppStore((s) => s.lastSavedAt);
  const canPublish = useAppStore((s) => s.canPublish());
  const currentUser = useAppStore((s) => s.currentUser);

  const project = currentProject;
  const projectName = project?.name || "未命名项目";

  const [publishType, setPublishType] = useState<"web" | "pdf">("web");
  const [publicAccess, setPublicAccess] = useState(true);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState("");
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [pdfComplete, setPdfComplete] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [latestPub, setLatestPub] = useState<typeof publications[number] | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const pubs = publications.filter((p) => p.projectId === projectId && p.type === "web");
    if (pubs.length > 0) {
      const latest = pubs[pubs.length - 1];
      setLatestPub(latest);
      if (latest.url) {
        setPublishedUrl(latest.url);
      }
    }
  }, [publications, projectId]);

  const isPublished = !!latestPub;

  const showToast = (type: "error" | "success", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    try {
      if (publishType === "web") {
        const options = {
          passwordProtect,
          password: passwordProtect ? password : undefined,
          expiryDate: expiryEnabled ? expiryDate : undefined,
          expiresAt: expiryEnabled ? new Date(expiryDate).toISOString() : undefined,
        };
        const pub = await publishWeb(projectId, options);
        setPublishedUrl(pub.url || null);
        setLatestPub(pub);
        showToast("success", "发布成功！");
      } else {
        await handleExportPdf();
      }
    } catch (e) {
      showToast("error", "发布失败，请重试");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportPdf = async () => {
    setPdfProgress(0);
    setPdfComplete(false);
    try {
      const progressSteps = [15, 35, 55, 75, 90, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 300));
        setPdfProgress(progressSteps[i]);
      }
      await exportPdf(projectId);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(201, 169, 98);
      doc.setFontSize(10);
      doc.text("ANNUAL REPORT 2024", pageWidth / 2, 15, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text(projectName, pageWidth / 2, 30, { align: "center" });
      let y = 60;
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(16);
      doc.text("项目概览", 20, y);
      y += 10;
      doc.setDrawColor(201, 169, 98);
      doc.setLineWidth(0.8);
      doc.line(20, y, pageWidth - 20, y);
      y += 12;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      const lines: string[] = [];
      lines.push(`项目名称：${projectName}`);
      lines.push(`项目状态：${project?.status === "published" ? "已发布" : "草稿"}`);
      lines.push(`创建人：${currentUser.name}`);
      lines.push(`发布时间：${new Date().toLocaleDateString("zh-CN")}`);
      lines.push(`文档版本：v${(latestPub?.version || 1)}.0`);
      lines.forEach((line) => {
        doc.text(line, 25, y);
        y += 8;
      });
      y += 8;
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(14);
      doc.text("核心数据", 20, y);
      y += 10;
      doc.setDrawColor(201, 169, 98);
      doc.line(20, y, pageWidth - 20, y);
      y += 12;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      const stats = [
        { label: "年度总营收", value: "69,400 万元" },
        { label: "年度净利润", value: "18,780 万元" },
        { label: "累计用户数", value: "418,000 人" },
        { label: "覆盖城市数", value: "58 座" },
      ];
      stats.forEach((s) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 30;
        }
        doc.text(`${s.label}：`, 25, y);
        doc.setTextColor(201, 169, 98);
        doc.setFont("helvetica", "bold");
        doc.text(s.value, 80, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        y += 10;
      });
      y += 10;
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(14);
      doc.text("报告说明", 20, y);
      y += 10;
      doc.setDrawColor(201, 169, 98);
      doc.line(20, y, pageWidth - 20, y);
      y += 12;
      doc.setTextColor(90, 90, 90);
      doc.setFontSize(10);
      const summary =
        "本报告由年度报告可视化系统自动生成，包含项目核心经营数据、业务分析及战略展望等内容。报告数据仅供内部参考，具体以正式发布版本为准。";
      const splitSummary = doc.splitTextToSize(summary, pageWidth - 50);
      splitSummary.forEach((line: string) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 30;
        }
        doc.text(line, 25, y);
        y += 6;
      });
      const safeName = projectName.replace(/[\/\\:*?"<>|]/g, "_");
      doc.save(`${safeName}-年度报告.pdf`);
      setPdfComplete(true);
      showToast("success", "PDF 导出成功！");
      setTimeout(() => {
        setPdfProgress(null);
        setPdfComplete(false);
      }, 3000);
    } catch (e) {
      setPdfProgress(null);
      showToast("error", "PDF 导出失败");
    }
  };

  const handleCopyLink = async () => {
    if (!publishedUrl) return;
    const ok = await copyToClipboard(publishedUrl);
    if (ok) {
      setCopied(true);
      showToast("success", "链接已复制");
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast("error", "复制失败，请手动复制");
    }
  };

  const displayUrl = useMemo(() => {
    if (publishedUrl) return publishedUrl;
    return `${typeof window !== "undefined" ? window.location.origin : ""}/view/${projectId}-pub`;
  }, [publishedUrl, projectId]);

  const publishedAtStr = useMemo(() => {
    if (!latestPub) return null;
    const d = new Date(latestPub.publishedAt);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [latestPub]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
              toastMsg.type === "success"
                ? "bg-white border-green-200 text-gray-900"
                : "bg-white border-red-200 text-gray-900"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}/editor`}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Upload className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">发布中心</h1>
                <p className="text-xs text-gray-500 leading-tight">{projectName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPublished && publishedUrl && (
              <Link
                to={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
              >
                <Eye className="w-4 h-4" />
                预览
              </Link>
            )}
            <Link
              to={`/projects/${id}/analytics`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              数据
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {!canPublish && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-3xl p-6 mb-8 border border-red-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">您没有发布权限</h3>
                <p className="text-red-800/70 text-sm leading-relaxed">
                  当前账号角色仅可查看项目内容，请联系项目所有者或管理员获取发布权限。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {lastSavedAt && (
          <div className="mb-6 text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            上次保存：{new Date(lastSavedAt).toLocaleString("zh-CN")}
          </div>
        )}

        {pdfProgress !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 mb-8 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    pdfComplete ? "bg-green-100" : "bg-amber-100"
                  }`}
                >
                  {pdfComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <FileDown className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {pdfComplete ? "导出完成" : "正在生成 PDF..."}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {pdfComplete ? "文件已开始下载" : `进度 ${pdfProgress}%`}
                  </p>
                </div>
              </div>
              <span
                className={`text-2xl font-bold ${
                  pdfComplete ? "text-green-500" : "text-deep-blue"
                }`}
              >
                {pdfProgress}%
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pdfProgress}%` }}
                className={`absolute left-0 top-0 bottom-0 rounded-full transition-all ${
                  pdfComplete
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : "bg-gradient-to-r from-deep-blue to-deep-blue-light"
                }`}
              />
            </div>
          </motion.div>
        )}

        {isPublished && latestPub ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-3xl p-8 mb-10 border border-green-200 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-green-200/40 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/30 flex-shrink-0"
              >
                <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-2xl font-bold text-gray-900">发布成功！</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    已上线
                  </span>
                  <span className="text-xs text-gray-500 bg-white/60 px-2.5 py-1 rounded-lg border border-green-100">
                    版本 v{latestPub.version}.0 · 发布于 {publishedAtStr}
                  </span>
                </div>
                <p className="text-green-800/70 max-w-2xl leading-relaxed">
                  您的年报已成功发布，您可以通过以下链接分享给他人访问
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 px-5 py-4 bg-white rounded-2xl border border-green-200 text-sm text-gray-700 truncate font-mono shadow-sm flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="truncate">{displayUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-500 text-white shadow-xl shadow-green-500/30"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:shadow-green-500/30"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4.5 h-4.5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4.5 h-4.5" />
                    复制链接
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-3xl p-8 mb-10 border border-amber-200">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">尚未发布</h3>
                <p className="text-amber-800/70 max-w-2xl leading-relaxed">
                  您的年报目前处于草稿状态，完成下方的发布配置后，即可将年报分享给其他人访问
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg">发布方式</h3>
                <p className="text-sm text-gray-500 mt-0.5">选择您要发布的格式</p>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                {(
                  [
                    {
                      id: "web",
                      label: "网页版年报",
                      desc: "生成交互式网页链接，支持滚动动画和数据交互",
                      icon: Globe,
                      features: ["滚动动画效果", "图表交互", "移动端适配", "实时访问数据"],
                      color: "from-deep-blue to-deep-blue-light",
                    },
                    {
                      id: "pdf",
                      label: "PDF 文档",
                      desc: "生成高质量 PDF 文件，适合打印和离线分享",
                      icon: FileDown,
                      features: ["A4 标准尺寸", "矢量高清输出", "一键下载", "适合打印"],
                      color: "from-amber-500 to-orange-500",
                    },
                  ] as const
                ).map((item) => {
                  const isActive = publishType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPublishType(item.id)}
                      className={`text-left p-6 rounded-2xl transition-all ${
                        isActive
                          ? "bg-gradient-to-br from-gray-50 to-white border-2 border-deep-blue shadow-lg"
                          : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isActive ? "border-deep-blue bg-deep-blue" : "border-gray-300"
                          }`}
                        >
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg mb-1.5">{item.label}</h4>
                      <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
                      <div className="space-y-2">
                        {item.features.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <Check
                              className="w-4 h-4 text-green-500 flex-shrink-0"
                              strokeWidth={3}
                            />
                            {f}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {publishType === "web" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg">访问设置</h3>
                  <p className="text-sm text-gray-500 mt-0.5">配置您的年报访问权限</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-start justify-between p-5 rounded-2xl bg-gray-50 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">公开访问</h4>
                        <p className="text-sm text-gray-500">任何人都可以通过链接访问您的年报</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setPublicAccess(!publicAccess)}
                      className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all flex-shrink-0 ${
                        publicAccess
                          ? "bg-gradient-to-r from-deep-blue to-deep-blue-light"
                          : "bg-gray-200"
                      }`}
                    >
                      <motion.div
                        animate={{ x: publicAccess ? 24 : 0 }}
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between p-5 rounded-2xl bg-gray-50 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">密码保护</h4>
                        <p className="text-sm text-gray-500">访问者需要输入密码才能查看内容</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setPasswordProtect(!passwordProtect)}
                      className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all flex-shrink-0 ${
                        passwordProtect
                          ? "bg-gradient-to-r from-deep-blue to-deep-blue-light"
                          : "bg-gray-200"
                      }`}
                    >
                      <motion.div
                        animate={{ x: passwordProtect ? 24 : 0 }}
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {passwordProtect && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 rounded-2xl bg-gold/5 border border-gold/20">
                          <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                            设置访问密码
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码..."
                            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-start justify-between p-5 rounded-2xl bg-gray-50 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">链接有效期</h4>
                        <p className="text-sm text-gray-500">设置链接的过期时间，过期后将无法访问</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setExpiryEnabled(!expiryEnabled)}
                      className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all flex-shrink-0 ${
                        expiryEnabled
                          ? "bg-gradient-to-r from-deep-blue to-deep-blue-light"
                          : "bg-gray-200"
                      }`}
                    >
                      <motion.div
                        animate={{ x: expiryEnabled ? 24 : 0 }}
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expiryEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                            过期日期
                          </label>
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">设备预览</h3>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  <button className="p-1.5 rounded-lg bg-white text-deep-blue shadow-sm">
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700">
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="relative rounded-2xl bg-gradient-to-br from-deep-blue to-deep-blue-light aspect-[4/3] overflow-hidden shadow-inner">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-gold/30">
                      <Sparkles className="w-6 h-6 text-gold" />
                    </div>
                    <h4 className="font-heading font-bold text-white text-xl mb-1.5 leading-tight">
                      2024 年度报告
                    </h4>
                    <p className="text-gold-light text-xs tracking-widest mb-6">ANNUAL REPORT</p>
                    <div className="w-full space-y-2.5">
                      <div className="h-1.5 w-full rounded-full bg-white/20" />
                      <div className="h-1.5 w-3/4 mx-auto rounded-full bg-white/15" />
                      <div className="h-1.5 w-1/2 mx-auto rounded-full bg-white/10" />
                    </div>
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gold/15 blur-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-deep-blue to-deep-blue-dark rounded-2xl p-6 text-white overflow-hidden relative">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/15 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <QrCode className="w-5.5 h-5.5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">二维码分享</h4>
                    <p className="text-xs text-white/60">扫码即可访问年报</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 mb-5 flex items-center justify-center">
                  {isPublished && publishedUrl ? (
                    <QRCodeSVG
                      value={publishedUrl}
                      size={128}
                      level="H"
                      includeMargin={false}
                      fgColor="#1e3a5f"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex flex-col items-center justify-center">
                      <QrCode className="w-16 h-16 text-deep-blue/50 mb-2" />
                      <span className="text-[10px] text-deep-blue/50 font-medium">发布后显示</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={!isPublished}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isPublished
                      ? "bg-gold text-deep-blue hover:shadow-xl hover:shadow-gold/30"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4.5 h-4.5" />
                      已复制链接
                    </>
                  ) : (
                    <>
                      <Download className="w-4.5 h-4.5" />
                      {isPublished ? "复制链接" : "请先发布"}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-deep-blue" />
                安全提示
              </h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  所有链接均采用 HTTPS 加密传输
                </li>
                <li className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  支持设置密码和有效期双重保护
                </li>
                <li className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                    strokeWidth={3}
                  />
                  可随时撤销链接并重新发布新版本
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="sticky bottom-6 bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-deep-blue to-gold border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-md"
                >
                  {["张", "李", "王"][i - 1]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">准备就绪</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                预计发布时间：约 15 秒
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {}}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
            >
              <Share2 className="w-4.5 h-4.5" />
              分享设置
            </button>
            <button
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold transition-all ${
                !canPublish || isPublishing
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-2xl hover:shadow-deep-blue/30"
              }`}
            >
              {isPublishing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  {publishType === "pdf" ? "导出中..." : "发布中..."}
                </>
              ) : !canPublish ? (
                <>
                  <Lock className="w-5 h-5" />
                  无发布权限
                </>
              ) : (
                <>
                  {publishType === "pdf" ? (
                    <FileDown className="w-5 h-5" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {publishType === "pdf"
                    ? isPublished
                      ? "重新导出"
                      : "导出 PDF"
                    : isPublished
                    ? "更新发布"
                    : "立即发布"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
