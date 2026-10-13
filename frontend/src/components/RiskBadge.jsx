import React from 'react';

export default function RiskBadge({ tier }) {
  const normalized = (tier || 'Low').toLowerCase();

  if (normalized === 'high') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600 animate-pulse"></span>
        High Risk
      </span>
    );
  }

  if (normalized === 'medium') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
        Medium Risk
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600"></span>
      Low Risk
    </span>
  );
}
