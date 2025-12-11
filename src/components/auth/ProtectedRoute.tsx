import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useRole } from '../../providers/RoleProvider';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
  requiredPermission?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { role, checkPermission, isLoading: roleLoading } = useRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    // Determine loading state UI
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required
  if (requiredRole && role !== requiredRole) {
    // If user is logged in but doesn't have the role, maybe show 403 or redirect
    // For now, redirect to root or show forbidden
    return <Navigate to="/" replace />;
  }

  // If a specific permission is required
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
