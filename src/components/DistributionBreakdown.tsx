import React, { useState, useMemo } from 'react';
import { BarChart3, Plus, ArrowRight } from 'lucide-react';
import { ColumnInfo, FilterResult, FilterRule } from '../types';

interface DistributionBreakdownProps {
  filterResult: FilterResult;
  allRows: Record<string, any>[];
  columns: ColumnInfo[];
  onAddQuickFilter: (column: string, value: string) => void;
}

export const DistributionBreakdown: React.FC<DistributionBreakdownProps> = ({
  filterResult,
  allRows,
  columns,
  onAddQuickFilter,
}) => {
  // Choose categorical or string columns preferentially
  const eligibleColumns = useMemo(
    () => columns.filter((c) => c.type === 'string' || c.distinctValues.length <= 30),
    [columns]
  );

  const [selectedColKey, setSelectedColKey] = useState<string>('');

  const activeColKey = selectedColKey || eligibleColumns[0]?.key || columns[0]?.key || '';

  // Calculate distribution for active column in matching rows
  const distribution = useMemo(() => {
    if (!activeColKey || filterResult.matchCount === 0) return [];

    // Count in matching rows
    const matchCounts = new Map<string, number>();
    for (const row of filterResult.matchingRows) {
      const raw = row[activeColKey];
      const label = raw !== undefined && raw !== null && String(raw).trim() !== ''
        ? String(raw).trim()
        : '(Blank / Empty)';
      matchCounts.set(label, (matchCounts.get(label) || 0) + 1);
    }

    // Count in total dataset for comparison
    const totalCounts = new Map<string, number>();
    for (const row of allRows) {
      const raw = row[activeColKey];
      const label = raw !== undefined && raw !== null && String(raw).trim() !== ''
        ? String(raw).trim()
        : '(Blank / Empty)';
      totalCounts.set(label, (totalCounts.get(label) || 0) + 1);
    }

    return Array.from(matchCounts.entries())
      .map(([value, count]) => {
        const total = totalCounts.get(value) || count;
        const pctOfMatches = (count / filterResult.matchCount) * 100;
        return {
          value,
          matchedCount: count,
          totalDatasetCount: total,
          pctOfMatches: Number(pctOfMatches.toFixed(1)),
        };
      })
      .sort((a, b) => b.matchedCount - a.matchedCount)
      .slice(0, 12); // top 12 groups
  }, [filterResult.matchingRows, filterResult.matchCount, allRows, activeColKey]);

  if (columns.length === 0 || filterResult.matchCount === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 leading-tight">
              Grouped Record Count Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect how the {filterResult.matchCount.toLocaleString()} matched records are distributed across categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Group By:</span>
          <select
            value={activeColKey}
            onChange={(e) => setSelectedColKey(e.target.value)}
            className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {columns.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {distribution.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic">
            No grouped data available for this column.
          </p>
        ) : (
          distribution.map((item) => (
            <div
              key={item.value}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              {/* Category label */}
              <div className="w-full sm:w-48 truncate">
                <span className="text-xs font-semibold text-slate-800" title={item.value}>
                  {item.value}
                </span>
              </div>

              {/* Bar and percentages */}
              <div className="flex-1 flex items-center gap-3">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(2, item.pctOfMatches))}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-mono tabular-nums font-semibold text-slate-700">
                  {item.pctOfMatches}%
                </span>
              </div>

              {/* Exact Counts & Quick Filter Action */}
              <div className="flex items-center justify-end gap-3 shrink-0">
                <span className="text-xs font-mono tabular-nums text-slate-900 font-bold">
                  {item.matchedCount.toLocaleString()}{' '}
                  <span className="text-[11px] font-normal text-slate-400">
                    / {item.totalDatasetCount.toLocaleString()} total
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => onAddQuickFilter(activeColKey, item.value)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-all"
                  title={`Add filter for ${activeColKey} = ${item.value}`}
                >
                  <Plus className="w-3 h-3" />
                  Filter
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
