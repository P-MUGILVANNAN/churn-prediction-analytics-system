import React, { useState, useEffect } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Check,
  Calendar
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

export default function RetentionRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    api.getRetentionRecommendations()
      .then(res => {
        setRecommendations(res);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleToggleStatus = (id) => {
    setRecommendations(prev =>
      prev.map(r => r.id === id ? { ...r, status: r.status === 'Pending' ? 'Actioned' : 'Pending' } : r)
    );
  };

  const filtered = recommendations.filter(r =>
    priorityFilter === 'All' ? true : r.priority === priorityFilter
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Retention Recommendation Engine</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rule-based decision-support system synthesizing contract constraints, support gaps, and ML risk scores.
        </p>
      </div>

      {/* Decision Support Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Decision-Support Notice:</strong> Recommendations represent data-driven suggestions to assist account managers. Offer uptake and final churn prevention depend on customer sentiment and campaign execution.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-700">Filter by Priority:</span>
          <div className="flex space-x-1.5">
            {['All', 'Urgent', 'High', 'Medium'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  priorityFilter === p
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> Prescribed Interventions
        </span>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Prescribed Intervention</th>
                <th className="py-3 px-4">Underlying Rationale</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    Loading retention recommendations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No recommendations match the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.customer_id}</td>
                    <td className="py-3.5 px-4">
                      <RiskBadge tier={r.risk_tier} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : r.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">{r.primary_recommendation}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">{r.rationale}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{r.suggested_follow_up_date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(r.id)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          r.status === 'Actioned'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {r.status === 'Actioned' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Actioned</span>
                          </>
                        ) : (
                          <span>Pending</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
