import { FilterResult, FilterRule, MatchMode } from '../types';

function parseComparable(val: any): { isNum: boolean; numVal: number; isDate: boolean; dateVal: number; strVal: string } {
  if (val === null || val === undefined) {
    return { isNum: false, numVal: NaN, isDate: false, dateVal: NaN, strVal: '' };
  }

  const strVal = String(val).trim();
  const cleanedStr = strVal.replace(/[\$,%]/g, '');
  const numVal = Number(cleanedStr);
  const isNum = !isNaN(numVal) && cleanedStr !== '';

  const dateVal = Date.parse(strVal);
  const isDate = !isNaN(dateVal) && strVal.length >= 8 && /\d/.test(strVal);

  return { isNum, numVal, isDate, dateVal, strVal };
}

export function evaluateRowRule(row: Record<string, any>, rule: FilterRule): boolean {
  if (!rule.column) return true;

  const rawVal = row[rule.column];
  const { is_empty, is_not_empty } = {
    is_empty: rule.operator === 'is_empty',
    is_not_empty: rule.operator === 'is_not_empty',
  };

  const isBlank = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';

  if (is_empty) return isBlank;
  if (is_not_empty) return !isBlank;

  // For other operators, rule.value is required
  const targetVal = rule.value ?? '';
  const parsedTarget = parseComparable(targetVal);
  const parsedCell = parseComparable(rawVal);

  const cellText = parsedCell.strVal.toLowerCase();
  const targetText = parsedTarget.strVal.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal === parsedTarget.numVal;
      }
      return cellText === targetText;

    case 'not_equals':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal !== parsedTarget.numVal;
      }
      return cellText !== targetText;

    case 'contains':
      return cellText.includes(targetText);

    case 'not_contains':
      return !cellText.includes(targetText);

    case 'starts_with':
      return cellText.startsWith(targetText);

    case 'ends_with':
      return cellText.endsWith(targetText);

    case 'greater_than':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal > parsedTarget.numVal;
      }
      if (parsedCell.isDate && parsedTarget.isDate) {
        return parsedCell.dateVal > parsedTarget.dateVal;
      }
      return parsedCell.strVal > parsedTarget.strVal;

    case 'greater_than_or_equal':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal >= parsedTarget.numVal;
      }
      if (parsedCell.isDate && parsedTarget.isDate) {
        return parsedCell.dateVal >= parsedTarget.dateVal;
      }
      return parsedCell.strVal >= parsedTarget.strVal;

    case 'less_than':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal < parsedTarget.numVal;
      }
      if (parsedCell.isDate && parsedTarget.isDate) {
        return parsedCell.dateVal < parsedTarget.dateVal;
      }
      return parsedCell.strVal < parsedTarget.strVal;

    case 'less_than_or_equal':
      if (parsedCell.isNum && parsedTarget.isNum) {
        return parsedCell.numVal <= parsedTarget.numVal;
      }
      if (parsedCell.isDate && parsedTarget.isDate) {
        return parsedCell.dateVal <= parsedTarget.dateVal;
      }
      return parsedCell.strVal <= parsedTarget.strVal;

    case 'between': {
      const parsedSecondary = parseComparable(rule.valueSecondary ?? '');
      if (parsedCell.isNum && parsedTarget.isNum && parsedSecondary.isNum) {
        const min = Math.min(parsedTarget.numVal, parsedSecondary.numVal);
        const max = Math.max(parsedTarget.numVal, parsedSecondary.numVal);
        return parsedCell.numVal >= min && parsedCell.numVal <= max;
      }
      if (parsedCell.isDate && parsedTarget.isDate && parsedSecondary.isDate) {
        const min = Math.min(parsedTarget.dateVal, parsedSecondary.dateVal);
        const max = Math.max(parsedTarget.dateVal, parsedSecondary.dateVal);
        return parsedCell.dateVal >= min && parsedCell.dateVal <= max;
      }
      return cellText >= targetText && cellText <= parsedSecondary.strVal.toLowerCase();
    }

    default:
      return true;
  }
}

export function filterRows(
  rows: Record<string, any>[],
  rules: FilterRule[],
  matchMode: MatchMode = 'and'
): FilterResult {
  const activeRules = rules.filter(
    (r) =>
      r.column &&
      (r.operator === 'is_empty' ||
        r.operator === 'is_not_empty' ||
        (r.value !== undefined && r.value.trim() !== ''))
  );

  const totalRows = rows.length;

  if (activeRules.length === 0) {
    const allIndices = new Set<number>(rows.map((_, i) => i));
    return {
      matchingRows: rows,
      matchingIndices: allIndices,
      totalRows,
      matchCount: totalRows,
      unmatchedCount: 0,
      matchPercentage: 100,
      activeRulesCount: 0,
    };
  }

  const matchingRows: Record<string, any>[] = [];
  const matchingIndices = new Set<number>();

  for (let i = 0; i < totalRows; i++) {
    const row = rows[i];
    let isMatch = false;

    if (matchMode === 'and') {
      isMatch = activeRules.every((rule) => evaluateRowRule(row, rule));
    } else {
      isMatch = activeRules.some((rule) => evaluateRowRule(row, rule));
    }

    if (isMatch) {
      matchingRows.push(row);
      matchingIndices.add(i);
    }
  }

  const matchCount = matchingRows.length;
  const unmatchedCount = totalRows - matchCount;
  const matchPercentage = totalRows > 0 ? Number(((matchCount / totalRows) * 100).toFixed(1)) : 0;

  return {
    matchingRows,
    matchingIndices,
    totalRows,
    matchCount,
    unmatchedCount,
    matchPercentage,
    activeRulesCount: activeRules.length,
  };
}
