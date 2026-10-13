import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  BrainCircuit,
  UserCheck,
  Sparkles,
  PieChart,
  Target,
  Megaphone,
  DollarSign,
  FileText,
  ShieldAlert,
  LogOut,
  X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customer Management', icon: Users },
  { path: '/eda', label: 'Exploratory Analytics', icon: BarChart3 },
  { path: '/models', label: 'Model Benchmarking', icon: BrainCircuit },
  { path: '/predict', label: 'Churn Prediction', icon: UserCheck },
  { path: '/xai', label: 'Explainable AI (SHAP)', icon: Sparkles },
  { path: '/segments', label: 'Customer Segments', icon: PieChart },
  { path: '/retention', label: 'Retention Engine', icon: Target },
  { path: '/campaigns', label: 'Campaigns & ROI', icon: Megaphone },
  { path: '/revenue', label: 'Revenue at Risk', icon: DollarSign },
  { path: '/reports', label: 'Reports & Research', icon: FileText },
];

export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight leading-tight">
                Churn<span className="text-blue-400">Analytics</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Enterprise XAI Suite</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Analytical Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Session Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'Analyst Session'}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{user?.role || 'Lead Data Scientist'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
