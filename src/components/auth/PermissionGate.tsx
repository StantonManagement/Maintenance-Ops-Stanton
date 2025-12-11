import { ReactNode } from 'react';
import { useRole } from '../../providers/RoleProvider';

interface PermissionGateProps {
  children: ReactNode;
  action: string;
  fallback?: ReactNode;
}

export function PermissionGate({ children, action, fallback = null }: PermissionGateProps) {
  const { checkPermission, isLoading } = useRole();

  // While loading permissions, we generally default to not showing the protected content
  // to avoid flicker of restricted UI.
  if (isLoading) {
    return null; 
  }

  if (checkPermission(action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
