import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  ShieldAlert,
  PieChart,
  BarChart3,
  Calendar,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRevenueRisk()
      .then(res => {
        setData(res);
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

  if (!data) return null;

  const mrrRisk = data.total_monthly_revenue_at_risk;
  const arrRisk = data.total_annual_revenue_at_risk;
  const projectedSaveMRR = mrrRisk * 0.35; // 35% targeted recovery benchmark
  const projectedSaveARR = arrRisk * 0.35;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Revenue-at-Risk Financial Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quantifying recurring revenue exposure across contracts and segments with retention ROI projections.
        </p>
      </div>

      {/* Disclaimers & Definitions */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-slate-600">
        <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0" />
        <p>
          <strong>Financial Definition:</strong> Metrics reflect <em>estimated monthly recurring revenue (MRR) at risk</em> among high- and medium-propensity churners, not confirmed loss. Double counting is prevented by individual-level customer aggregation.
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Monthly MRR Exposure"
          value={`$${mrrRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Estimated monthly churn risk"
          icon={DollarSign}
          alertLevel="high"
        />
        <MetricCard
          title="Annual ARR Exposure"
          value={`$${arrRisk.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Projected 12-month annualized loss"
          icon={TrendingDown}
          alertLevel="high"
        />
        <MetricCard
          title="35% Target Saved MRR"
          value={`$${projectedSaveMRR.toLocaleString(undefined, { minimumFractionDigits: 2 })} / mo`}
          subtitle="Achievable via proactive campaigns"
          icon={ArrowUpRight}
          alertLevel="success"
        />
        <MetricCard
          title="Target Annual Retained ARR"
          value={`$${projectedSaveARR.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Projected bottom-line impact"
          icon={Calendar}
          alertLevel="success"
        />
      </div>

      {/* Exposure by Contract Type Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Exposure by Contract Type</h2>
              <p className="text-xs text-slate-500">Month-to-month contracts account for 85%+ of financial exposure</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.contract_exposure}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="contract" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis unit="$" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val, name, item) => [`$${val.toLocaleString()} (${item.payload.customer_count} subscribers)`, 'Monthly Risk Exposure']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="mrr_at_risk" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exposure by Segment Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Segment Revenue Concentration</h2>
            <p className="text-xs text-slate-500 mb-4">Prioritizing high-yield account interventions</p>
          </div>

          <div className="space-y-3">
            {data.segment_exposure.map((seg, idx) => (
              <div key={`${seg.segment_code}-${idx}`} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{seg.segment_name}</span>
                  <p className="text-[11px] text-slate-500">{seg.customer_count} Customers</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-rose-600 block text-sm">
                    ${seg.monthly_risk.toLocaleString()} / mo
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ${seg.annual_risk.toLocaleString()} ARR
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 text-center">
            Calculated strictly from active billing records.
          </div>
        </div>
      </div>
    </div>
  );
}
