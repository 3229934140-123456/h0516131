import { ReactNode } from 'react';
import { useAppStore, type PermissionType } from '@/store/appStore';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  permission: PermissionType;
  children: ReactNode;
  fallback?: ReactNode;
  hide?: boolean;
}

export default function PermissionGate({ permission, children, fallback, hide = false }: PermissionGateProps) {
  const hasPermission = useAppStore((state) => state.checkPermission(permission));

  if (hasPermission) {
    return <>{children}</>;
  }

  if (hide) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="font-bold text-gray-900 text-lg mb-2">暂无权限</h4>
      <p className="text-gray-500 text-sm max-w-xs">
        您没有执行此操作的权限，请联系项目管理员获取相应权限。
      </p>
    </div>
  );
}
