import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  PhoneCall,
  Mail,
  X
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { api } from '../services/api';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Campaign Form
  const [newCamp, setNewCamp] = useState({
    campaign_name: '',
    target_segment: 'HIGH_RISK_HIGH_VALUE',
    budget: 1500,
    offer_details: '15% Discount on 1-Year renewal + Free cybersecurity suite',
    channel: 'Dedicated Account Manager'
  });

  const fetchCampaigns = () => {
    api.getCampaigns()
      .then(res => {
        setCampaigns(res);
        if (res.length > 0) {
          setSelectedCampaign(res[0]);
          fetchActivities(res[0].id);
        }
        setLoading(false);
      })
      .catch(console.error);
  };

  const fetchActivities = (campId) => {
    api.getCampaignActivities(campId)
      .then(res => setActivities(res))
      .catch(console.error);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = (c) => {
    setSelectedCampaign(c);
    fetchActivities(c.id);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createCampaign(newCamp);
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (err) {
      alert(`Failed to create campaign: ${err.message}`);
    }
  };

  const handleUpdateActivity = async (activityId, newStatus) => {
    try {
      await api.updateCampaignActivity(activityId, newStatus);
      if (selectedCampaign) {
        fetchActivities(selectedCampaign.id);
        fetchCampaigns();
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Retention Campaign Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deploy targeted customer retention programs and track live ROI, outreach outcomes, and saved MRR.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {campaigns.map((c) => {
          const isSelected = selectedCampaign?.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => handleSelectCampaign(c)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {c.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{c.created_at}</span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-2">{c.campaign_name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Target: <strong className="text-slate-800">{c.target_segment}</strong></p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Contacted</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{c.contacted_count || 0}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold">Retained</span>
                  <p className="font-extrabold text-emerald-700 text-sm mt-0.5">{c.retained_count || 0}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-[10px] text-blue-600 uppercase font-semibold">Saved MRR</span>
                  <p className="font-extrabold text-blue-700 text-sm mt-0.5">${c.saved_mrr || 0}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Budget: ${c.budget}</span>
                <span className="font-bold text-emerald-600">ROI: {c.roi_ratio}x ARR</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Activities Tracker for Selected Campaign */}
      {selectedCampaign && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Outreach Activities: {selectedCampaign.campaign_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Offer: {selectedCampaign.offer_details}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              {activities.length} Subscribers Assigned
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Risk Tier</th>
                  <th className="py-3 px-4">Monthly Bill</th>
                  <th className="py-3 px-4">Contract</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Log Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.customer_id}</td>
                    <td className="py-3 px-4">
                      <RiskBadge tier={a.risk_tier} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">${a.monthly_charges.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-600">{a.contract}</td>
                    <td className="py-3 px-4 text-slate-600">{a.outreach_channel}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        a.status === 'Retained' ? 'bg-emerald-100 text-emerald-800' :
                        a.status === 'Churned' ? 'bg-rose-100 text-rose-800' :
                        a.status === 'Offer Sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={a.status}
                        onChange={(e) => handleUpdateActivity(a.id, e.target.value)}
                        className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Offer Sent">Offer Sent</option>
                        <option value="Retained">Retained</option>
                        <option value="Churned">Churned</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Launch Retention Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newCamp.campaign_name}
                  onChange={(e) => setNewCamp({ ...newCamp, campaign_name: e.target.value })}
                  placeholder="e.g., Q4 Fiber Optic Retention Initiative"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Customer Segment *</label>
                <select
                  value={newCamp.target_segment}
                  onChange={(e) => setNewCamp({ ...newCamp, target_segment: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="HIGH_RISK_HIGH_VALUE">High-Risk High-Value</option>
                  <option value="HIGH_RISK_NEW">High-Risk New Customers</option>
                  <option value="UPSELL_CANDIDATE">Upsell & Cross-Sell Candidates</option>
                  <option value="LOYAL_HIGH_VALUE">Loyal High-Value</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Budget ($) *</label>
                <input
                  type="number"
                  value={newCamp.budget}
                  onChange={(e) => setNewCamp({ ...newCamp, budget: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Promotional Offer Details</label>
                <textarea
                  rows="2"
                  value={newCamp.offer_details}
                  onChange={(e) => setNewCamp({ ...newCamp, offer_details: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
