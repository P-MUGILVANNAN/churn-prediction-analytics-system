import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, badge, alertLevel = 'none' }) {
  const borderStyles = {
    none: 'border-slate-200/80',
    high: 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20',
    warning: 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20',
    success: 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20',
    primary: 'border-blue-300 ring-1 ring-blue-200 bg-blue-50/20'
  };

  const iconStyles = {
    none: 'bg-slate-100 text-slate-700',
    high: 'bg-rose-100 text-rose-600',
    warning: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
    primary: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className={`bg-white rounded-xl p-5 border shadow-xs transition-all hover:shadow-md ${borderStyles[alertLevel] || borderStyles.none}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconStyles[alertLevel] || iconStyles.none}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
}
