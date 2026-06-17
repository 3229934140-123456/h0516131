import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  ChevronUp,
  Home,
  FileText,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import type { PageSection, ChartConfig, DataSource, ThemeConfig, Template } from "@shared/types";
import { MOCK_TEMPLATES } from "@shared/mockData";

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  delay = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const startTime = performance.now() + delay * 1000;
      const animate = (now: number) => {
        if (now < startTime) {
          requestAnimationFrame(animate);
          return;
        }
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(value * ease));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, value, delay]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

function NotFoundPage({ publishId }: { publishId?: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-red-500 to-red-700 overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">链接无效或已失效</h2>
          <p className="text-gray-500 leading-relaxed mb-2">
            抱歉，您访问的年报链接不存在或已过期。
          </p>
          {publishId && (
            <p className="text-xs text-gray-400 font-mono bg-gray-50 px-4 py-2 rounded-xl mb-6 break-all">
              链接标识：{publishId}
            </p>
          )}
          <p className="text-gray-400 text-sm mb-8">
            可能的原因：链接已被撤销、项目已删除、或链接地址输入有误。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              <Home className="w-5 h-5" />
              返回首页
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function renderSectionContent(
  section: PageSection,
  dataSources: DataSource[],
  theme: ThemeConfig,
  sectionIndex: number
) {
  if (section.type === "cover") {
    return (
      <section
        key={section.id}
        id={`section-${sectionIndex}`}
        data-section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor || theme.primaryColor} 50%, ${theme.primaryColor}dd 100%)`,
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{ backgroundColor: theme.accentColor }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/10"
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-10 rounded-3xl flex items-center justify-center backdrop-blur-sm"
            style={{
              backgroundColor: `${theme.accentColor}20`,
              border: `1px solid ${theme.accentColor}40`,
            }}
          >
            <Home className="w-10 h-10" style={{ color: theme.accentColor }} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg tracking-[0.3em] mb-6"
            style={{ color: theme.accentColor }}
          >
            ANNUAL REPORT
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight"
            style={{ fontFamily: theme.headingFont }}
          >
            {section.title || "年度报告"}
          </motion.h1>

          {section.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="text-xl md:text-2xl text-white/80 mb-16 tracking-wide"
            >
              {section.subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-wider">向下滚动</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </section>
    );
  }

  if (section.type === "toc") {
    return (
      <section
        key={section.id}
        id={`section-${sectionIndex}`}
        data-section
        className="py-28 px-6 bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
            >
              {section.title || "目录"}
            </h2>
            <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light" />
          </AnimatedSection>
        </div>
      </section>
    );
  }

  if (section.type === "divider") {
    return (
      <div
        key={section.id}
        className="flex items-center justify-center py-12 px-6"
        style={{ backgroundColor: `${theme.primaryColor}08` }}
      >
        <div className="h-px flex-1 max-w-40 bg-gradient-to-r from-transparent" style={{ borderColor: theme.primaryColor }} />
        <div className="w-3 h-3 rounded-full mx-6" style={{ backgroundColor: theme.accentColor }} />
        <div className="h-px flex-1 max-w-40 bg-gradient-to-l from-transparent" style={{ borderColor: theme.primaryColor }} />
      </div>
    );
  }

  if (section.type === "text" || (section.type === "content" && !section.charts?.length)) {
    const bgClass = sectionIndex % 2 === 0 ? "bg-gradient-to-b from-gray-50 to-white" : "bg-white";
    return (
      <section
        key={section.id}
        id={`section-${sectionIndex}`}
        data-section
        className={`py-28 px-6 ${bgClass}`}
      >
        <div className="max-w-4xl mx-auto">
          {section.title && (
            <AnimatedSection className="text-center mb-16">
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
              >
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-gray-500 text-lg">{section.subtitle}</p>
              )}
              <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light mt-4" />
            </AnimatedSection>
          )}
          {section.content && (
            <AnimatedSection>
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                style={{ fontFamily: theme.bodyFont }}
              >
                {section.content.split("\n\n").map((paragraph, pIdx) => {
                  if (paragraph.startsWith("### ")) {
                    return (
                      <h3
                        key={pIdx}
                        className="text-2xl font-bold mt-10 mb-4"
                        style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
                      >
                        {paragraph.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                    return (
                      <p key={pIdx} className="font-semibold text-lg mt-8" style={{ color: theme.primaryColor }}>
                        {paragraph.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  const items = paragraph.split("\n").filter(Boolean);
                  if (items.every((l) => l.startsWith("- **") || l.startsWith("- "))) {
                    return (
                      <ul key={pIdx} className="space-y-3 my-6">
                        {items.map((item, iIdx) => (
                          <motion.li
                            key={iIdx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: iIdx * 0.08 }}
                            className="flex items-start gap-4 p-3 rounded-xl"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                            <span dangerouslySetInnerHTML={{ __html: item.replace(/^- /, "").replace(/\*\*(.*?)\*\*/g, '<strong style="color:' + theme.primaryColor + '">$1</strong>') }} />
                          </motion.li>
                        ))}
                      </ul>
                    );
                  }
                  if (items.every((l) => /^\d+\.\s/.test(l))) {
                    return (
                      <ol key={pIdx} className="space-y-3 my-6 list-decimal list-inside">
                        {items.map((item, iIdx) => (
                          <li key={iIdx} className="p-2">
                            <span dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, "").replace(/\*\*(.*?)\*\*/g, '<strong style="color:' + theme.primaryColor + '">$1</strong>') }} />
                          </li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <p key={pIdx} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    );
  }

  const bgClass = sectionIndex % 2 === 0 ? "bg-gradient-to-b from-gray-50 to-white" : "bg-white";

  return (
    <section
      key={section.id}
      id={`section-${sectionIndex}`}
      data-section
      className={`py-28 px-6 ${bgClass}`}
    >
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-20">
          <p
            className="text-sm tracking-[0.2em] font-semibold mb-4"
            style={{ color: theme.accentColor }}
          >
            {String(sectionIndex).padStart(2, "0")} / OVERVIEW
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
          >
            {section.title || "数据概览"}
          </h2>
          {section.subtitle && (
            <p className="text-gray-500 text-lg mb-4">{section.subtitle}</p>
          )}
          <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light" />
        </AnimatedSection>

        {section.charts && section.charts.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-6">
              {section.charts
                .filter((c) => c.type === "number")
                .map((chart) => (
                  <AnimatedSection
                    key={chart.id}
                    delay={0.1 * section.charts!.indexOf(chart)}
                    className={`${
                      chart.width === "quarter"
                        ? "w-[calc(25%-1rem)]"
                        : chart.width === "third"
                        ? "w-[calc(33%-1rem)]"
                        : chart.width === "half"
                        ? "w-[calc(50%-0.75rem)]"
                        : "w-full"
                    } min-w-[200px]`}
                  >
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="relative bg-white rounded-3xl p-8 shadow-lg shadow-gray-100/50 border border-gray-100 group overflow-hidden h-full"
                    >
                      <div
                        className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: `${theme.primaryColor}08` }}
                      />
                      <ChartRenderer
                        config={chart}
                        dataSources={dataSources}
                        isPreview
                      />
                    </motion.div>
                  </AnimatedSection>
                ))}
            </div>

            {section.charts
              .filter((c) => c.type === "progress")
              .map((chart) => (
                <AnimatedSection key={chart.id}>
                  <div className="relative rounded-3xl p-10 overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || theme.primaryColor})` }}>
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: `${theme.accentColor}15` }} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between flex-wrap gap-6 mb-10">
                        <div>
                          <p className="text-sm tracking-wider mb-3" style={{ color: `${theme.accentColor}80` }}>
                            {chart.title}
                          </p>
                          {chart.subtitle && (
                            <h3 className="text-3xl font-bold text-white" style={{ fontFamily: theme.headingFont }}>
                              {chart.subtitle}
                            </h3>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-5xl md:text-6xl font-bold" style={{ color: theme.accentColor, fontFamily: theme.headingFont }}>
                            {chart.progressValue ?? 0}
                            <span className="text-2xl">%</span>
                          </p>
                        </div>
                      </div>
                      <div className="relative h-6 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${chart.progressValue ?? 0}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
                          className="absolute left-0 top-0 bottom-0 rounded-full shadow-lg"
                          style={{
                            background: `linear-gradient(to right, ${theme.accentColor}, ${theme.accentColor}cc)`,
                            boxShadow: `0 4px 20px ${theme.accentColor}40`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}

            <div className="flex flex-wrap gap-8">
              {section.charts
                .filter((c) => c.type !== "number" && c.type !== "progress")
                .map((chart) => (
                  <AnimatedSection
                    key={chart.id}
                    delay={0.1 * section.charts!.indexOf(chart)}
                    className={`${
                      chart.width === "half"
                        ? "w-[calc(50%-1rem)]"
                        : chart.width === "third"
                        ? "w-[calc(33%-0.67rem)]"
                        : chart.width === "quarter"
                        ? "w-[calc(25%-0.75rem)]"
                        : "w-full"
                    } min-w-[300px]`}
                  >
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-gray-100 h-full">
                      <div className="mb-6">
                        <h3
                          className="text-xl font-bold mb-1"
                          style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
                        >
                          {chart.title}
                        </h3>
                        {chart.subtitle && (
                          <p className="text-gray-500 text-sm">{chart.subtitle}</p>
                        )}
                      </div>
                      <ChartRenderer
                        config={chart}
                        dataSources={dataSources}
                        isPreview
                      />
                    </div>
                  </AnimatedSection>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ViewReportPage() {
  const { publishId } = useParams();
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const publications = useAppStore((s) => s.publications);
  const projects = useAppStore((s) => s.projects);
  const sections = useAppStore((s) => s.sections);
  const templates = useAppStore((s) => s.templates);
  const dataSources = useAppStore((s) => s.dataSources);
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);

  const isPreviewMode = window.location.pathname.startsWith("/preview/");

  const matchedPub = useMemo(() => {
    if (isPreviewMode) return null;
    return publications.find((p) => p.publishId === publishId);
  }, [publications, publishId, isPreviewMode]);

  const projectId = useMemo(() => {
    if (isPreviewMode) return publishId;
    if (matchedPub) return matchedPub.projectId;
    return null;
  }, [matchedPub, isPreviewMode, publishId]);

  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId) || null;
  }, [projects, projectId]);

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, setCurrentProject]);

  const availableTemplates = templates.length > 0 ? templates : MOCK_TEMPLATES;
  const template = useMemo(() => {
    if (project?.templateId) {
      const t = availableTemplates.find((t) => t.id === project.templateId);
      if (t) return t;
    }
    return availableTemplates[0] || MOCK_TEMPLATES[0];
  }, [project, availableTemplates]);

  const theme = template?.theme;

  const reportSections = useMemo(() => {
    if (sections.length > 0) {
      return sections
        .filter((s) => s.title)
        .map((s, idx) => ({
          id: `section-${idx}`,
          label: s.title!.substring(0, 10) || `第${idx + 1}节`,
        }));
    }
    return [];
  }, [sections]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
      const els = document.querySelectorAll("[data-section]");
      els.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          setActiveSection(index);
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const projectName = project?.name || "年度企业报告";

  if (!isPreviewMode && !matchedPub) {
    return <NotFoundPage publishId={publishId} />;
  }

  if (!project) {
    return <NotFoundPage publishId={publishId} />;
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: theme?.bodyFont }}>
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-deep-blue to-deep-blue-dark text-white shadow-xl shadow-deep-blue/30 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme?.primaryColor }}
              >
                <FileText className="w-4.5 h-4.5" style={{ color: theme?.accentColor }} />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-sm leading-tight">{projectName}</h1>
                <p className="text-xs text-gray-500 leading-tight">
                  {isPreviewMode ? "编辑预览" : `已发布版本${matchedPub ? ` · v${matchedPub.version}` : ""}`}
                </p>
              </div>
            </div>
          </div>

          {reportSections.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {reportSections.slice(0, 5).map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeSection === i
                      ? "bg-white text-deep-blue shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                } catch {
                  const ta = document.createElement("textarea");
                  ta.value = window.location.href;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand("copy");
                  document.body.removeChild(ta);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {sections.length > 0 ? (
          sections.map((section, idx) => renderSectionContent(section, dataSources, theme!, idx))
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-400 mb-2">暂无内容</h2>
              <p className="text-gray-400">该年报尚未添加任何内容</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
