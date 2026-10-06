import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, ChevronDown, Trash2, Check, Plus, Sparkles, Layers } from 'lucide-react';
import { ColumnInfo, FilterPreset, FilterRule, MatchMode } from '../types';
import { isPresetApplicable } from '../utils/presetStorage';

interface PresetManagerProps {
  presets: FilterPreset[];
  columns: ColumnInfo[];
  currentRules: FilterRule[];
  currentMatchMode: MatchMode;
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenSaveModal: () => void;
  activePresetId?: string | null;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  columns,
  currentRules,
  currentMatchMode,
  onApplyPreset,
  onDeletePreset,
  onOpenSaveModal,
  activePresetId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableColKeys = columns.map((c) => c.key);

  const hasValidCurrentRules = currentRules.some(
    (r) =>
      r.column &&
      (r.operator === 'is_empty' ||
        r.operator === 'is_not_empty' ||
        (r.value !== undefined && r.value.trim() !== ''))
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Split into applicable vs others
  const applicablePresets = presets.filter((p) =>
    isPresetApplicable(p, availableColKeys)
  );
  const otherPresets = presets.filter(
    (p) => !isPresetApplicable(p, availableColKeys)
  );

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
          isOpen
            ? 'bg-slate-100 text-slate-900 border-slate-300'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
        <span>Presets</span>
        {presets.length > 0 && (
          <span className="text-[11px] font-mono tabular-nums text-slate-500 font-semibold">
            ({presets.length})
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header & Quick Save */}
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Filter Presets
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                Save & load reusable filter sets
              </span>
            </div>

            <button
              type="button"
              disabled={!hasValidCurrentRules}
              onClick={() => {
                setIsOpen(false);
                onOpenSaveModal();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                hasValidCurrentRules
                  ? 'Save current filter conditions as a new preset'
                  : 'Add at least one complete filter condition to save a preset'
              }
            >
              <Plus className="w-3 h-3" />
              Save Current
            </button>
          </div>

          {/* Presets List */}
          <div className="max-h-72 overflow-y-auto py-1 space-y-1">
            {presets.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400 italic">
                No filter presets saved yet.
              </div>
            ) : (
              <>
                {applicablePresets.length > 0 && (
                  <div className="px-2 pt-1 pb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Applicable to Current Sheet ({applicablePresets.length})
                    </span>
                  </div>
                )}

                {applicablePresets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`group flex items-start justify-between gap-2 p-2 rounded-lg transition-colors border ${
                        isActive
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          setIsOpen(false);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {preset.name}
                          </span>
                          {preset.isSystem && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              Built-in
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Metadata rule summary */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{preset.rules.length} rule{preset.rules.length > 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span className="font-semibold text-slate-600">
                            {preset.matchMode.toUpperCase()}
                          </span>
                          {preset.sheetName && (
                            <>
                              <span>·</span>
                              <span className="truncate">{preset.sheetName}</span>
                            </>
                          )}
                        </div>

                        {/* Condition preview line */}
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                          {preset.rules.map((r) => `${r.column}: ${r.value || r.operator}`).join(' | ')}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onApplyPreset(preset);
                            setIsOpen(false);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Apply
                        </button>
                        {!preset.isSystem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePreset(preset.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {otherPresets.length > 0 && (
                  <>
                    <div className="px-2 pt-3 pb-1 border-t border-slate-100 mt-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Other Sheet Presets ({otherPresets.length})
                      </span>
                    </div>
                    {otherPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50/50 opacity-60 text-slate-600"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-slate-700 block truncate">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Requires different columns ({preset.sheetName || 'other format'})
                          </span>
                        </div>
                        {!preset.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
