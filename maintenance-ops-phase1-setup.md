# Maintenance Operations Center - Phase 1.1: Setup + Authentication/Layout (Next.js + Supabase)

## Project Setup & Core Foundation

### Initial Setup Commands
```bash
npx create-next-app@latest maintenance-ops --typescript --tailwind --eslint --app
cd maintenance-ops
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared
npm install lucide-react clsx class-variance-authority
npm install @tailwindcss/forms
```

### 1. Environment Configuration
**File: `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Supabase Configuration
**File: `lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**File: `lib/supabase-server.ts`**
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './database.types'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({
    cookies
  })
}
```

### 3. Database Types
**File: `lib/database.types.ts`**
```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'coordinator' | 'technician' | 'vendor'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'coordinator' | 'technician' | 'vendor'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'coordinator' | 'technician' | 'vendor'
          phone?: string | null
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          title: string
          description: string
          building: string
          unit: string
          priority: 'emergency' | 'high' | 'medium' | 'low'
          status: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          scheduled_date: string | null
          tenant_name: string
          tenant_phone: string
          tenant_email: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          building: string
          unit: string
          priority: 'emergency' | 'high' | 'medium' | 'low'
          status?: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          scheduled_date?: string | null
          tenant_name: string
          tenant_phone: string
          tenant_email: string
        }
        Update: {
          title?: string
          description?: string
          building?: string
          unit?: string
          priority?: 'emergency' | 'high' | 'medium' | 'low'
          status?: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id?: string | null
          updated_at?: string
          scheduled_date?: string | null
          tenant_name?: string
          tenant_phone?: string
          tenant_email?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type WorkOrder = Database['public']['Tables']['work_orders']['Row']
```

### 4. Supabase Schema (SQL)
**File: `supabase/migrations/001_initial_schema.sql`**
```sql
-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('coordinator', 'technician', 'vendor')) NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_orders table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  building TEXT NOT NULL,
  unit TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('emergency', 'high', 'medium', 'low')) NOT NULL,
  status TEXT CHECK (status IN ('new', 'assigned', 'in_progress', 'ready_review', 'completed', 'failed_review')) DEFAULT 'new',
  assigned_tech_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT NOT NULL,
  tenant_email TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view work orders" ON work_orders FOR SELECT USING (true);
CREATE POLICY "Coordinators can insert work orders" ON work_orders FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'coordinator'
    )
  );
CREATE POLICY "Coordinators can update all work orders" ON work_orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'coordinator'
    )
  );
CREATE POLICY "Technicians can update assigned work orders" ON work_orders FOR UPDATE 
  USING (
    assigned_tech_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'coordinator'
    )
  );

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Auth Context for Next.js
**File: `contexts/AuthContext.tsx`**
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User as AppUser } from '@/lib/database.types'

interface AuthContextType {
  user: User | null
  userProfile: AppUser | null
  loading: boolean
  signOut: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}

