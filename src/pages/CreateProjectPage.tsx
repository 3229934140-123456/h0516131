import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Check,
  FileText,
  Type,
  Palette,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { MOCK_TEMPLATES } from "@shared/mockData";
import type { Template } from "@shared/types";

const steps = [
  { id: 1, label: "基本信息", icon: Type },
  { id: 2, label: "选择模板", icon: Palette },
  { id: 3, label: "完成创建", icon: Sparkles },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const canProceed =
    step === 1
      ? projectName.trim().length > 0
      : step === 2
      ? selectedTemplate !== null
      : true;

  const handleCreate = () => {
    navigate(`/projects/proj-new-${Date.now()}/editor`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-deep-blue/5">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">创建新项目</h1>
              <p className="text-xs text-gray-500 leading-tight">步骤 {step} / {steps.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-deep-blue to-deep-blue-light text-white shadow-lg shadow-deep-blue/30"
                          : isCompleted
                          ? "bg-gold text-deep-blue"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-semibold ${
                          isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 mx-4 sm:mx-8 h-1 rounded-full overflow-hidden bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-deep-blue to-gold"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100"
            >
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center shadow-lg shadow-deep-blue/20">
                    <FileText className="w-8 h-8 text-gold" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">项目基本信息</h2>
                  <p className="text-gray-500">填写您的年报项目基本信息</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      项目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="例如：2024年度企业年报"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      项目描述
                    </label>
                    <textarea
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      placeholder="简要描述这份年报的内容和用途..."
                      rows={4}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      封面图片
                    </label>
                    <div
                      onClick={() => {}}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        coverImage
                          ? "border-gold/50 bg-gold/5"
                          : "border-gray-200 hover:border-deep-blue/30 hover:bg-deep-blue/5"
                      }`}
                    >
                      {coverImage ? (
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gold" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">cover_2024.jpg</p>
                            <p className="text-sm text-gray-500">2.4 MB · 已上传</p>
                          </div>
                          <Check className="w-6 h-6 text-green-500" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Upload className="w-7 h-7 text-gray-400" />
                          </div>
                          <p className="font-semibold text-gray-700 mb-1">点击上传封面图片</p>
                          <p className="text-sm text-gray-500">支持 JPG、PNG 格式，建议尺寸 1920×1080</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-10 pt-8 border-t border-gray-100">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceed}
                    className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold transition-all ${
                      canProceed
                        ? "bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    下一步
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg shadow-gold/20">
                  <Palette className="w-8 h-8 text-deep-blue" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">选择设计模板</h2>
                <p className="text-gray-500">选择一个适合您品牌风格的专业模板</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {MOCK_TEMPLATES.map((template) => (
                  <TemplateOption
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onSelect={() => setSelectedTemplate(template.id)}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-10 pt-8 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  上一步
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold transition-all ${
                    canProceed
                      ? "bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  下一步
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/30"
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-heading font-bold text-gray-900 mb-4"
              >
                项目创建成功！
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-500 mb-10 max-w-lg mx-auto"
              >
                「{projectName}」已准备就绪，您可以立即开始编辑年报内容
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-md mx-auto bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 mb-10 text-left"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">项目名称</span>
                    <span className="font-semibold text-gray-900">{projectName || "未命名项目"}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">使用模板</span>
                    <span className="font-semibold text-deep-blue">
                      {MOCK_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "商务深蓝"}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">初始状态</span>
                    <span className="font-semibold text-amber-600">草稿</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
                >
                  返回工作台
                </Link>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2.5 px-10 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-2xl hover:shadow-deep-blue/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  立即开始编辑
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TemplateOption({
  template,
  isSelected,
  onSelect,
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-gold shadow-xl shadow-gold/20"
          : "shadow-sm hover:shadow-xl border border-gray-100"
      }`}
    >
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor || template.theme.primaryColor}dd 100%)`,
        }}
      >
        <div
          className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: template.theme.accentColor }}
        />
        <div className="absolute bottom-5 left-5 right-5 space-y-2">
          <div
            className="h-1.5 w-20 rounded-full"
            style={{ backgroundColor: template.theme.accentColor }}
          />
          <div
            className="h-1.5 w-32 rounded-full opacity-60"
            style={{ backgroundColor: template.theme.backgroundColor || "white" }}
          />
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
      <div className="p-5 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900">{template.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{template.category}</p>
          </div>
          <div className="flex gap-1">
            {[template.theme.primaryColor, template.theme.accentColor].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-md shadow-sm border border-gray-100" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
