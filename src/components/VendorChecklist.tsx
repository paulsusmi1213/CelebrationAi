'use client';

import React, { useState } from 'react';
import { VendorItem, Currency } from '@/types/event';
import { 
  Briefcase, 
  HelpCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check 
} from 'lucide-react';

interface VendorChecklistProps {
  vendors: VendorItem[];
  currency: Currency;
  onUpdateVendorStatus: (vendorId: string, newStatus: VendorItem['status']) => void;
}

export const VendorChecklist: React.FC<VendorChecklistProps> = ({
  vendors,
  currency,
  onUpdateVendorStatus,
}) => {
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(vendors[0]?.id || null);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedVendorId((prev) => (prev === id ? null : id));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const getStatusBadge = (status: VendorItem['status']) => {
    switch (status) {
      case 'BOOKED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'CONTACTED':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
      case 'RESEARCHING':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-fuchsia-600" aria-hidden="true" />
              Prioritized Vendor Acquisition & Contract Guide
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Targeted consultation interview questions and contract safety alerts.
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {vendors.filter((v) => v.status === 'BOOKED').length} of {vendors.length} Vendors Secured
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {vendors.map((vendor) => {
          const isExpanded = expandedVendorId === vendor.id;

          return (
            <div
              key={vendor.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {vendor.vendorType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(
                        vendor.status
                      )}`}
                    >
                      {vendor.status}
                    </span>
                    {vendor.priority === 'CRITICAL' && (
                      <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Allocation: {currency} {vendor.estimatedCost.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    id={`vendor-status-${vendor.id}`}
                    value={vendor.status}
                    onChange={(e) => onUpdateVendorStatus(vendor.id, e.target.value as VendorItem['status'])}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="RESEARCHING">Researching</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="BOOKED">Booked</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => toggleExpand(vendor.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      Consultation Questions to Ask
                    </h4>
                    <div className="space-y-2">
                      {vendor.questionsToAsk.map((q, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <span className="font-medium">
                            <span className="text-indigo-600 dark:text-indigo-400 mr-1.5">Q{idx + 1}:</span>
                            {q}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(q)}
                            className="text-slate-400 hover:text-indigo-600 p-1 shrink-0 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedQuestion === q ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {vendor.contractWatchouts && vendor.contractWatchouts.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Contract Watchouts & Fine Print
                      </h4>
                      <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                        {vendor.contractWatchouts.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

