import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUploadModal } from './components/FileUploadModal';
import { SavePresetModal } from './components/SavePresetModal';
import { SheetSelector } from './components/SheetSelector';
import { FilterBuilder } from './components/FilterBuilder';
import { SummaryDashboard } from './components/SummaryDashboard';
import { DistributionBreakdown } from './components/DistributionBreakdown';
import { RecordsTable } from './components/RecordsTable';
import { FilterPreset, FilterRule, MatchMode, ParsedWorkbook } from './types';
import { filterRows } from './utils/filterEngine';
import { createSampleWorkbook } from './utils/sampleData';
import {
  getSavedPresets,
  saveUserPreset,
  deleteUserPreset,
} from './utils/presetStorage';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Check, Bookmark } from 'lucide-react';

export default function App() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>('and');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Presets state
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed', err);
    }
  };

  // Keyboard shortcut listener: 'f' toggles fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypress if focus is inside an input, textarea, select, or contenteditable element
      const active = document.activeElement;
      const isEditing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active as HTMLElement)?.isContentEditable;

      if (isEditing) return;

      // Check for 'f' or 'F' without modifier keys (e.g., allow Ctrl+F browser search to work normally)
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load presets on initial load
  useEffect(() => {
    setPresets(getSavedPresets());
  }, []);

  // Show temporary toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };



  const handleLoadSample = (type: 'full_bv' | 'inc') => {
    const sample = createSampleWorkbook(type);
    setWorkbook(sample);
    setActiveSheetName(sample.activeSheetName);

    if (type === 'full_bv') {
      setRules([
        {
          id: 'rule-fbv-3',
          column: 'Kitting Code',
          operator: 'not_contains',
          value: 'E',
        },
        {
          id: 'rule-fbv-4',
          column: 'Kitting Name',
          operator: 'not_contains',
          value: 'INC',
        },
      ]);
      setMatchMode('and');
      setActivePresetId('preset-full-bv');
      setActivePresetName('Full BV Filter');
      triggerToast('Loaded Full BV with active filters');
    } else {
      setRules([
        {
          id: 'rule-inc-3',
          column: 'Kitting Code',
          operator: 'not_contains',
          value: 'E',
        },
        {
          id: 'rule-inc-4',
          column: 'Kitting Name',
          operator: 'contains',
          value: 'INC',
        },
      ]);
      setMatchMode('and');
      setActivePresetId('preset-inc');
      setActivePresetName('INC Filter');
      triggerToast('Loaded INC with active filters');
    }
  };

  const handleWorkbookLoaded = (newWb: ParsedWorkbook) => {
    setWorkbook(newWb);
    setActiveSheetName(newWb.activeSheetName);
    setRules([]); // Clear rules when new file is uploaded
    setActivePresetId(null);
    setActivePresetName(null);
  };

  const currentSheet = useMemo(() => {
    if (!workbook || !activeSheetName) return null;
    return workbook.sheets[activeSheetName] || null;
  }, [workbook, activeSheetName]);

  const filterResult = useMemo(() => {
    if (!currentSheet) {
      return {
        matchingRows: [],
        matchingIndices: new Set<number>(),
        totalRows: 0,
        matchCount: 0,
        unmatchedCount: 0,
        matchPercentage: 0,
        activeRulesCount: 0,
      };
    }
    return filterRows(currentSheet.rows, rules, matchMode);
  }, [currentSheet, rules, matchMode]);

  const handleRulesChange = (newRules: FilterRule[]) => {
    setRules(newRules);
    // If user modifies rules, clear active preset badge
    if (activePresetName) {
      setActivePresetId(null);
      setActivePresetName(null);
    }
  };

  const handleMatchModeChange = (mode: MatchMode) => {
    setMatchMode(mode);
    if (activePresetName) {
      setActivePresetId(null);
      setActivePresetName(null);
    }
  };

  const handleAddRule = () => {
    if (!currentSheet || currentSheet.columns.length === 0) return;
    const defaultCol = currentSheet.columns[0];
    const newRule: FilterRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      column: defaultCol.key,
      operator: defaultCol.type === 'number' ? 'greater_than' : 'equals',
      value: '',
    };
    handleRulesChange([...rules, newRule]);
  };

  const handleClearAllRules = () => {
    setRules([]);
    setActivePresetId(null);
    setActivePresetName(null);
  };

  const handleAddQuickFilter = (column: string, value: string) => {
    const newRule: FilterRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      column,
      operator: 'equals',
      value,
    };
    handleRulesChange([...rules, newRule]);
  };

  // Preset operations
  const handleSavePreset = (name: string) => {
    if (!currentSheet) return;
    const created = saveUserPreset({
      name,
      rules: JSON.parse(JSON.stringify(rules)),
      matchMode,
      sheetName: activeSheetName,
    });
    setPresets(getSavedPresets());
    setActivePresetId(created.id);
    setActivePresetName(created.name);
    triggerToast(`Preset "${name}" saved successfully!`);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    // Deep copy rules to allow independent modification
    const copiedRules: FilterRule[] = preset.rules.map((r, i) => ({
      ...r,
      id: `rule-preset-${Date.now()}-${i}`,
    }));
    setRules(copiedRules);
    setMatchMode(preset.matchMode);
    setActivePresetId(preset.id);
    setActivePresetName(preset.name);
    triggerToast(`Loaded preset "${preset.name}" (${copiedRules.length} rules)`);
  };

  const handleDeletePreset = (presetId: string) => {
    deleteUserPreset(presetId);
    setPresets(getSavedPresets());
    if (activePresetId === presetId) {
      setActivePresetId(null);
      setActivePresetName(null);
    }
    triggerToast('Preset removed');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        fileName={workbook?.fileName}
        onUploadClick={() => setIsUploadModalOpen(true)}
        onResetFilters={handleClearAllRules}
        onLoadSample={handleLoadSample}
        activeFilterCount={rules.length}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active File Banner / Status */}
        {workbook && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {workbook.fileName}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">·</span>
                  <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
                    {currentSheet?.totalRows.toLocaleString() || 0} total rows
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>Active Sheet: <strong className="text-slate-700">{activeSheetName}</strong></span>
                  <span>·</span>
                  <span>{currentSheet?.columns.length || 0} columns detected</span>
                  {activePresetName && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                        <Bookmark className="w-3 h-3 text-emerald-600" />
                        {activePresetName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Upload Different File
              </button>
            </div>
          </div>
        )}

        {/* Multi-Sheet Selector Tabs if applicable */}
        {workbook && workbook.sheetNames.length > 1 && (
          <SheetSelector
            sheetNames={workbook.sheetNames}
            activeSheet={activeSheetName}
            sheets={workbook.sheets}
            onSelectSheet={(sheet) => {
              setActiveSheetName(sheet);
              setRules([]); // reset filters when switching sheets
              setActivePresetId(null);
              setActivePresetName(null);
            }}
          />
        )}

        {currentSheet ? (
          <div>
            {/* Filter Criteria Builder with Presets Integration */}
            <FilterBuilder
              columns={currentSheet.columns}
              rules={rules}
              matchMode={matchMode}
              presets={presets}
              activePresetId={activePresetId}
              activePresetName={activePresetName}
              onRulesChange={handleRulesChange}
              onMatchModeChange={handleMatchModeChange}
              onAddRule={handleAddRule}
              onClearAll={handleClearAllRules}
              onOpenSavePresetModal={() => setIsSavePresetModalOpen(true)}
              onApplyPreset={handleApplyPreset}
              onDeletePreset={handleDeletePreset}
            />

            {/* Summary Dashboard KPIs */}
            <SummaryDashboard
              filterResult={filterResult}
              columns={currentSheet.columns}
              sheetName={activeSheetName}
            />

            {/* Grouped Breakdown / Distribution of Matched Records */}
            <DistributionBreakdown
              filterResult={filterResult}
              allRows={currentSheet.rows}
              columns={currentSheet.columns}
              onAddQuickFilter={handleAddQuickFilter}
            />

            {/* Records Data Table with Pagination & Export */}
            <RecordsTable
              filterResult={filterResult}
              columns={currentSheet.columns}
              activeRules={rules}
              sheetName={activeSheetName}
            />
          </div>
        ) : (
          /* Empty State if no file uploaded */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs my-8 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload an Excel Spreadsheet to Begin
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Select any .xlsx, .xls or .csv file to immediately count rows based on custom conditions and view the summary dashboard.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                Upload Excel File
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('full_bv')}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Client-Side Processing · No files leave your device</span>
          </div>
        </div>
      </footer>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onWorkbookLoaded={handleWorkbookLoaded}
        onLoadSample={handleLoadSample}
        currentFileName={workbook?.fileName}
      />

      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={isSavePresetModalOpen}
        onClose={() => setIsSavePresetModalOpen(false)}
        onSave={handleSavePreset}
        rules={rules}
        matchMode={matchMode}
        sheetName={activeSheetName}
      />
    </div>
  );
}
