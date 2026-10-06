import React, { useState, useEffect } from 'react';
import { Bookmark, X, Check, Layers } from 'lucide-react';
import { FilterRule, MatchMode } from '../types';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  rules: FilterRule[];
  matchMode: MatchMode;
  sheetName: string;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rules,
  matchMode,
  sheetName,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Suggest a default name based on the first rule
  useEffect(() => {
    if (isOpen) {
      if (rules.length === 1 && rules[0].column) {
        setName(`${rules[0].column}: ${rules[0].value || rules[0].operator}`);
      } else if (rules.length > 1) {
        const first = rules[0];
        setName(`${first.column} + ${rules.length - 1} more (${matchMode.toUpperCase()})`);
      } else {
        setName(`Filter Preset - ${sheetName}`);
      }
      setError(null);
    }
  }, [isOpen, rules, matchMode, sheetName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide a name for this preset.');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Save Filter Conditions as Preset
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. High Value Completed Orders"
              autoFocus
              className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
            {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
          </div>

          {/* Preset Contents Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between font-medium text-slate-700 pb-1.5 border-b border-slate-200/60">
              <span>Conditions to save:</span>
              <span className="font-mono tabular-nums text-slate-900 font-semibold">
                {rules.length} rule{rules.length !== 1 ? 's' : ''} ({matchMode.toUpperCase()})
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
              {rules.map((rule, idx) => (
                <div key={rule.id || idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{rule.column}</span>
                  <span className="text-slate-400">{rule.operator}</span>
                  {rule.value && (
                    <span className="font-mono text-slate-700">&quot;{rule.value}&quot;</span>
                  )}
                  {rule.valueSecondary && (
                    <span className="font-mono text-slate-700">to &quot;{rule.valueSecondary}&quot;</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Save Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
