import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Download,
  Calendar,
  Eye,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  BarChart3,
  FileText,
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
import { MOCK_ANALYTICS, MOCK_PROJECTS } from "@shared/mockData";

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
              trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${!trendUp ? "rotate-180" : ""}`} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mb-1.5">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
}

export default function AnalyticsPage() {
  const { id } = useParams();
  const [dateRange, setDateRange] = useState("7d");
  const project = MOCK_PROJECTS.find((p) => p.id === id) || MOCK_PROJECTS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-gold" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">数据分析</h1>
                <p className="text-xs text-gray-500 leading-tight">{project?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { id: "24h", label: "24小时" },
                { id: "7d", label: "7天" },
                { id: "30d", label: "30天" },
                { id: "all", label: "全部" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === r.id
                      ? "bg-white text-deep-blue shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all">
              <Calendar className="w-4 h-4" />
              自定义
            </button>
            <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all">
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard
            icon={Eye}
            label="总访问次数"
            value={MOCK_ANALYTICS.totalVisits.toLocaleString()}
            trend="+12.8%"
            trendUp
            color="#1e3a5f"
          />
          <StatCard
            icon={Users}
            label="独立访客数"
            value={MOCK_ANALYTICS.uniqueVisitors.toLocaleString()}
            trend="+8.5%"
            trendUp
            color="#c9a962"
          />
          <StatCard
            icon={Clock}
            label="平均停留时长"
            value={formatDuration(MOCK_ANALYTICS.avgDuration)}
            trend="+15.2%"
            trendUp
            color="#6366f1"
          />
          <StatCard
            icon={CheckCircle2}
            label="阅读完成率"
            value={`${MOCK_ANALYTICS.completionRate}%`}
            trend="+5.6%"
            trendUp
            color="#10b981"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">访问趋势</h3>
                <p className="text-gray-500 text-sm">最近10天的访问数据变化</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                <span className="w-2.5 h-2.5 rounded-full bg-deep-blue" />
                <span className="text-sm text-gray-600">访问次数</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_ANALYTICS.visitsByDay} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "12px 16px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="访问次数"
                    stroke="#1e3a5f"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">设备分布</h3>
              <p className="text-gray-500 text-sm">访问者使用的终端设备</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_ANALYTICS.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="count"
                    nameKey="device"
                    paddingAngle={3}
                  >
                    <Cell fill="#1e3a5f" />
                    <Cell fill="#c9a962" />
                    <Cell fill="#4a90a4" />
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} 次`, name]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {MOCK_ANALYTICS.deviceBreakdown.map((d, i) => {
                const Icon = d.device.includes("桌面") ? Monitor : d.device.includes("移动") ? Smartphone : Tablet;
                const colors = ["#1e3a5f", "#c9a962", "#4a90a4"];
                return (
                  <div key={d.device} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${colors[i]}15`, color: colors[i] }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{d.device}</span>
                        <span className="text-sm font-bold text-gray-900">{d.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${d.percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: colors[i] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">章节停留时长</h3>
              <p className="text-gray-500 text-sm">用户在各章节的平均停留时间</p>
            </div>
            <div className="space-y-4">
              {MOCK_ANALYTICS.sectionAvgDurations.map((s, i) => (
                <motion.div
                  key={s.sectionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-deep-blue/10 text-deep-blue flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </div>
                      <span className="font-medium text-gray-900">{s.sectionTitle}</span>
                    </div>
                    <span className="text-sm font-semibold text-deep-blue">
                      {formatDuration(s.avgDuration)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden ml-11">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.avgDuration / 90) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-deep-blue to-gold"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">地域分布 Top 6</h3>
                <p className="text-gray-500 text-sm">访问者来源地区统计</p>
              </div>
              <MapPin className="w-6 h-6 text-gold" />
            </div>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_ANALYTICS.countryBreakdown.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    formatter={(value: any) => [`${value.toLocaleString()} 次`, "访问量"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                    {MOCK_ANALYTICS.countryBreakdown.slice(0, 6).map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? "#1e3a5f" : index < 3 ? "#2c5282" : "#c9a962"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {MOCK_ANALYTICS.countryBreakdown.slice(0, 6).map((c, i) => (
                <div key={c.country} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">{c.country}</span>
                  <span className="text-sm font-semibold text-deep-blue">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-deep-blue via-deep-blue-light to-deep-blue rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -top-16 left-1/4 w-52 h-52 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gold/20 backdrop-blur-sm flex items-center justify-center border border-gold/30 flex-shrink-0">
                <FileText className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">数据洞察报告</h3>
                <p className="text-white/70 max-w-xl leading-relaxed">
                  生成完整的数据分析洞察报告，包含用户行为分析、内容表现评估、优化建议等专业内容，帮助您更好地优化下一期年报。
                </p>
              </div>
            </div>
            <button className="flex-shrink-0 flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold bg-gold text-deep-blue hover:shadow-2xl hover:shadow-gold/30 transition-all">
              <Download className="w-5 h-5" />
              生成完整报告
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
