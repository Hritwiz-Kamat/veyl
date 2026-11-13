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
  colorClass: string;
  barColor: string;
}

export const AnonymizationReport: React.FC<AnonymizationReportProps> = ({
  findings = [],
  totalRedactedCount,
  className = '',
}) => {
  // Categorize findings
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
      } else if (type.includes('LOCATION') || type.includes('CITY') || type.includes('COUNTRY') || type.includes('STATE') || type.includes('IP')) {
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
  // If findings are empty (e.g. direct demo view), use fallback sample numbers matching Reference 1 & 2
  const isDemo = rawTotal === 0 && totalRedactedCount === undefined;

  const total = isDemo
    ? 1704
    : (totalRedactedCount !== undefined ? totalRedactedCount : rawTotal);

  const categories: CategoryStat[] = isDemo
    ? [
        {
          name: 'Names',
          count: 1459,
          icon: <User className="w-4 h-4 text-indigo-500" />,
          bgClass: 'bg-indigo-50',
          colorClass: 'text-indigo-500',
          barColor: 'bg-indigo-600',
        },
        {
          name: 'Emails',
          count: 20,
          icon: <Mail className="w-4 h-4 text-emerald-500" />,
          bgClass: 'bg-emerald-50',
          colorClass: 'text-emerald-500',
          barColor: 'bg-emerald-500',
        },
        {
          name: 'Phone',
          count: 35,
          icon: <Phone className="w-4 h-4 text-amber-500" />,
          bgClass: 'bg-amber-50',
          colorClass: 'text-amber-500',
          barColor: 'bg-amber-500',
        },
        {
          name: 'Addresses',
          count: 81,
          icon: <MapPin className="w-4 h-4 text-purple-500" />,
          bgClass: 'bg-purple-50',
          colorClass: 'text-purple-500',
          barColor: 'bg-purple-500',
        },
        {
          name: 'Locations',
          count: 104,
          icon: <Compass className="w-4 h-4 text-purple-600" />,
          bgClass: 'bg-purple-50',
          colorClass: 'text-purple-600',
          barColor: 'bg-purple-600',
        },
        {
          name: 'Dates',
          count: 4,
          icon: <Calendar className="w-4 h-4 text-cyan-500" />,
          bgClass: 'bg-cyan-50',
          colorClass: 'text-cyan-500',
          barColor: 'bg-cyan-500',
        },
        {
          name: 'ID Numbers',
          count: 1,
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
          bgClass: 'bg-rose-50',
          colorClass: 'text-rose-500',
          barColor: 'bg-rose-500',
        },
      ]
    : [
        {
          name: 'Names',
          count: namesCount,
          icon: <User className="w-4 h-4 text-indigo-500" />,
          bgClass: 'bg-indigo-50',
          colorClass: 'text-indigo-500',
          barColor: 'bg-indigo-600',
        },
        {
          name: 'Emails',
          count: emailsCount,
          icon: <Mail className="w-4 h-4 text-emerald-500" />,
          bgClass: 'bg-emerald-50',
          colorClass: 'text-emerald-500',
          barColor: 'bg-emerald-500',
        },
        {
          name: 'Phone',
          count: phoneCount,
          icon: <Phone className="w-4 h-4 text-amber-500" />,
          bgClass: 'bg-amber-50',
          colorClass: 'text-amber-500',
          barColor: 'bg-amber-500',
        },
        {
          name: 'Addresses',
          count: addressesCount,
          icon: <MapPin className="w-4 h-4 text-purple-500" />,
          bgClass: 'bg-purple-50',
          colorClass: 'text-purple-500',
          barColor: 'bg-purple-500',
        },
        {
          name: 'Locations',
          count: locationsCount,
          icon: <Compass className="w-4 h-4 text-purple-600" />,
          bgClass: 'bg-purple-50',
          colorClass: 'text-purple-600',
          barColor: 'bg-purple-600',
        },
        {
          name: 'Dates',
          count: datesCount,
          icon: <Calendar className="w-4 h-4 text-cyan-500" />,
          bgClass: 'bg-cyan-50',
          colorClass: 'text-cyan-500',
          barColor: 'bg-cyan-500',
        },
        {
          name: 'ID Numbers',
          count: idNumbersCount,
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
          bgClass: 'bg-rose-50',
          colorClass: 'text-rose-500',
          barColor: 'bg-rose-500',
        },
        ...(otherCount > 0
          ? [
              {
                name: 'Credentials & Other',
                count: otherCount,
                icon: <Hash className="w-4 h-4 text-blue-500" />,
                bgClass: 'bg-blue-50',
                colorClass: 'text-blue-500',
                barColor: 'bg-blue-500',
              },
            ]
          : []),
      ];

  const totalSum = categories.reduce((acc, cat) => acc + cat.count, 0) || 1;

  return (
    <aside
      className={`w-full lg:w-80 bg-white border border-gray-200/80 rounded-2xl p-6 flex flex-col gap-6 shadow-xs select-none ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" strokeWidth={1.75} />
          <h2 className="font-serif font-bold text-xl text-gray-900 tracking-tight">
            Anonymization report
          </h2>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          We found and redacted{' '}
          <span className="inline-block bg-gray-100 text-gray-800 font-bold px-1.5 py-0.5 rounded text-xs border border-gray-200">
            {total}
          </span>{' '}
          sensitive items in the document.
        </p>
      </div>

      {/* Detailed Breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          <span>Detailed Breakdown</span>
        </div>

        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg ${cat.bgClass} flex items-center justify-center shrink-0`}
                >
                  {cat.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>Distribution</span>
        </div>

        <div className="flex flex-col gap-3">
          {categories
            .filter((c) => c.count > 0)
            .map((cat) => {
              const pct = Math.max(1, Math.round((cat.count / totalSum) * 100));
              return (
                <div key={cat.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">{cat.name}</span>
                    <span className="text-gray-400 font-mono text-[11px]">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
      <div className="mt-auto pt-4 border-t border-gray-100 text-center">
        <span className="text-[11px] text-gray-400">
          Report generated by <span className="font-medium text-gray-500">DataCleanFlow.com</span>
        </span>
      </div>
    </aside>
  );
};
