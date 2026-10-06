import * as XLSX from 'xlsx';
import { ColumnInfo, ColumnType, ParsedSheet, ParsedWorkbook } from '../types';

export function parseWorkbookFromFile(
  file: File,
  buffer: ArrayBuffer
): ParsedWorkbook {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const sheets: Record<string, ParsedSheet> = {};

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Read rows as array of JSON objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      raw: false, // formatted strings or dates
    });

    // Detect all column headers from rows
    const headerSet = new Set<string>();
    for (const row of rawRows) {
      Object.keys(row).forEach((key) => headerSet.add(key));
    }
    const headers = Array.from(headerSet);

    // Compute column metadata
    const columns: ColumnInfo[] = headers.map((key) => {
      let numericCount = 0;
      let dateCount = 0;
      let boolCount = 0;
      let emptyCount = 0;
      let minNum = Infinity;
      let maxNum = -Infinity;
      const valMap = new Map<string, number>();

      for (const row of rawRows) {
        const val = row[key];
        if (val === undefined || val === null || val === '') {
          emptyCount++;
          continue;
        }

        const strVal = String(val).trim();
        valMap.set(strVal, (valMap.get(strVal) || 0) + 1);

        // Numeric check
        const numVal = Number(strVal.replace(/[\$,]/g, ''));
        if (!isNaN(numVal) && strVal !== '') {
          numericCount++;
          if (numVal < minNum) minNum = numVal;
          if (numVal > maxNum) maxNum = numVal;
        }

        // Date check
        if (val instanceof Date || (!isNaN(Date.parse(strVal)) && strVal.length >= 8 && /\d/.test(strVal))) {
          dateCount++;
        }

        // Boolean check
        const lower = strVal.toLowerCase();
        if (lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no') {
          boolCount++;
        }
      }

      const totalFilled = rawRows.length - emptyCount;
      let colType: ColumnType = 'string';

      if (totalFilled > 0) {
        if (numericCount / totalFilled > 0.8) {
          colType = 'number';
        } else if (dateCount / totalFilled > 0.8) {
          colType = 'date';
        } else if (boolCount / totalFilled > 0.8) {
          colType = 'boolean';
        }
      }

      // Sort distinct values by highest frequency
      const distinctSorted = Array.from(valMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

      return {
        key,
        label: key,
        type: colType,
        distinctValues: distinctSorted,
        minNumber: minNum !== Infinity ? minNum : undefined,
        maxNumber: maxNum !== -Infinity ? maxNum : undefined,
        hasEmpty: emptyCount > 0,
      };
    });

    sheets[sheetName] = {
      name: sheetName,
      columns,
      rows: rawRows,
      totalRows: rawRows.length,
    };
  }

  const initialSheet = sheetNames[0] || '';

  return {
    fileName: file.name,
    sheetNames,
    activeSheetName: initialSheet,
    sheets,
  };
}

export function exportRowsToExcel(
  rows: Record<string, any>[],
  fileName: string = 'filtered_records.xlsx'
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data');
  XLSX.writeFile(workbook, fileName);
}

export function exportRowsToCsv(
  rows: Record<string, any>[],
  fileName: string = 'filtered_records.csv'
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
