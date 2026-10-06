import React from 'react';
import {
  Plus,
  Trash2,
  Filter,
  Check,
  ChevronDown,
  Bookmark,
  BookmarkPlus,
  RotateCcw,
} from 'lucide-react';
import { ColumnInfo, FilterOperator, FilterPreset, FilterRule, MatchMode } from '../types';
import { PresetManager } from './PresetManager';

interface FilterBuilderProps {
  columns: ColumnInfo[];
  rules: FilterRule[];
  matchMode: MatchMode;
  presets: FilterPreset[];
  activePresetId?: string | null;
  activePresetName?: string | null;
  onRulesChange: (rules: FilterRule[]) => void;
  onMatchModeChange: (mode: MatchMode) => void;
  onAddRule: () => void;
  onClearAll: () => void;
  onOpenSavePresetModal: () => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals (=)',
  not_equals: 'Does not equal (≠)',
  contains: 'Contains',
  not_contains: 'Does not contain',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  greater_than: 'Greater than (>)',
  greater_than_or_equal: 'Greater or equal (≥)',
  less_than: 'Less than (<)',
  less_than_or_equal: 'Less or equal (≤)',
  between: 'Between (range)',
  is_empty: 'Is Blank / Empty',
  is_not_empty: 'Is Not Blank',
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  columns,
  rules,
  matchMode,
  presets,
  activePresetId,
  activePresetName,
  onRulesChange,
  onMatchModeChange,
  onAddRule,
  onClearAll,
  onOpenSavePresetModal,
  onApplyPreset,
  onDeletePreset,
}) => {
  const updateRule = (id: string, patch: Partial<FilterRule>) => {
    onRulesChange(
      rules.map((rule) => {
        if (rule.id === id) {
          const updated = { ...rule, ...patch };
          // If column changed, reset value or pick appropriate defaults
          if (patch.column && patch.column !== rule.column) {
            const newColInfo = columns.find((c) => c.key === patch.column);
            if (newColInfo?.type === 'number') {
              updated.operator = 'greater_than';
              updated.value = '';
            } else {
              updated.operator = 'equals';
              updated.value = '';
            }
          }
          return updated;
        }
        return rule;
      })
    );
  };

  const removeRule = (id: string) => {
    onRulesChange(rules.filter((rule) => rule.id !== id));
  };

  const hasCompleteRules = rules.some(
    (r) =>
      r.column &&
      (r.operator === 'is_empty' ||
        r.operator === 'is_not_empty' ||
        (r.value !== undefined && r.value.trim() !== ''))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Top Header of Filter Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                Row Filter Conditions
              </h2>
              {activePresetName && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Preset: {activePresetName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify criteria to count matching rows in real time, or load a saved preset.
            </p>
          </div>
        </div>

        {/* Filter Controls, Presets & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector Dropdown */}
          <PresetManager
            presets={presets}
            columns={columns}
            currentRules={rules}
            currentMatchMode={matchMode}
            onApplyPreset={onApplyPreset}
            onDeletePreset={onDeletePreset}
            onOpenSaveModal={onOpenSavePresetModal}
            activePresetId={activePresetId}
          />

          {/* Quick Save as Preset Button */}
          {hasCompleteRules && (
            <button
              type="button"
              onClick={onOpenSavePresetModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Save current filters as a reusable preset"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-emerald-700" />
              Save as Preset
            </button>
          )}

          {/* AND / OR Match Mode Toggle */}
          {rules.length > 1 && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => onMatchModeChange('and')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  matchMode === 'and'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Match ALL (AND)
              </button>
              <button
                type="button"
                onClick={() => onMatchModeChange('or')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  matchMode === 'or'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Match ANY (OR)
              </button>
            </div>
          )}

          {rules.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 font-medium transition-colors"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={onAddRule}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="mt-4 space-y-3">
        {rules.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-xs font-medium text-slate-600">
              No filters applied yet. Showing all rows.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Add Rule&quot; to build criteria, or choose a pre-saved setup from &quot;Presets&quot;.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onAddRule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Filter Rule
              </button>
              {presets.length > 0 && (
                <button
                  type="button"
                  onClick={() => onApplyPreset(presets[0])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                  Load &quot;{presets[0].name}&quot;
                </button>
              )}
            </div>
          </div>
        ) : (
          rules.map((rule, idx) => {
            const selectedCol = columns.find((c) => c.key === rule.column);
            const isNoValueOp = rule.operator === 'is_empty' || rule.operator === 'is_not_empty';
            const isBetween = rule.operator === 'between';

            return (
              <div
                key={rule.id}
                className="flex flex-col md:flex-row md:items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 transition-all hover:border-slate-300"
              >
                {/* Index & Logic Indicator */}
                <div className="flex items-center justify-between md:justify-start gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 w-12 text-left">
                    {idx === 0 ? 'Where' : matchMode.toUpperCase()}
                  </span>
                </div>

                {/* Column Selector */}
                <div className="flex-1 min-w-[160px]">
                  <select
                    value={rule.column}
                    onChange={(e) => updateRule(rule.id, { column: e.target.value })}
                    className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    {columns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator Selector */}
                <div className="w-full md:w-48 shrink-0">
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, { operator: e.target.value as FilterOperator })
                    }
                    className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                      <option key={op} value={op}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Input */}
                <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                  {isNoValueOp ? (
                    <div className="w-full px-3 py-1.5 text-xs text-slate-400 bg-slate-100 rounded-lg italic">
                      No value input needed for this condition
                    </div>
                  ) : isBetween ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        placeholder="Min / Start"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        className="w-1/2 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                      <span className="text-xs text-slate-400 font-medium">to</span>
                      <input
                        type="text"
                        placeholder="Max / End"
                        value={rule.valueSecondary || ''}
                        onChange={(e) => updateRule(rule.id, { valueSecondary: e.target.value })}
                        className="w-1/2 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={
                          selectedCol?.type === 'number'
                            ? `e.g. ${selectedCol.minNumber ?? 100}`
                            : 'Filter value...'
                        }
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />

                      {/* Dropdown of distinct suggestions if column has them */}
                      {selectedCol && selectedCol.distinctValues.length > 0 && (
                        <div className="relative group shrink-0">
                          <button
                            type="button"
                            className="px-2 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 whitespace-nowrap"
                            title="Pick from existing values in this column"
                          >
                            <span>Pick Value</span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          <div className="hidden group-hover:block group-focus-within:block absolute right-0 top-full mt-1 w-56 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-1">
                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Common Values ({selectedCol.distinctValues.length})
                            </div>
                            {selectedCol.distinctValues.map((dv) => (
                              <button
                                key={dv.value}
                                type="button"
                                onClick={() => updateRule(rule.id, { value: dv.value })}
                                className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded flex items-center justify-between gap-2"
                              >
                                <span className="truncate">{dv.value}</span>
                                <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                                  ({dv.count})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Rule Button */}
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors self-end md:self-center shrink-0"
                  title="Remove this rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
