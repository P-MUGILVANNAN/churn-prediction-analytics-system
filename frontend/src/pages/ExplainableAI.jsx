import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BarChart2,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function ExplainableAI() {
  const [globalXai, setGlobalXai] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGlobalExplanations()
      .then(res => {
        setGlobalXai(res);
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

  if (!globalXai) return null;

  const chartData = globalXai.top_features.map(f => ({
    feature: f.display_name,
    importance: f.importance,
    direction: f.direction,
    fillColor: f.direction === 'Increases Risk' ? '#EF4444' : '#10B981'
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Explainable AI (SHAP Framework)</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cooperative game-theoretic Shapley Additive exPlanations for transparent, interpretable machine learning.
        </p>
      </div>

      {/* Methodological Guidance Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold">Interpreting Explainability & Causation Notice</p>
          <p className="text-blue-800 leading-relaxed">
            SHAP attribute values represent additive contributions of each feature to the model log-odds relative to the base dataset expectation. While high SHAP values highlight statistical predictive importance, they do not establish direct empirical causation. Retention interventions should be validated via randomized control trials or targeted A/B campaigns.
          </p>
        </div>
      </div>

      {/* Global Feature Importance Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Global Feature Importance (Mean |SHAP|)</h2>
            <p className="text-xs text-slate-500">
              Ranking the highest impact predictors across the entire customer base
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Increases Churn Risk</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Protective Factor</span>
            </span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 140, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Mean |SHAP Value|', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: '#1E293B' }} />
              <Tooltip
                formatter={(val, name, item) => [`${val} (${item.payload.direction})`, 'Mean |SHAP| Impact']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="importance" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Influence Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80">
          <h3 className="text-base font-bold text-slate-900">Detailed Driver Attribution Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">Understanding why features swing customer risk profiles</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">Mean |SHAP|</th>
                <th className="py-3 px-4">Impact Direction</th>
                <th className="py-3 px-4">Business Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {globalXai.top_features.map((f) => (
                <tr key={f.rank} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{f.rank}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{f.display_name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600">{f.importance.toFixed(4)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      f.direction === 'Increases Risk'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {f.direction}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {f.display_name.includes('Contract')
                      ? 'Month-to-month contracts have negligible switching cost, dramatically multiplying churn risk.'
                      : f.display_name.includes('Tenure')
                      ? 'Higher tenure reflects brand loyalty and embedded switching barriers, strongly dampening churn.'
                      : f.display_name.includes('Monthly')
                      ? 'Higher price points increase bill shock and price-comparison sensitivity.'
                      : f.display_name.includes('Security') || f.display_name.includes('Support')
                      ? 'Absence of technical peace-of-mind amplifies frustration during service disruptions.'
                      : 'High behavioral impact in multivariate tree splits.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
