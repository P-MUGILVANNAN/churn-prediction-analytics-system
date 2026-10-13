import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  Users,
  DollarSign,
  AlertOctagon,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function Segmentation() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSegments()
      .then(res => {
        setSegments(res);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Customer Value-Risk Segmentation</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          K-Means clustering combined with financial risk matrices into 5 actionable business cohorts.
        </p>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg, idx) => (
          <div
            key={seg.id || `${seg.segment_code}-${idx}`}
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${seg.color}15`, color: seg.color }}>
                  {seg.business_priority} Priority
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">
                  {seg.customer_count.toLocaleString()} Customers
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-3">{seg.segment_name}</h2>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Avg Churn</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {(seg.avg_churn_prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Avg Bill</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    ${seg.avg_monthly_charges.toFixed(0)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tenure</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {seg.avg_tenure.toFixed(0)} mos
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50/80 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">MRR at Risk</span>
                <p className="text-base font-black text-rose-600">
                  ${seg.revenue_at_risk_monthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 block mb-1">Recommended Action:</span>
              <p className="font-bold text-blue-700 leading-snug">{seg.recommended_action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Segment Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Revenue-at-Risk by Customer Segment</h3>
        <p className="text-xs text-slate-500 mb-4">Focusing proactive campaigns where financial exposure is concentrated</p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segments} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="segment_name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis unit="$" tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val) => [`$${val.toLocaleString()}`, 'Monthly Revenue at Risk']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="revenue_at_risk_monthly" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
