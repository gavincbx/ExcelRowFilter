import * as XLSX from 'xlsx';
import { ParsedWorkbook } from '../types';
import { parseWorkbookFromFile } from './excelParser';

const CHANNELS = ['App', 'App', 'Web', 'App', 'Retail Store', 'Direct Sales', 'Partner Portal'];
const SALES_PACKAGES = [
  'sales_kitting_clone',
  'sales_kitting_clone',
  'standard_package',
  'sales_kitting_clone',
  'express_bundle',
  'custom_kitting',
];
const KITTING_CODES_WITH_E = ['KT-E101', 'KT-E204', 'KTE-502', 'KT-E09', 'EXP-04', 'KT-E88'];
const KITTING_CODES_WITHOUT_E = ['KT-A101', 'KT-B204', 'KT-C305', 'KT-D401', 'KTC-12', 'KT-S99'];
const KITTING_NAMES_WITH_INC = ['INC Corporate Bundle', 'INC Enterprise Kit', 'INC Hardware Pro', 'INC Starter Kit'];
const KITTING_NAMES_WITHOUT_INC = ['Full BV Standard Kit', 'Full BV Basic', 'Full BV Mobile Pack', 'Full BV Logistics Pack', 'Full BV Premier'];
const STATUSES = ['Completed', 'Pending', 'Active', 'Processing', 'Approved'];

function generateFullBVDataset() {
  const rows = [];
  const baseDate = new Date(2026, 0, 1).getTime();

  for (let i = 1; i <= 240; i++) {
    const recId = `BV-${1000 + i}`;
    const channel = CHANNELS[i % CHANNELS.length];
    const salesPackage = SALES_PACKAGES[(i * 2) % SALES_PACKAGES.length];

    // Distribute with/without E
    const hasE = i % 3 === 0;
    const kittingCode = hasE
      ? KITTING_CODES_WITH_E[(i * 3) % KITTING_CODES_WITH_E.length]
      : KITTING_CODES_WITHOUT_E[(i * 2) % KITTING_CODES_WITHOUT_E.length];

    // Distribute with/without INC
    const hasInc = i % 4 === 0;
    const kittingName = hasInc
      ? KITTING_NAMES_WITH_INC[i % KITTING_NAMES_WITH_INC.length]
      : KITTING_NAMES_WITHOUT_INC[(i * 2) % KITTING_NAMES_WITHOUT_INC.length];

    const status = STATUSES[(i * 5) % STATUSES.length];
    const quantity = 1 + (i % 6);
    const amount = Math.round((75 + ((i * 47) % 1450)) * 100) / 100;
    const dateObj = new Date(baseDate + (i * 28) * 3600 * 1000);
    const dateStr = dateObj.toISOString().split('T')[0];

    rows.push({
      'Record ID': recId,
      'Channel': channel,
      'Sales Package': salesPackage,
      'Kitting Code': kittingCode,
      'Kitting Name': kittingName,
      'Status': status,
      'Quantity': quantity,
      'Amount ($)': amount,
      'Date': dateStr,
    });
  }
  return rows;
}

function generateINCDataset() {
  const rows = [];
  const baseDate = new Date(2026, 0, 1).getTime();

  for (let i = 1; i <= 200; i++) {
    const recId = `INC-${5000 + i}`;
    const channel = CHANNELS[(i * 3) % CHANNELS.length];
    const salesPackage = SALES_PACKAGES[i % SALES_PACKAGES.length];

    const hasE = i % 2 === 0;
    const kittingCode = hasE
      ? KITTING_CODES_WITH_E[i % KITTING_CODES_WITH_E.length]
      : KITTING_CODES_WITHOUT_E[i % KITTING_CODES_WITHOUT_E.length];

    // Predominantly INC kittings
    const hasInc = i % 3 !== 0;
    const kittingName = hasInc
      ? KITTING_NAMES_WITH_INC[i % KITTING_NAMES_WITH_INC.length]
      : KITTING_NAMES_WITHOUT_INC[i % KITTING_NAMES_WITHOUT_INC.length];

    const status = STATUSES[(i * 2) % STATUSES.length];
    const quantity = 1 + (i % 8);
    const amount = Math.round((120 + ((i * 63) % 2200)) * 100) / 100;
    const dateObj = new Date(baseDate + (i * 32) * 3600 * 1000);
    const dateStr = dateObj.toISOString().split('T')[0];

    rows.push({
      'Record ID': recId,
      'Channel': channel,
      'Sales Package': salesPackage,
      'Kitting Code': kittingCode,
      'Kitting Name': kittingName,
      'Status': status,
      'Quantity': quantity,
      'Amount ($)': amount,
      'Date': dateStr,
    });
  }
  return rows;
}

export function createSampleWorkbook(sampleType: 'full_bv' | 'inc' = 'full_bv'): ParsedWorkbook {
  const wb = XLSX.utils.book_new();

  if (sampleType === 'full_bv') {
    const data = generateFullBVDataset();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Full BV');
    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([u8], 'Full_BV_Sample.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return parseWorkbookFromFile(file, u8);
  } else {
    const data = generateINCDataset();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'INC');
    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([u8], 'INC_Sample.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return parseWorkbookFromFile(file, u8);
  }
}
