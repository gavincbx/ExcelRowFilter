import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseWorkbookFromFile } from '../utils/excelParser';
import { ParsedWorkbook } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkbookLoaded: (workbook: ParsedWorkbook) => void;
  onLoadSample: (type: 'full_bv' | 'inc') => void;
  currentFileName?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onWorkbookLoaded,
  onLoadSample,
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMsg('Please select a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const buffer = await file.arrayBuffer();
      const workbook = parseWorkbookFromFile(file, buffer);

      if (workbook.sheetNames.length === 0) {
        setErrorMsg('The selected workbook appears to have no readable sheets.');
        setLoading(false);
        return;
      }

      onWorkbookLoaded(workbook);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {currentFileName ? 'Replace Spreadsheet' : 'Upload Excel or CSV File'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports .xlsx, .xls, and .csv files. Processing is 100% private in your browser.
            </p>
          </div>
          {currentFileName && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {loading ? 'Reading spreadsheet data...' : 'Drop your spreadsheet here, or browse files'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Excel (.xlsx, .xls) or CSV files up to 25MB
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}


        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Client-side only: no files are ever sent to an external server.</span>
          {currentFileName && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
