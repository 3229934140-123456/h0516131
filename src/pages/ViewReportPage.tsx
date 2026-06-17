import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  ChevronUp,
  Home,
  FileText,
  TrendingUp,
  Target,
  Eye,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAppStore } from "@/store/appStore";
import {
  MOCK_TEMPLATES,
  MOCK_REVENUE_DATA,
  MOCK_CITY_DATA,
  MOCK_SEGMENT_DATA,
} from "@shared/mockData";

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedNumber({ value, suffix = "", prefix = "", delay = 0 }: { value: number; suffix?: string; prefix?: string; delay?: number }) {
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

export default function ViewReportPage() {
  const { publishId } = useParams();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const publications = useAppStore((s) => s.publications);
  const projects = useAppStore((s) => s.projects);
  const sections = useAppStore((s) => s.sections);
  const templates = useAppStore((s) => s.templates);
  const currentUser = useAppStore((s) => s.currentUser);

  const matchedPub = useMemo(() => {
    return publications.find((p) => p.publishId === publishId);
  }, [publications, publishId]);

  const project = useMemo(() => {
    if (matchedPub) {
      return projects.find((p) => p.id === matchedPub.projectId) || projects[0];
    }
    return projects[0];
  }, [matchedPub, projects]);

  const availableTemplates = templates.length > 0 ? templates : MOCK_TEMPLATES;
  const template = useMemo(() => {
    if (project?.templateId) {
      const t = availableTemplates.find((t) => t.id === project.templateId);
      if (t) return t;
    }
    return availableTemplates[0] || MOCK_TEMPLATES[0];
  }, [project, availableTemplates]);

  const reportSections = useMemo(() => {
    if (sections.length > 0) {
      const titles = sections
        .filter((s) => s.title)
        .map((s, idx) => ({
          id: `section-${idx}`,
          label: s.title?.substring(0, 12) || `第${idx + 1}节`,
        }));
      if (titles.length >= 4) return titles.slice(0, 5);
    }
    return [
      { id: "cover", label: "封面" },
      { id: "overview", label: "概览" },
      { id: "trend", label: "营收趋势" },
      { id: "structure", label: "业务结构" },
      { id: "outlook", label: "展望" },
    ];
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
  const projectName = project?.name || "2024年度企业年报";
  const theme = template?.theme;

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
                  已发布版本 {matchedPub ? `· v${matchedPub.version}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {reportSections.map((s, i) => (
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

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all">
              <Share2 className="w-4 h-4" />
              分享
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all">
              <Download className="w-4 h-4" />
              下载PDF
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16">
        <section
          id="cover"
          data-section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme?.primaryColor} 0%, ${theme?.secondaryColor || theme?.primaryColor} 50%, ${theme?.primaryColor}dd 100%)`,
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
              style={{ backgroundColor: theme?.accentColor }}
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/10"
            />
            <motion.div
              animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full"
              style={{ backgroundColor: `${theme?.accentColor}40` }}
            />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-10 rounded-3xl flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: `${theme?.accentColor}20`, border: `1px solid ${theme?.accentColor}40` }}
            >
              <Home className="w-10 h-10" style={{ color: theme?.accentColor }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg tracking-[0.3em] mb-6"
              style={{ color: theme?.accentColor }}
            >
              ANNUAL REPORT 2024
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-8 leading-tight"
              style={{ fontFamily: theme?.headingFont }}
            >
              2024 年度
              <br />
              <span style={{ color: theme?.accentColor }}>企业报告</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="text-xl md:text-2xl text-white/80 mb-16 tracking-wide"
            >
              稳步前行，共绘未来
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.3 }}
              className="flex items-center justify-center gap-12"
            >
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: theme?.headingFont }}>
                  6.94<span style={{ color: theme?.accentColor }}>亿</span>
                </p>
                <p className="text-white/60 text-sm tracking-wider">年度营收</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: theme?.headingFont }}>
                  41.8<span style={{ color: theme?.accentColor }}>万</span>
                </p>
                <p className="text-white/60 text-sm tracking-wider">累计用户</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: theme?.headingFont }}>
                  58<span style={{ color: theme?.accentColor }}>座</span>
                </p>
                <p className="text-white/60 text-sm tracking-wider">覆盖城市</p>
              </div>
            </motion.div>
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

        <section id="overview" data-section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-20">
              <p className="text-sm tracking-[0.2em] text-gold font-semibold mb-4">01 / OVERVIEW</p>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}
              >
                核心经营数据
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light" />
            </AnimatedSection>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {[
                { label: "年度总营收", value: 69400, suffix: " 万元", icon: TrendingUp, delay: 0 },
                { label: "年度净利润", value: 18780, suffix: " 万元", icon: Target, delay: 0.1 },
                { label: "累计用户数", value: 418000, suffix: " 人", icon: Users, delay: 0.2 },
                { label: "覆盖城市数", value: 58, suffix: " 座", icon: Eye, delay: 0.3 },
              ].map((item, idx) => (
                <AnimatedSection key={idx} delay={item.delay}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative bg-white rounded-3xl p-8 shadow-lg shadow-gray-100/50 border border-gray-100 group overflow-hidden"
                  >
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 transition-transform group-hover:scale-125"
                      style={{ backgroundColor: `${theme?.primaryColor}08` }}
                    />
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${theme?.primaryColor}12` }}
                    >
                      <item.icon className="w-7 h-7" style={{ color: theme?.primaryColor }} />
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{item.label}</p>
                    <p
                      className="text-3xl md:text-4xl font-bold"
                      style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}
                    >
                      <AnimatedNumber value={item.value} suffix={item.suffix} delay={item.delay} />
                    </p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection>
              <div className="relative bg-white rounded-3xl p-10 shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${theme?.accentColor}15` }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme?.accentColor }} />
                  <span className="text-xs font-medium" style={{ color: theme?.accentColor }}>实时数据</span>
                </div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}>
                    季度营收与利润趋势
                  </h3>
                  <p className="text-gray-500">2023 Q1 — 2024 Q4 对比分析</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme?.primaryColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={theme?.primaryColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme?.accentColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={theme?.accentColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="quarter" tick={{ fontSize: 13, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 13, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", padding: "16px 20px" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "24px", fontSize: "14px" }} />
                      <Area type="monotone" dataKey="revenue" name="营收(万元)" stroke={theme?.primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="profit" name="利润(万元)" stroke={theme?.accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="trend" data-section className="py-28 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-20">
              <p className="text-sm tracking-[0.2em] text-gold font-semibold mb-4">02 / ANALYSIS</p>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}
              >
                业务结构分析
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light" />
            </AnimatedSection>

            <div className="grid lg:grid-cols-2 gap-8 mb-10">
              <AnimatedSection>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 h-full">
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}>
                    主要城市用户分布
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">Top 10 城市用户数量对比</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_CITY_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="city" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                        <Bar dataKey="users" name="用户数" radius={[8, 8, 0, 0]} barSize={30}>
                          {MOCK_CITY_DATA.map((_, index) => (
                            <Cell
                              key={index}
                              fill={index === 0 ? theme?.primaryColor : index < 3 ? theme?.secondaryColor || theme?.primaryColor : `${theme?.primaryColor}55`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100 h-full">
                  <h3 className="text-xl font-bold mb-2" style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}>
                    客户群体构成
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">各类客户占比分布</p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_SEGMENT_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={4}
                        >
                          {MOCK_SEGMENT_DATA.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                          formatter={(value) => `${value}%`}
                        />
                        <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: "20px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            <AnimatedSection>
              <div className="relative bg-gradient-to-r from-deep-blue via-deep-blue-light to-deep-blue rounded-3xl p-10 md:p-14 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
                  <div className="absolute -top-20 left-1/4 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between flex-wrap gap-6 mb-10">
                    <div>
                      <p className="text-gold/80 text-sm tracking-wider mb-3">年度目标完成度</p>
                      <h3 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: theme?.headingFont }}>
                        战略目标执行情况
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-6xl md:text-7xl font-bold text-gold" style={{ fontFamily: theme?.headingFont }}>
                        86.75<span className="text-3xl">%</span>
                      </p>
                    </div>
                  </div>
                  <div className="relative h-6 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "86.75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
                      className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-gold via-gold-light to-gold shadow-lg shadow-gold/40"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6 mt-10">
                    {[
                      { label: "已完成目标", value: "42", total: "48项" },
                      { label: "进行中项目", value: "6", total: "48项" },
                      { label: "规划中任务", value: "0", total: "48项" },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">
                          {item.value} <span className="text-white/40 text-xl">/ {item.total}</span>
                        </p>
                        <p className="text-white/60 text-sm">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="structure" data-section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-20">
              <p className="text-sm tracking-[0.2em] text-gold font-semibold mb-4">03 / OUTLOOK</p>
              <h2
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}
              >
                战略成果与展望
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-gold to-gold-light" />
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  title: "年度核心成就",
                  desc: "2024年是公司发展历程中具有里程碑意义的一年，我们在多个关键领域取得了突破性进展。",
                  highlights: ["营收规模再创新高", "用户基础持续扩大", "盈利能力显著增强"],
                  delay: 0,
                },
                {
                  title: "战略重点方向",
                  desc: "公司将继续围绕三大战略方向推进业务发展，构建可持续的竞争优势。",
                  highlights: ["技术创新驱动", "市场深耕细作", "生态协同发展"],
                  delay: 0.15,
                },
              ].map((block, idx) => (
                <AnimatedSection key={idx} delay={block.delay}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="bg-white rounded-3xl p-10 border border-gray-100 shadow-lg shadow-gray-100/50 h-full"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: `${theme?.primaryColor}12` }} />
                      <h3 className="text-2xl font-bold" style={{ color: theme?.primaryColor, fontFamily: theme?.headingFont }}>
                        {block.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-8">{block.desc}</p>
                    <div className="space-y-4">
                      {block.highlights.map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: block.delay + i * 0.1 }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-transparent"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: theme?.accentColor }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-800 font-medium">{h}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section id="outlook" data-section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: theme?.primaryColor }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10" style={{ backgroundColor: theme?.accentColor, transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5" style={{ transform: "translate(-30%, 30%)" }} />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <AnimatedSection>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="inline-block p-5 rounded-3xl mb-10 border"
                style={{ backgroundColor: `${theme?.accentColor}20`, borderColor: `${theme?.accentColor}40` }}
              >
                <FileText className="w-10 h-10" style={{ color: theme?.accentColor }} />
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8" style={{ fontFamily: theme?.headingFont }}>
                结语
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-white/80 text-lg md:text-xl leading-loose mb-16 max-w-3xl mx-auto">
                感谢每一位客户、合作伙伴和员工的信任与支持。
                <br className="hidden md:block" />
                站在新的起点，我们将继续秉持
                <span style={{ color: theme?.accentColor }} className="font-semibold"> 「创新、协作、共赢」</span>
                的核心价值观，
                <br className="hidden md:block" />
                与您携手共创更加美好的未来。
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex items-center justify-center gap-8 mb-16">
                <div className="h-px flex-1 max-w-40 bg-gradient-to-r from-transparent to-white/20" />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme?.accentColor }} />
                <div className="h-px flex-1 max-w-40 bg-gradient-to-l from-transparent to-white/20" />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="flex items-center justify-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
                  <span className="text-white font-bold text-xl" style={{ fontFamily: theme?.headingFont }}>
                    {currentUser.name.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">{currentUser.name}</p>
                  <p className="text-white/60 text-sm">{currentUser.role === "admin" ? "首席执行官" : "管理员"}</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.5}>
              <p className="text-white/40 text-sm">
                © 2024 企业名称 版权所有 · 本报告内容严格保密
              </p>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </div>
  );
}
