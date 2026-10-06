import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ColumnInfo, FilterResult, FilterRule } from '../types';
import { exportRowsToExcel, exportRowsToCsv } from '../utils/excelParser';

interface RecordsTableProps {
  filterResult: FilterResult;
  columns: ColumnInfo[];
  activeRules: FilterRule[];
  sheetName: string;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  filterResult,
  columns,
  activeRules,
  sheetName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedData, setCopiedData] = useState(false);

  // In-table search filter
  const searchedRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return filterResult.matchingRows;
    }
    const lower = searchTerm.toLowerCase();
    return filterResult.matchingRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lower)
      )
    );
  }, [filterResult.matchingRows, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortCol) return searchedRows;

    return [...searchedRows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null || valA === '') return 1;
      if (valB === undefined || valB === null || valB === '') return -1;

      const numA = Number(String(valA).replace(/[\$,%]/g, ''));
      const numB = Number(String(valB).replace(/[\$,%]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedRows, sortCol, sortDir]);

  // Reset to page 1 on search or sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortCol, sortDir, pageSize, filterResult.matchingRows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const toggleSort = (colKey: string) => {
    if (sortCol === colKey) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const handleExportExcel = () => {
    const filename = `${sheetName.replace(/\s+/g, '_')}_filtered_${filterResult.matchCount}_rows.xlsx`;
    exportRowsToExcel(filterResult.matchingRows, filename);
  };

  const handleExportCsv = () => {
    const filename = `${sheetName.replace(/\s+/g, '_')}_filtered_${filterResult.matchCount}_rows.csv`;
    exportRowsToCsv(filterResult.matchingRows, filename);
  };

  const handleCopyTsv = () => {
    if (filterResult.matchingRows.length === 0) return;
    const headers = columns.map((c) => c.key);
    const lines = [headers.join('\t')];
    for (const row of filterResult.matchingRows) {
      lines.push(headers.map((h) => String(row[h] ?? '')).join('\t'));
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  // Helper to check if a column has an active filter
  const activeColSet = useMemo(() => {
    return new Set(activeRules.map((r) => r.column));
  }, [activeRules]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 leading-tight">
              Matching Records Data Grid
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing{' '}
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {sortedRows.length.toLocaleString()}
              </span>{' '}
              matching {sortedRows.length === 1 ? 'record' : 'records'}
              {searchTerm && ` (filtered from ${filterResult.matchCount})`}
            </p>
          </div>
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* In-table Search */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in matched rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          {/* Copy TSV */}
          <button
            type="button"
            onClick={handleCopyTsv}
            disabled={filterResult.matchCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40"
            title="Copy matched data to paste directly into Excel"
          >
            {copiedData ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{copiedData ? 'Copied TSV' : 'Copy All'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filterResult.matchCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap disabled:opacity-40"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filterResult.matchCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs whitespace-nowrap disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Table Scroller */}
      <div className="overflow-x-auto max-h-[520px] divide-y divide-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-xs text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">
                #
              </th>
              {columns.map((col) => {
                const isFiltered = activeColSet.has(col.key);
                const isSorted = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors select-none whitespace-nowrap ${
                      col.type === 'number' ? 'text-right' : 'text-left'
                    } ${isFiltered ? 'text-emerald-800 bg-emerald-50/60' : ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.type === 'number' ? 'justify-end w-full' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 px-4 text-center text-slate-400 italic text-xs"
                >
                  {searchTerm
                    ? 'No matching records found for your search term.'
                    : 'No records matched the filter criteria.'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => {
                const globalRowNumber = startIndex + rowIdx + 1;
                return (
                  <tr
                    key={rowIdx}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono tabular-nums text-[11px]">
                      {globalRowNumber}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.key];
                      const isFilteredCol = activeColSet.has(col.key);
                      const isNum = col.type === 'number';

                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-3 whitespace-nowrap truncate max-w-xs text-slate-700 ${
                            isNum ? 'text-right font-mono tabular-nums' : 'text-left'
                          } ${isFilteredCol ? 'font-medium text-emerald-950 bg-emerald-50/20' : ''}`}
                        >
                          {val !== undefined && val !== null && String(val) !== '' ? (
                            String(val)
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Page <strong className="font-mono tabular-nums text-slate-900">{currentPage}</strong> of{' '}
            <strong className="font-mono tabular-nums text-slate-900">{totalPages}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
