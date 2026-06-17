import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Mail,
  Crown,
  Shield,
  Edit3,
  Eye,
  UserPlus,
  Check,
  X,
  Trash2,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import type { Collaborator as CollaboratorType, UserRole } from "@shared/types";

const roleConfig: Record<UserRole | "owner", { label: string; color: string; icon: any; desc: string }> = {
  owner: { label: "所有者", color: "bg-purple-100 text-purple-700", icon: Crown, desc: "拥有项目的全部权限" },
  admin: { label: "管理员", color: "bg-purple-100 text-purple-700", icon: Shield, desc: "可管理所有设置和成员" },
  data_manager: { label: "数据管理员", color: "bg-blue-100 text-blue-700", icon: Database, desc: "可导入和管理数据" },
  editor: { label: "内容编辑者", color: "bg-amber-100 text-amber-700", icon: Edit3, desc: "可编辑年报内容" },
  viewer: { label: "查看者", color: "bg-gray-100 text-gray-700", icon: Eye, desc: "仅可查看内容" },
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
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

interface CollaboratorCardProps {
  collab: CollaboratorType;
  isOwner?: boolean;
  canManage: boolean;
  onRoleChange: (userId: string, newRole: "data_manager" | "editor" | "viewer") => void;
  onRemove: (userId: string, userName: string) => void;
}

function CollaboratorCard({ collab, isOwner, canManage, onRoleChange, onRemove }: CollaboratorCardProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const user = collab.user;
  const effectiveRole = (isOwner ? "owner" : collab.role) as UserRole | "owner";
  const roleInfo = roleConfig[effectiveRole];
  const RoleIcon = roleInfo.icon;
  const joinedAtStr = collab.joinedAt
    ? new Date(collab.joinedAt).toLocaleDateString("zh-CN")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-5 bg-white rounded-2xl border border-gray-100 hover:border-deep-blue/20 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user?.name?.charAt(0) || "?"}
          </div>
          {isOwner && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gold flex items-center justify-center shadow-md border-2 border-white">
              <Crown className="w-3.5 h-3.5 text-deep-blue" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 text-lg truncate">{user?.name || "未知用户"}</h4>
              <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email || "-"}</p>
            </div>
            {canManage && !isOwner ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-deep-blue transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showRoleMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-10"
                        onClick={() => setShowRoleMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                      >
                        {(["data_manager", "editor", "viewer"] as const).map((r) => {
                          const RoleIconItem = roleConfig[r].icon;
                          return (
                            <button
                              key={r}
                              onClick={() => {
                                onRoleChange(collab.userId, r);
                                setShowRoleMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                r === collab.role ? "text-deep-blue bg-deep-blue/5" : "text-gray-700"
                              }`}
                            >
                              <RoleIconItem className="w-4 h-4" />
                              {roleConfig[r].label}
                              {r === collab.role && <Check className="w-4 h-4 ml-auto text-gold" />}
                            </button>
                          );
                        })}
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={() => {
                            onRemove(collab.userId, user?.name || "该成员");
                            setShowRoleMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          移除协作者
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${roleInfo.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {roleInfo.label}
            </div>
            {joinedAtStr && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                加入于 {joinedAtStr}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CollaborationPage() {
  const { id } = useParams();
  const projectId = id || "";

  const storeCollaborators = useAppStore((s) => s.collaborators);
  const currentProject = useAppStore((s) => s.getCurrentProject());
  const currentUser = useAppStore((s) => s.currentUser);
  const addCollaborator = useAppStore((s) => s.addCollaborator);
  const updateCollaboratorRole = useAppStore((s) => s.updateCollaboratorRole);
  const removeCollaborator = useAppStore((s) => s.removeCollaborator);
  const canManageCollaborators = useAppStore((s) => s.canManageCollaborators());
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const currentProjectId = useAppStore((s) => s.currentProjectId);

  const project = currentProject;
  const projectName = project?.name || "未命名项目";

  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"data_manager" | "editor" | "viewer">("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; userName: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!currentProjectId && projectId) {
      setCurrentProject(projectId);
    }
  }, [currentProjectId, projectId, setCurrentProject]);

  const showToast = (type: "error" | "success", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const inviteLink = useMemo(() => {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${projectId}`;
  }, [projectId]);

  const ownerEntry = useMemo(() => {
    if (!project || project.ownerId !== currentUser.id) {
      return null;
    }
    return {
      userId: currentUser.id,
      user: currentUser,
      projectId,
      role: "admin" as const,
      joinedAt: project.createdAt,
      invitedBy: currentUser.id,
      isOwner: true,
    };
  }, [project, currentUser, projectId]);

  const collaborators = useMemo(() => {
    const list: (CollaboratorType & { isOwner?: boolean })[] = [];
    if (ownerEntry) {
      list.push(ownerEntry as any);
    }
    storeCollaborators.forEach((c) => list.push({ ...c, isOwner: false }));
    return list;
  }, [ownerEntry, storeCollaborators]);

  const filtered = useMemo(() => {
    return collaborators.filter(
      (u) =>
        (u.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collaborators, searchQuery]);

  const roleCounts = useMemo(() => {
    return {
      owner: collaborators.filter((c) => c.isOwner).length,
      data_manager: collaborators.filter((c) => !c.isOwner && c.role === "data_manager").length,
      editor: collaborators.filter((c) => !c.isOwner && c.role === "editor").length,
      viewer: collaborators.filter((c) => !c.isOwner && c.role === "viewer").length,
    };
  }, [collaborators]);

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteLink);
    if (ok) {
      setCopied(true);
      showToast("success", "邀请链接已复制");
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast("error", "复制失败，请手动复制");
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("请输入邮箱地址");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError("请输入有效的邮箱地址");
      return;
    }
    if (!inviteName.trim()) {
      setInviteError("请输入成员姓名");
      return;
    }
    setInviteError(null);
    setInviteLoading(true);
    try {
      const result = await addCollaborator({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        role: inviteRole,
      });
      if (result && "error" in result) {
        setInviteError(result.error);
      } else {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteName("");
        setInviteRole("editor");
        showToast("success", "邀请已发送");
      }
    } catch {
      setInviteError("邀请发送失败，请重试");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "data_manager" | "editor" | "viewer") => {
    try {
      await updateCollaboratorRole(userId, newRole);
      showToast("success", "角色已更新");
    } catch {
      showToast("error", "角色更新失败");
    }
  };

  const handleRemoveClick = (userId: string, userName: string) => {
    setConfirmRemove({ userId, userName });
  };

  const confirmRemoveUser = async () => {
    if (!confirmRemove) return;
    try {
      await removeCollaborator(confirmRemove.userId);
      showToast("success", `${confirmRemove.userName} 已移除`);
      setConfirmRemove(null);
    } catch {
      showToast("error", "移除失败，请重试");
    }
  };

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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">协作管理</h1>
                <p className="text-xs text-gray-500 leading-tight">{projectName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageCollaborators && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-deep-blue to-deep-blue-light hover:shadow-lg hover:shadow-deep-blue/30 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                邀请协作者
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {!canManageCollaborators && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-3xl p-6 mb-8 border border-blue-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">只读模式</h3>
                <p className="text-blue-800/70 text-sm leading-relaxed">
                  您当前为查看者角色，仅可查看团队成员列表。如需邀请或管理成员，请联系项目所有者。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {(
            [
              { key: "owner" as const, total: collaborators.length, label: "团队总人数" },
              { key: "data_manager" as const, total: roleCounts.data_manager, label: "数据管理员" },
              { key: "editor" as const, total: roleCounts.editor, label: "内容编辑者" },
              { key: "viewer" as const, total: roleCounts.viewer, label: "查看者" },
            ]
          ).map((item, idx) => {
            const cfg = roleConfig[item.key];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.color.split(" ")[0]}`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{item.total}</p>
                </div>
                <p className="text-sm text-gray-500">{item.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-gold/10 via-amber-50 to-gold/10 rounded-3xl p-8 mb-10 border border-gold/20 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                <Copy className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">分享协作链接</h3>
                <p className="text-gray-600 max-w-lg leading-relaxed">
                  通过链接邀请团队成员加入项目，您可以随时设置访问权限和角色
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-80 px-5 py-3 bg-white rounded-xl border border-gold/30 text-sm text-gray-700 truncate font-mono shadow-sm">
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-500 text-white shadow-xl shadow-green-500/30"
                    : "bg-gradient-to-r from-gold to-gold-light text-deep-blue hover:shadow-xl hover:shadow-gold/30"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">团队成员 ({filtered.length})</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {canManageCollaborators
                  ? "管理项目的协作者及其权限"
                  : "查看项目的协作者及其权限"}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索成员..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              />
            </div>
          </div>

          <div className="p-5 grid gap-4">
            {filtered.map((c, idx) => (
              <CollaboratorCard
                key={c.userId + idx}
                collab={c}
                isOwner={c.isOwner}
                canManage={canManageCollaborators}
                onRoleChange={handleRoleChange}
                onRemove={handleRemoveClick}
              />
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gray-100 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">未找到匹配的成员</h4>
                <p className="text-gray-500">尝试其他搜索关键词</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue-dark rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -top-20 left-1/4 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">了解权限等级</h3>
            <p className="text-white/70 mb-8 max-w-2xl leading-relaxed">
              为不同角色的团队成员分配合适的权限，确保项目安全高效地协作
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              {(
                [
                  {
                    role: "data_manager" as const,
                    features: ["导入和管理数据源", "配置字段映射", "创建和编辑内容", "查看分析数据"],
                  },
                  {
                    role: "editor" as const,
                    features: ["编辑年报内容", "调整图表配置", "修改文字样式", "保存项目版本"],
                  },
                  {
                    role: "viewer" as const,
                    features: ["浏览年报内容", "发表评论", "下载PDF文档", "查看历史版本"],
                  },
                  {
                    role: "owner" as const,
                    features: ["全部操作权限", "管理团队成员", "发布和导出", "删除项目"],
                  },
                ]
              ).map((item, idx) => {
                const cfg = roleConfig[item.role];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={item.role}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center">
                        <Icon className="w-5.5 h-5.5 text-gold" />
                      </div>
                      <h4 className="text-lg font-bold text-white">{cfg.label}</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {item.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-white/80 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gold/25 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-gold" strokeWidth={3} />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="fixed inset-0 bg-deep-blue/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-deep-blue to-deep-blue-light flex items-center justify-center mb-5 shadow-lg shadow-deep-blue/20">
                        <Mail className="w-7 h-7 text-gold" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">邀请协作者</h3>
                      <p className="text-gray-500">通过邮箱邀请团队成员加入项目</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">成员姓名</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => {
                          setInviteName(e.target.value);
                          if (inviteError) setInviteError(null);
                        }}
                        placeholder="请输入成员姓名"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">邮箱地址</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          if (inviteError) setInviteError(null);
                        }}
                        placeholder="name@company.com"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                      />
                    </div>

                    {inviteError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{inviteError}</p>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">选择角色</label>
                      <div className="space-y-2.5">
                        {(["data_manager", "editor", "viewer"] as const).map((r) => {
                          const cfg = roleConfig[r];
                          const Icon = cfg.icon;
                          const isActive = inviteRole === r;
                          return (
                            <button
                              key={r}
                              onClick={() => setInviteRole(r)}
                              className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                                isActive
                                  ? "bg-deep-blue/5 border-2 border-deep-blue"
                                  : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                              }`}
                            >
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{cfg.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isActive ? "border-deep-blue bg-deep-blue" : "border-gray-300"
                                }`}
                              >
                                {isActive && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      disabled={inviteLoading}
                      className="flex-1 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSendInvite}
                      disabled={inviteLoading}
                      className="flex-1 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-deep-blue to-deep-blue-light text-white hover:shadow-lg hover:shadow-deep-blue/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {inviteLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          发送中...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4.5 h-4.5" />
                          发送邀请
                          <ArrowRight className="w-4.5 h-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmRemove && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmRemove(null)}
              className="fixed inset-0 bg-deep-blue/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">确认移除</h3>
                      <p className="text-gray-500 leading-relaxed">
                        确定要移除 <span className="font-semibold text-gray-900">{confirmRemove.userName}</span>{" "}
                        吗？移除后该成员将无法再访问项目内容。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="flex-1 py-3.5 rounded-xl text-base font-semibold border border-gray-200 text-gray-700 hover:border-deep-blue/30 hover:text-deep-blue transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={confirmRemoveUser}
                      className="flex-1 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                      确认移除
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
