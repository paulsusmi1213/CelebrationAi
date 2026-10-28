'use client';

import React, { useState } from 'react';
import { VendorChecklistItem } from '@/types/event-planner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, 
  HelpCircle, 
  AlertTriangle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  PhoneCall, 
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorChecklistViewProps {
  vendors: VendorChecklistItem[];
  onUpdateVendorStatus: (vendorId: string, status: VendorChecklistItem['status']) => void;
}

export const VendorChecklistView: React.FC<VendorChecklistViewProps> = ({
  vendors,
  onUpdateVendorStatus
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(vendors[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const statusLabels: Record<VendorChecklistItem['status'], { label: string; color: string }> = {
    to_contact: { label: 'To Contact', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' },
    contacted: { label: 'Interviewing', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
    quoted: { label: 'Quote Received', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
    booked: { label: 'Booked & Signed', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Vendor Checklist & Contract Audit</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Prioritized partner checklist with targeted interview questions and contract red flag reminders.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
          {vendors.filter(v => v.status === 'booked').length} of {vendors.length} Vendors Secured
        </div>
      </div>

      {/* Vendor List */}
      <div className="space-y-4">
        {vendors.map((vendor) => {
          const isExpanded = expandedId === vendor.id;
          const statusConfig = statusLabels[vendor.status];

          return (
            <Card 
              key={vendor.id} 
              className="p-5 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        {vendor.vendorRole}
                      </h3>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        Target: {vendor.targetBookingLeadWeeks} weeks prior
                      </span>
                      {vendor.estimatedCostRange && (
                        <span>• Range: <strong className="text-zinc-700 dark:text-zinc-300">{vendor.estimatedCostRange}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={vendor.status}
                    onChange={(e) => onUpdateVendorStatus(vendor.id, e.target.value as VendorChecklistItem['status'])}
                    aria-label={`Update status for ${vendor.vendorRole}`}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="to_contact">To Contact</option>
                    <option value="contacted">Interviewing</option>
                    <option value="quoted">Quote Received</option>
                    <option value="booked">Booked & Signed</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(vendor.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse vendor details" : "Expand vendor questions and contract checklist"}
                    className="p-1.5 h-8 w-8 rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Collapsible Questions & Contract Reminders */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                  {/* Probing Questions */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Essential Consultation Questions
                    </h4>
                    <ul className="space-y-1.5">
                      {vendor.questionsToAsk.map((q, idx) => (
                        <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Q{idx + 1}:</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contract Review Reminders */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Contract Fine-Print Gotchas & Protection
                    </h4>
                    <ul className="space-y-1.5">
                      {vendor.contractReviewReminders.map((reminder, idx) => (
                        <li key={idx} className="text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2 bg-rose-50/70 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                          <span className="font-bold text-rose-600 shrink-0">⚠ Watch for:</span>
                          <span>{reminder}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

