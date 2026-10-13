import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Layers,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';

export default function ExploratoryAnalysis() {
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEdaAnalytics()
      .then(res => {
        setEdaData(res);
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!edaData) return null;

  const { audit, contract_eda, payment_eda, tech_support_eda, correlations } = edaData;

  const correlationChartData = Object.entries(correlations).map(([key, val]) => ({
    feature: key,
    correlation: val,
    color: val > 0 ? '#EF4444' : '#10B981'
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Exploratory Data Analysis (EDA)</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Uncovering behavioural patterns, statistical churn associations, and data provenance audits.
        </p>
      </div>

      {/* Dataset Provenance & Data Quality Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Dataset Provenance & Quality Audit</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
            Verified Ingestion (IBM Telco Public Dataset)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">Total Rows:</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{audit.total_records.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">Features Extracted:</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{audit.features_count}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">Baseline Churn Rate:</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{(audit.churn_rate * 100).toFixed(2)}%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">Whitespace Anomalies Remediated:</span>
            <p className="text-base font-black text-emerald-600 mt-0.5">{audit.blank_total_charges_remediated} Records</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic">
          * Note: 11 customer records had blank whitespace strings in <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">TotalCharges</code> coinciding with 0-month tenure. Imputed via product of tenure and monthly charges without introducing leakage.
        </p>
      </div>

      {/* Primary EDA Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Churn */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Churn Rate by Payment Method</h3>
              <p className="text-xs text-slate-500">Electronic check accounts exhibit 3x churn compared to automatic billing</p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payment_eda} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 50]} />
                <YAxis dataKey="payment_method" type="category" tick={{ fontSize: 11, fill: '#64748B' }} width={110} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (${item.payload.count} subscribers)`, 'Historical Churn Rate']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tech Support Impact */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Protective Impact of Tech Support</h3>
              <p className="text-xs text-slate-500">Customers without Tech Support churn at 41.6% vs 15.2% with active support</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tech_support_eda} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="tech_support" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 50]} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (${item.payload.count} subscribers)`, 'Churn Rate']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Correlation Analysis */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Numerical Feature Correlation with Churn (Pearson r)</h3>
            <p className="text-xs text-slate-500">
              Negative values indicate retention drivers (e.g. Tenure); positive values indicate churn risk factors (e.g. MonthlyCharges).
            </p>
          </div>
          <Layers className="w-5 h-5 text-slate-400" />
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={correlationChartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="feature" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis domain={[-0.4, 0.3]} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                formatter={(val) => [`${val}`, 'Pearson Correlation (r)']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="correlation" fill="#3B82F6" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