export type Permission = 
  | 'assign' 
  | 'approve' 
  | 'close' 
  | 'update' 
  | 'photo_upload' 
  | 'create_emergency'
  | 'view_all'
  | 'edit_own'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data && !error) {
      setUserProfile(data)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!userProfile) return false
    
    const rolePermissions: Record<string, Permission[]> = {
      coordinator: ['assign', 'approve', 'close', 'view_all', 'create_emergency', 'update', 'photo_upload'],
      technician: ['update', 'photo_upload', 'edit_own'],
      vendor: ['update', 'photo_upload', 'edit_own']
    }

    return rolePermissions[userProfile.role]?.includes(permission) || false
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signOut,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 6. Root Layout
**File: `app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Maintenance Operations Center',
  description: 'Property maintenance management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 7. Login Page
**File: `app/login/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, LogIn, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Demo accounts for development
  const demoAccounts = [
    { email: 'kristine@maintenance.com', password: 'demo123', name: 'Kristine Wagner', role: 'Coordinator' },
    { email: 'ramon@maintenance.com', password: 'demo123', name: 'Ramon Torres', role: 'Technician' },
    { email: 'kishan@maintenance.com', password: 'demo123', name: 'Kishan Patel', role: 'Technician' }
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    
    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    })

    if (error) {
      setError(`Demo login failed: ${error.message}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Maintenance Operations
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Demo Accounts */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Demo Accounts:</p>
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              onClick={() => handleDemoLogin(account.email, account.password)}
              className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{account.name}</div>
                <div className="text-xs text-gray-500">{account.role}</div>
              </div>
              <LogIn className="ml-auto h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 8. Protected Route Wrapper
**File: `components/ProtectedRoute.tsx`**
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

### 9. Main Dashboard Layout
**File: `app/(dashboard)/layout.tsx`**
```typescript
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### 10. Header Component
**File: `components/layout/Header.tsx`**
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Bell, Settings, LogOut, User } from 'lucide-react'

export default function Header() {
  const { userProfile, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">
              Maintenance Operations
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{userProfile?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{userProfile?.role}</div>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
```

### 11. Sidebar Navigation
**File: `components/layout/Sidebar.tsx`**
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  ClipboardList, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  AlertTriangle 
} from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ComponentType<any>
  label: string
  requiredPermissions?: string[]
}

export default function Sidebar() {
  const { userProfile, hasPermission } = useAuth()
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      href: '/work-orders',
      icon: ClipboardList,
      label: 'Work Orders'
    },
    {
      href: '/schedule',
      icon: Calendar,
      label: 'Schedule',
      requiredPermissions: ['assign', 'view_all']
    },
    {
      href: '/technicians',
      icon: Users,
      label: 'Technicians',
      requiredPermissions: ['assign']
    },
    {
      href: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      requiredPermissions: ['view_all']
    },
    {
      href: '/emergency',
      icon: AlertTriangle,
      label: 'Emergency',
      requiredPermissions: ['create_emergency']
    }
  ]

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredPermissions) return true
    return item.requiredPermissions.some(permission => hasPermission(permission as any))
  })

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Current Role
          </div>
          <div className="text-sm font-medium text-gray-900 capitalize mt-1">
            {userProfile?.role}
          </div>
        </div>
      </div>
    </aside>
  )
}
```

### 12. Dashboard Page
**File: `app/(dashboard)/dashboard/page.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Work Orders</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Technicians</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Work order #WO-001 completed by Ramon Torres</span>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New work order #WO-015 created for Building A, Unit 203</span>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Work order #WO-012 awaiting review</span>
              <span className="text-xs text-gray-400">6 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 13. Tailwind Configuration
**File: `tailwind.config.ts`**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config
```

### 14. Global Styles
**File: `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  }
  
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  }

  .btn-success {
    @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
  }
}
```

### 15. Middleware for Auth
**File: `middleware.ts`**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/dashboard', '/work-orders', '/schedule', '/technicians', '/analytics', '/emergency']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect authenticated users away from login page
  if (req.nextUrl.pathname === '/login') {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Redirect root to dashboard if authenticated, login if not
  if (req.nextUrl.pathname === '/') {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

### 16. Package.json Scripts
**File: `package.json` (add these scripts)**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "supabase:generate-types": "supabase gen types typescript --project-id your-project-id > lib/database.types.ts"
  }
}
```

### 17. Seed Data (Optional Development Helper)
**File: `scripts/seed-dev-data.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDevData() {
  console.log('Seeding development data...')

  // Create demo users (passwords will be 'demo123')
  const users = [
    {
      email: 'kristine@maintenance.com',
      password: 'demo123',
      name: 'Kristine Wagner',
      role: 'coordinator',
      phone: '(555) 123-4567'
    },
    {
      email: 'ramon@maintenance.com',
      password: 'demo123',
      name: 'Ramon Torres',
      role: 'technician',
      phone: '(555) 234-5678'
    },
    {
      email: 'kishan@maintenance.com',
      password: 'demo123',
      name: 'Kishan Patel',
      role: 'technician',
      phone: '(555) 345-6789'
    }
  ]

  // Create auth users and profile records
  for (const user of users) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (authError) {
      console.error(`Error creating auth user ${user.email}:`, authError)
      continue
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        phone: user.phone
      })

    if (profileError) {
      console.error(`Error creating profile for ${user.email}:`, profileError)
    } else {
      console.log(`✓ Created user: ${user.name} (${user.role})`)
    }
  }

  console.log('✓ Development data seeded successfully!')
}

seedDevData().catch(console.error)
```

### 18. Environment Setup Instructions
**File: `README.md`**
```markdown
# Maintenance Operations Center

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd maintenance-ops
npm install
```

### 2. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your project URL and keys
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials

### 3. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL migration from `supabase/migrations/001_initial_schema.sql`

### 4. Seed Development Data (Optional)
```bash
npx ts-node scripts/seed-dev-data.ts
```

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 and use one of the demo accounts:
- Coordinator: kristine@maintenance.com / demo123
- Technician: ramon@maintenance.com / demo123
- Technician: kishan@maintenance.com / demo123

### 6. Deploy to Render
1. Connect your GitHub repository to Render
2. Add environment variables in Render dashboard
3. Deploy with build command: `npm run build`
4. Start command: `npm start`

## Project Structure
```
app/
├── (dashboard)/          # Protected dashboard routes
│   ├── dashboard/        # Main dashboard
│   ├── work-orders/      # Work order management
│   └── layout.tsx        # Dashboard layout with sidebar
├── login/                # Login page
├── globals.css           # Global styles
└── layout.tsx            # Root layout

components/
├── layout/               # Layout components
└── ProtectedRoute.tsx    # Route protection

contexts/
└── AuthContext.tsx       # Authentication state

lib/
├── supabase.ts           # Supabase client
├── supabase-server.ts    # Server-side Supabase
└── database.types.ts     # TypeScript types
```

## Next Steps
This completes Phase 1.1 - Setup + Authentication/Layout. Next phases will add:
- Phase 1.2: Work Order System (CRUD operations, status management)
- Phase 1.3: Dashboard + UI Components (role-based views, assignment modals)
```

## Phase 1.1 Complete - Ready for Development

This setup provides:

✅ **Next.js 14 with App Router** - Modern React framework
✅ **Supabase Integration** - Authentication, database, and RLS
✅ **Role-based Authentication** - Coordinator, Technician, Vendor roles
✅ **Protected Routes** - Middleware-based route protection
✅ **Responsive Layout** - Header, sidebar, and main content areas
✅ **Demo Accounts** - Ready-to-use development accounts
✅ **TypeScript** - Full type safety
✅ **Tailwind CSS** - Utility-first styling
✅ **Render Deployment Ready** - Environment configuration

**Next Steps:**
1. Run the setup commands
2. Configure Supabase project and environment variables
3. Test login with demo accounts
4. Proceed to Phase 1.2: Work Order System

The foundation is now solid for building the work order management system in the next phase.