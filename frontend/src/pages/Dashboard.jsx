import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import MetricCard from '../components/MetricCard';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

const RISK_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardSummary()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Executive Analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unable to load dashboard data. Ensure backend service is running.
      </div>
    );
  }

  const riskPieData = [
    { name: 'Low Risk', value: data.low_risk_count },
    { name: 'Medium Risk', value: data.medium_risk_count },
    { name: 'High Risk', value: data.high_risk_count }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Scope */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Executive Churn & Retention Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time machine learning predictions and financial exposure based on active customer base.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 self-start md:self-auto">
          <Layers className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">Champion: Soft-Voting Hybrid (ROC-AUC 0.8467)</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Subscribers"
          value={data.total_customers.toLocaleString()}
          subtitle="Active evaluated customer accounts"
          icon={Users}
          alertLevel="none"
        />
        <MetricCard
          title="Predicted Churners"
          value={data.predicted_churners.toLocaleString()}
          subtitle={`${data.churn_rate}% modeled churn propensity`}
          icon={TrendingDown}
          alertLevel={data.churn_rate > 25 ? 'warning' : 'none'}
          badge={`${data.churn_rate}%`}
        />
        <MetricCard
          title="High-Risk Cohort"
          value={data.high_risk_count.toLocaleString()}
          subtitle="Predicted churn probability >= 65%"
          icon={AlertTriangle}
          alertLevel="high"
          badge="Urgent Action"
        />
        <MetricCard
          title="Monthly Revenue at Risk"
          value={`$${data.estimated_revenue_at_risk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${data.mrr_risk_percentage}% of Total MRR ($${data.total_mrr.toLocaleString()})`}
          icon={DollarSign}
          alertLevel="high"
        />
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer Risk Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Categorized by model-calibrated probability thresholds</p>
          </div>
          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} subscribers (${((value / data.total_customers) * 100).toFixed(1)}%)`, 'Count']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-500">
            <span>Low Risk: {data.low_risk_count}</span>
            <span>Med Risk: {data.medium_risk_count}</span>
            <span className="text-rose-600 font-bold">High Risk: {data.high_risk_count}</span>
          </div>
        </div>

        {/* Churn by Contract Type Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Churn Propensity by Contract Type</h2>
              <p className="text-xs text-slate-500 mt-0.5">Subscription lock-in directly reduces customer turnover</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              Primary Risk Factor
            </span>
          </div>
          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.contract_distribution} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="contract" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 50]} />
                <Tooltip
                  formatter={(value, name, item) => [
                    `${value}% (${item.payload.churn_count} of ${item.payload.total_customers})`,
                    'Predicted Churn Rate'
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Churn Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Month-to-month contracts exhibit ~43% churn rate</span>
            <span className="text-emerald-600 font-semibold">Two-year contracts exhibit &lt; 3% churn rate</span>
          </div>
        </div>
      </div>

      {/* Secondary Insights: Tenure Distribution & Internet Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenure Cohorts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Churn Rate Across Tenure Cohorts</h2>
              <p className="text-xs text-slate-500">Churn sharply drops as customer tenure advances past year 1</p>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tenure_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (${item.payload.churners}/${item.payload.total})`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Internet Service Churn */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Churn Rate by Internet Tier</h2>
              <p className="text-xs text-slate-500">Fiber Optic accounts display elevated churn due to pricing/support sensitivity</p>
            </div>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_internet}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="service" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (${item.payload.churners}/${item.payload.count})`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
