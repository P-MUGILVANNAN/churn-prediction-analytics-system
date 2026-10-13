import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, Menu } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ title, subtitle, onToggleSidebar }) {
  const [dbStatus, setDbStatus] = useState({ healthy: true, dialect: 'sqlite' });

  useEffect(() => {
    api.checkHealth()
      .then(res => setDbStatus({ healthy: res.status === 'healthy', dialect: res.database }))
      .catch(() => setDbStatus({ healthy: false, dialect: 'error' }));
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center min-w-0 mr-2">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 mr-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Dataset Tag (Hidden on small mobile) */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>IBM Telco (7,043)</span>
        </div>

        {/* System Health Status */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
          dbStatus.healthy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {dbStatus.healthy ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="hidden sm:inline">Model & DB Active ({dbStatus.dialect.toUpperCase()})</span>
              <span className="sm:hidden">Active</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
