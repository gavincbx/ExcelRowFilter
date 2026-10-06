import React from 'react';
import { TableProperties } from 'lucide-react';
import { ParsedSheet } from '../types';

interface SheetSelectorProps {
  sheetNames: string[];
  activeSheet: string;
  sheets: Record<string, ParsedSheet>;
  onSelectSheet: (name: string) => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  sheetNames,
  activeSheet,
  sheets,
  onSelectSheet,
}) => {
  if (sheetNames.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 pb-2 mb-4 overflow-x-auto">
      <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1.5 shrink-0">
        <TableProperties className="w-3.5 h-3.5" />
        Sheets:
      </span>
      {sheetNames.map((name) => {
        const isActive = name === activeSheet;
        const count = sheets[name]?.totalRows || 0;
        return (
          <button
            key={name}
            onClick={() => onSelectSheet(name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{name}</span>
            <span
              className={`text-[11px] font-mono tabular-nums ${
                isActive ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              ({count.toLocaleString()} rows)
            </span>
          </button>
        );
      })}
    </div>
  );
};
