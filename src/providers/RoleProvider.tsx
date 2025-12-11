import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthProvider';
import { useActivePortfolio } from './PortfolioProvider';

export type UserRole = 'owner' | 'manager' | 'coordinator' | 'admin' | 'technician' | 'viewer';

interface RoleContextType {
  role: UserRole | null;
  isLoading: boolean;
  // Permission checks
  canAssignTechnician: boolean;
  canMarkComplete: boolean;
  canCreateWorkOrder: boolean;
  canDeleteWorkOrder: boolean;
  canViewAllWorkOrders: boolean;
  canManageUsers: boolean;
  canModifySchedule: boolean;
  checkPermission: (action: string) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activePortfolio } = useActivePortfolio();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user || !activePortfolio) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('portfolio_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('portfolio_id', activePortfolio.id)
          .single();

        if (error) {
          console.error('Error fetching role:', error);
          setRole(null);
        } else if (data) {
          // Explicitly cast data to handle potential type inference issues
          const userRole = (data as any).role;
          setRole(userRole as UserRole);
        }
      } catch (err) {
        console.error('Failed to fetch role:', err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user, activePortfolio]);

  // Permission Logic
  const canAssignTechnician = ['owner', 'manager', 'coordinator'].includes(role || '');
  const canMarkComplete = ['owner', 'manager', 'coordinator'].includes(role || '');
  const canCreateWorkOrder = ['owner', 'manager', 'coordinator', 'admin'].includes(role || '');
  const canDeleteWorkOrder = ['owner'].includes(role || '');
  const canViewAllWorkOrders = ['owner', 'manager', 'coordinator', 'admin', 'viewer'].includes(role || '');
  const canManageUsers = ['owner'].includes(role || '');
  const canModifySchedule = ['owner', 'manager', 'coordinator'].includes(role || '');

  const checkPermission = useCallback((action: string): boolean => {
    if (!role) return false;
    
    // Generic fallback or specific logic extension
    switch (action) {
      case 'assign_technician': return canAssignTechnician;
      case 'mark_complete': return canMarkComplete;
      case 'create_work_order': return canCreateWorkOrder;
      case 'delete_work_order': return canDeleteWorkOrder;
      case 'view_all_work_orders': return canViewAllWorkOrders;
      case 'manage_users': return canManageUsers;
      case 'modify_schedule': return canModifySchedule;
      default: return false;
    }
  }, [role, canAssignTechnician, canMarkComplete, canCreateWorkOrder, canDeleteWorkOrder, canViewAllWorkOrders, canManageUsers, canModifySchedule]);

  const value = {
    role,
    isLoading,
    canAssignTechnician,
    canMarkComplete,
    canCreateWorkOrder,
    canDeleteWorkOrder,
    canViewAllWorkOrders,
    canManageUsers,
    canModifySchedule,
    checkPermission
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
