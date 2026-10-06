import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  SlidersHorizontal,
  Calculator,
  Percent,
  XCircle,
} from 'lucide-react';
import { ColumnInfo, FilterResult } from '../types';

interface SummaryDashboardProps {
  filterResult: FilterResult;
  columns: ColumnInfo[];
  sheetName: string;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  filterResult,
  columns,
  sheetName,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedNumericCol, setSelectedNumericCol] = useState<string>('');

  const numericColumns = useMemo(
    () => columns.filter((c) => c.type === 'number'),
    [columns]
  );

  // Set default numeric column if not selected
  const activeNumericCol = selectedNumericCol || numericColumns[0]?.key || '';

  // Calculate sum, avg, min, max for the active numeric column on matching rows
  const numericStats = useMemo(() => {
    if (!activeNumericCol || filterResult.matchCount === 0) return null;

    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;

    for (const row of filterResult.matchingRows) {
      const raw = row[activeNumericCol];
      if (raw === undefined || raw === null || raw === '') continue;
      const num = Number(String(raw).replace(/[\$,%]/g, ''));
      if (!isNaN(num)) {
        sum += num;
        validCount++;
        if (num < min) min = num;
        if (num > max) max = num;
      }
    }

    if (validCount === 0) return null;

    return {
      sum,
      avg: sum / validCount,
      min: min !== Infinity ? min : 0,
      max: max !== -Infinity ? max : 0,
      count: validCount,
    };
  }, [filterResult.matchingRows, activeNumericCol]);

  const handleCopyCount = () => {
    navigator.clipboard.writeText(String(filterResult.matchCount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAll = filterResult.activeRulesCount === 0;

  return (
    <div className="space-y-4 mb-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Primary Matching Count KPI */}
        <div className="bg-white rounded-xl border-2 border-emerald-600/30 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Matching Records
            </span>
            <button
              onClick={handleCopyCount}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
              title="Copy count to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
              {filterResult.matchCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {filterResult.totalRows.toLocaleString()} rows
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {isAll
                ? 'All rows (no filters)'
                : `${filterResult.activeRulesCount} active condition${
                    filterResult.activeRulesCount > 1 ? 's' : ''
                  }`}
            </span>
            {copied && <span className="text-emerald-600 font-medium">Copied!</span>}
          </div>
        </div>

        {/* Match Percentage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Match Proportion
            </span>
            <Percent className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
              {filterResult.matchPercentage}%
            </span>
            <span className="text-xs text-slate-400 font-medium">of dataset</span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, filterResult.matchPercentage))}%` }}
            />
          </div>
        </div>

        {/* Filtered Out / Non-matching */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Excluded Rows
            </span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
              {filterResult.unmatchedCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">rows filtered out</span>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 truncate">
            {filterResult.totalRows > 0
              ? `${(100 - filterResult.matchPercentage).toFixed(1)}% not meeting criteria`
              : '0 rows'}
          </p>
        </div>

        {/* Sheet Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Sheet
            </span>
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900 truncate block">
              {sheetName}
            </span>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">
              {columns.length} columns detected
            </span>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for instant query & export</span>
          </div>
        </div>
      </div>

      {/* Numeric Aggregation Bar (if dataset has numbers) */}
      {numericColumns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-800">
                Matched Values Aggregate Summary
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Numeric Column:</span>
              <select
                value={activeNumericCol}
                onChange={(e) => setSelectedNumericCol(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {numericColumns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {numericStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Total Sum
                </span>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {numericStats.sum.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Average / Mean
                </span>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {numericStats.avg.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Minimum Value
                </span>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {numericStats.min.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Maximum Value
                </span>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {numericStats.max.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-3 italic">
              No numeric values found in matched records for this column.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
