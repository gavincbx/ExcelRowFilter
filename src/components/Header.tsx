import React from 'react';
import { FileSpreadsheet, Upload, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface HeaderProps {
  fileName?: string;
  onUploadClick: () => void;
  onResetFilters: () => void;
  onLoadSample?: (type: 'full_bv' | 'inc') => void;
  activeFilterCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  onUploadClick,
  onResetFilters,
  activeFilterCount,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
              RowFilter
            </span>
            <span className="text-xs text-slate-500 font-medium block leading-tight">
              Excel Record Count & Summary Dashboard
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Toggle Fullscreen (Press 'F' key)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            <kbd className="hidden lg:inline text-[10px] font-mono font-semibold px-1 py-0.2 bg-slate-200/70 text-slate-600 rounded">
              F
            </kbd>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Filters ({activeFilterCount})
            </button>
          )}

          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{fileName ? 'Change File' : 'Upload Excel'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
