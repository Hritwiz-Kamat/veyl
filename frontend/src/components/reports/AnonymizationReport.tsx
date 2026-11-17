import React from 'react';
import {
  FileText,
  SlidersHorizontal,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Compass,
  Calendar,
  ShieldAlert,
  Hash,
} from 'lucide-react';
import type { Finding } from '../../types';

interface AnonymizationReportProps {
  findings?: Finding[];
  totalRedactedCount?: number;
  className?: string;
}

interface CategoryStat {
  name: string;
  count: number;
  icon: React.ReactNode;
  bgClass: string;
  barColor: string;
}

export const AnonymizationReport: React.FC<AnonymizationReportProps> = ({
  findings = [],
  totalRedactedCount,
  className = '',
}) => {
  let namesCount = 0;
  let emailsCount = 0;
  let phoneCount = 0;
  let addressesCount = 0;
  let locationsCount = 0;
  let datesCount = 0;
  let idNumbersCount = 0;
  let otherCount = 0;

  if (findings.length > 0) {
    findings.forEach((f) => {
      const type = (f.entity_type || '').toUpperCase();
      if (type.includes('PERSON') || type.includes('NAME')) {
        namesCount++;
      } else if (type.includes('EMAIL')) {
        emailsCount++;
      } else if (type.includes('PHONE')) {
        phoneCount++;
      } else if (type.includes('STREET') || type.includes('ADDRESS')) {
        addressesCount++;
      } else if (
        type.includes('LOCATION') ||
        type.includes('CITY') ||
        type.includes('COUNTRY') ||
        type.includes('STATE') ||
        type.includes('IP')
      ) {
        locationsCount++;
      } else if (type.includes('DATE') || type.includes('TIME')) {
        datesCount++;
      } else if (
        type.includes('ID') ||
        type.includes('SSN') ||
        type.includes('PASSPORT') ||
        type.includes('CARD') ||
        type.includes('SECRET') ||
        type.includes('KEY') ||
        type.includes('TOKEN')
      ) {
        idNumbersCount++;
      } else {
        otherCount++;
      }
    });
  }

  const rawTotal = findings.length;
  const isDemo = rawTotal === 0 && totalRedactedCount === undefined;
  const total = isDemo
    ? 1704
    : (totalRedactedCount !== undefined ? totalRedactedCount : rawTotal);

  const categories: CategoryStat[] = isDemo
    ? [
        {
          name: 'Names',
          count: 1459,
          icon: <User className="w-3.5 h-3.5 text-[#E78B55]" />,
          bgClass: 'bg-[#FEF7F2]',
          barColor: 'bg-[#E78B55]',
        },
        {
          name: 'Emails',
          count: 20,
          icon: <Mail className="w-3.5 h-3.5 text-[#4CAF7D]" />,
          bgClass: 'bg-[#F0FAF4]',
          barColor: 'bg-[#4CAF7D]',
        },
        {
          name: 'Phone',
          count: 35,
          icon: <Phone className="w-3.5 h-3.5 text-[#E5A040]" />,
          bgClass: 'bg-[#FFFBF0]',
          barColor: 'bg-[#E5A040]',
        },
        {
          name: 'Addresses',
          count: 81,
          icon: <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />,
          bgClass: 'bg-[#F5F3FF]',
          barColor: 'bg-[#8B5CF6]',
        },
        {
          name: 'Locations',
          count: 104,
          icon: <Compass className="w-3.5 h-3.5 text-[#6366F1]" />,
          bgClass: 'bg-[#EEF2FF]',
          barColor: 'bg-[#6366F1]',
        },
        {
          name: 'Dates',
          count: 4,
          icon: <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />,
          bgClass: 'bg-[#ECFEFF]',
          barColor: 'bg-[#06B6D4]',
        },
        {
          name: 'ID Numbers',
          count: 1,
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#E05252]" />,
          bgClass: 'bg-[#FEF2F2]',
          barColor: 'bg-[#E05252]',
        },
      ]
    : [
        {
          name: 'Names',
          count: namesCount,
          icon: <User className="w-3.5 h-3.5 text-[#E78B55]" />,
          bgClass: 'bg-[#FEF7F2]',
          barColor: 'bg-[#E78B55]',
        },
        {
          name: 'Emails',
          count: emailsCount,
          icon: <Mail className="w-3.5 h-3.5 text-[#4CAF7D]" />,
          bgClass: 'bg-[#F0FAF4]',
          barColor: 'bg-[#4CAF7D]',
        },
        {
          name: 'Phone',
          count: phoneCount,
          icon: <Phone className="w-3.5 h-3.5 text-[#E5A040]" />,
          bgClass: 'bg-[#FFFBF0]',
          barColor: 'bg-[#E5A040]',
        },
        {
          name: 'Addresses',
          count: addressesCount,
          icon: <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />,
          bgClass: 'bg-[#F5F3FF]',
          barColor: 'bg-[#8B5CF6]',
        },
        {
          name: 'Locations',
          count: locationsCount,
          icon: <Compass className="w-3.5 h-3.5 text-[#6366F1]" />,
          bgClass: 'bg-[#EEF2FF]',
          barColor: 'bg-[#6366F1]',
        },
        {
          name: 'Dates',
          count: datesCount,
          icon: <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />,
          bgClass: 'bg-[#ECFEFF]',
          barColor: 'bg-[#06B6D4]',
        },
        {
          name: 'ID Numbers',
          count: idNumbersCount,
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#E05252]" />,
          bgClass: 'bg-[#FEF2F2]',
          barColor: 'bg-[#E05252]',
        },
        ...(otherCount > 0
          ? [
              {
                name: 'Credentials & Other',
                count: otherCount,
                icon: <Hash className="w-3.5 h-3.5 text-[#3B82F6]" />,
                bgClass: 'bg-[#EFF6FF]',
                barColor: 'bg-[#3B82F6]',
              },
            ]
          : []),
      ];

  const totalSum = categories.reduce((acc, cat) => acc + cat.count, 0) || 1;

  return (
    <aside
      className={`w-full lg:w-80 bg-white border border-[#EAE6DF] rounded-3xl p-6 flex flex-col gap-6 shadow-xs select-none ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#E78B55]" />
          <h2 className="font-serif font-medium text-lg text-[#242424] tracking-tight">
            Anonymization report
          </h2>
        </div>
        <p className="text-xs text-[#6B6560] leading-relaxed">
          We found and redacted{' '}
          <span className="inline-block bg-[#FAF8F5] text-[#242424] font-semibold px-1.5 py-0.5 rounded text-xs border border-[#EAE6DF]">
            {total}
          </span>{' '}
          sensitive items in the content.
        </p>
      </div>

      {/* Detailed Breakdown */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#9C9790] tracking-wider uppercase">
          <SlidersHorizontal className="w-3 h-3 text-[#9C9790]" />
          <span>Detailed Breakdown</span>
        </div>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-[#FAF8F5] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg ${cat.bgClass} flex items-center justify-center shrink-0`}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-[#242424]">{cat.name}</span>
              </div>
              <span className="text-xs font-semibold text-[#242424] font-mono">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution */}
      <div className="flex flex-col gap-2.5 border-t border-[#F0EDE8] pt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#9C9790] tracking-wider uppercase">
          <Clock className="w-3 h-3 text-[#9C9790]" />
          <span>Distribution</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {categories
            .filter((c) => c.count > 0)
            .map((cat) => {
              const pct = Math.max(1, Math.round((cat.count / totalSum) * 100));
              return (
                <div key={cat.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#6B6560]">{cat.name}</span>
                    <span className="text-[#9C9790] font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#EAE6DF]/60">
                    <div
                      className={`h-full ${cat.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-[#F0EDE8] text-center">
        <span className="text-[10px] text-[#9C9790]">
          Verified by <span className="font-medium text-[#6B6560]">RAPIT Privacy Engine</span>
        </span>
      </div>
    </aside>
  );
};
