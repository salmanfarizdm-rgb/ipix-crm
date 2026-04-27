import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth.js'
import {
  LayoutDashboard, Users, UserCog, TrendingUp, ShoppingBag, CreditCard,
  Wrench, Calendar, BarChart3, FileText, LogOut, Menu, ChevronRight,
  Store, Package, Sparkles, Truck
} from 'lucide-react'

const NAV = [
  { to:'/dashboard',   label:'Dashboard',        icon:LayoutDashboard, roles:null },
  { to:'/customers',   label:'Customers',         icon:Users,           roles:null },
  { to:'/leads',       label:'Leads',             icon:TrendingUp,      roles:null },
  { to:'/purchases',   label:'Purchases',         icon:ShoppingBag,     roles:null },
  { to:'/deliveries',  label:'Deliveries',        icon:Truck,           roles:null },
  { to:'/emi',         label:'EMI Tracker',       icon:CreditCard,      roles:null },
  { to:'/service',     label:'Service Requests',  icon:Wrench,          roles:null },
  { to:'/followups',   label:'Follow-ups',        icon:Calendar,        roles:null },
  { to:'/performance', label:'Team Performance',  icon:BarChart3,       roles:['admin','branch_manager','sales_manager'] },
  { to:'/reports',     label:'Reports',           icon:FileText,        roles:['admin','branch_manager'] },
  { to:'/products',    label:'Products DB',       icon:Package,         roles:['admin','branch_manager','sales_manager'] },
  { to:'/stores',      label:'Stores',            icon:Store,           roles:['admin','branch_manager'] },
  { to:'/users',       label:'Users',             icon:UserCog,         roles:['admin'] },
  { to:'/ai-reports',  label:'AI Reports',        icon:Sparkles,        roles:['admin','branch_manager','sales_manager'] },
]

const ROLE_LABELS = { admin:'Admin', branch_manager:'Branch Manager', sales_manager:'Sales Manager', sales_exec:'Sales Executive', technician:'Technician' }
const ROLE_COLORS = { admin:'bg-primary-100 text-primary-700', branch_manager:'bg-blue-100 text-blue-700', sales_manager:'bg-indigo-100 text-indigo-700', sales_exec:'bg-green-100 text-green-700', technician:'bg-orange-100 text-orange-700' }

export default function Layout() {
  const { user, logout, fetchMe } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { if (!user) fetchMe() }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }

  const navItems = NAV.filter(n => !n.roles || (user && n.roles.includes(user.role)))

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-slate-100 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">IX</div>
          {!collapsed && (
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">IPIX CRM</div>
              <div className="text-xs text-slate-400">Nikshan Electronics</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors text-sm font-medium
                ${isActive ? 'bg-primary-50 text-primary-700 border border-primary-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout — always visible */}
        <div className="p-3 border-t border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Loading...'}</div>
                {user?.role && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600'}`}>{ROLE_LABELS[user.role] || user.role}</span>}
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ${collapsed ? 'justify-center' : 'mt-1'}`}
            title="Logout">
            <LogOut size={15} /> {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                <div className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</div>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
