import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Search,
  Filter,
  Star,
  Check,
  Plus,
  FileText,
  Palette,
  Sparkles,
  Building2,
  Leaf,
  Zap,
  CircleDot,
} from "lucide-react";
import { MOCK_TEMPLATES, MOCK_PROJECTS } from "@shared/mockData";
import type { Template } from "@shared/types";

const categories = [
  { id: "all", label: "全部模板", icon: Sparkles },
  { id: "经典商务", label: "经典商务", icon: Building2 },
  { id: "科技感", label: "科技感", icon: Zap },
  { id: "简约优雅", label: "简约优雅", icon: Leaf },
  { id: "极简风格", label: "极简风格", icon: CircleDot },
];

function TemplateCard({ template, isSelected, onSelect, onUse }: { template: Template; isSelected: boolean; onSelect: () => void; onUse: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      onClick={onSelect}
      className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected ? "ring-2 ring-gold shadow-xl shadow-gold/20" : "shadow-sm hover:shadow-xl border border-gray-100"
      }`}
    >
      <div
        className="relative h-52 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor || template.theme.primaryColor}dd 100%)`,
        }}
      >
        <div
          className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-20 blur-2xl"
          style={{ backgroundColor: template.theme.accentColor }}
        />
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: template.theme.accentColor }}>
            <FileText className="w-5 h-5" style={{ color: template.theme.primaryColor }} />
          </div>
          <div className="space-y-2">
            <div
              className="h-1.5 w-24 rounded-full"
              style={{ backgroundColor: template.theme.accentColor }}
            />
            <div
              className="h-1.5 w-40 rounded-full opacity-60"
              style={{ backgroundColor: template.theme.backgroundColor || "white" }}
            />
            <div
              className="h-1.5 w-32 rounded-full opacity-40"
              style={{ backgroundColor: template.theme.backgroundColor || "white" }}
            />
          </div>
        </div>

        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
            style={{ backgroundColor: `${template.theme.accentColor}25`, color: template.theme.accentColor, border: `1px solid ${template.theme.accentColor}40` }}
          >
            {template.category}
          </span>
          {!template.isCustom && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              官方
            </span>
          )}
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-lg"
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-deep-blue transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {template.isCustom ? "自定义模板" : "由官方团队设计"}
            </p>
          </div>
          <button className="p-2 rounded-xl hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors">
            <Star className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs text-gray-500">主题配色：</p>
          <div className="flex gap-1.5">
            {[template.theme.primaryColor, template.theme.secondaryColor || template.theme.primaryColor, template.theme.accentColor].map((c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-gray-300 to-gray-400"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {(Math.random() * 5000 + 1000).toFixed(0)}+ 人使用
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
          className="w-full mt-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
        >
          <Plus className="w-4 h-4" />
          使用此模板
        </button>
      </div>
    </motion.div>
  );
}

export default function TemplateCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filteredTemplates = MOCK_TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
                <Palette className="w-4.5 h-4.5 text-gold" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">模板中心</h1>
                <p className="text-xs text-gray-500 leading-tight">{MOCK_TEMPLATES.length} 套精选模板</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all">
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <Link
              to="/projects/create"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              自定义模板
            </Link>
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-40 bg-white/60 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-deep-blue to-deep-blue-light text-white shadow-md shadow-deep-blue/20"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            {selectedCategory === "all" ? "精选模板推荐" : categories.find((c) => c.id === selectedCategory)?.label}
          </h2>
          <p className="text-gray-500">为您的年报选择最合适的专业设计模板</p>
        </div>

        {filteredTemplates.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
                onUse={() => {}}
              />
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gray-100 flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">未找到匹配的模板</h3>
            <p className="text-gray-500 mb-8">尝试调整搜索关键词或选择其他分类</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
            >
              重置筛选条件
            </button>
          </div>
        )}

        <div className="mt-16 relative rounded-3xl p-12 overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue-dark">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -top-20 left-1/3 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gold/20 mb-6 border border-gold/30">
              <Sparkles className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              想要独一无二的品牌模板？
            </h3>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              我们的专业设计团队可以根据您的品牌 VI 系统，定制专属的企业年报模板，完美契合您的品牌调性。
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold bg-gold text-deep-blue hover:shadow-xl hover:shadow-gold/30 transition-all">
                <Plus className="w-4 h-4" />
                提交定制需求
              </button>
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 transition-all">
                了解更多
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
