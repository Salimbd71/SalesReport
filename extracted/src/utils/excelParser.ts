import * as XLSX from 'xlsx';
import {
  ChemistRecord,
  CustomerSalesRecord,
  FileValidationResult,
  SalesRecord,
  ValidationIssue,
} from '../types';

// Expected column lists
export const EXPECTED_SALES_COLUMNS = [
  'HQ_CODE',
  'HQ_NAME',
  'CUST_CODE',
  'MHL_CUST_ID',
  'MHL_CUST_NAME',
  'THERAPY',
  'BRAND',
  'ITEM_CODE',
  'ITEM_NAME',
  'ITEM_SER',
  'SALES_PACK',
  'EXP_QTY_BOX',
  'EXP_VALUE',
  'SALES_QTY_BOX',
  'SALES_VALUE',
];

// Sheet 2: HQ-Customer Sales format (10 columns as requested)
export const EXPECTED_CUSTOMER_SALES_COLUMNS = [
  'HQ_CODE',
  'HQ_NAME',
  'CUST_CODE',
  'MHL_CUST_ID',
  'MHL_CUST_NAME',
  'PRODUCT_COUNT',
  'EXP_QTY_BOX',
  'EXP_VALUE',
  'SALES_QTY_BOX',
  'SALES_VALUE',
];

export const EXPECTED_CHEMIST_COLUMNS = [
  'Cust code',
  'FSM-(NEW)2026-27',
  'AZURA HQ ( New Design)-2026-27',
];

export function normalizeHeader(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toUpperCase()
    .replace(/[\r\n\t_ -]+/g, '');
}

/**
 * Standardize and clean key string (removes non-breaking spaces, trailing .0, trims)
 */
export function cleanKey(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val).replace(/\u00A0/g, ' ').trim();
  // Strip trailing .0 from excel numeric conversions
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str;
}

/**
 * Standardize FLM / Manager names to avoid slight whitespace splitting
 * e.g. "FSM-DHANMONDI", "FSM - DHANMONDI", "FSM- DHANMONDI" -> "FSM-DHANMONDI"
 */
export function normalizeFlmName(flm: string | undefined | null): string {
  if (!flm) return 'Unassigned FLM';
  let clean = cleanKey(flm);
  if (!clean || clean.toUpperCase() === 'UNDEFINED' || clean.toUpperCase() === 'NULL') {
    return 'Unassigned FLM';
  }
  clean = clean.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  return clean;
}

/**
 * Standardize HQ names
 */
export function normalizeHqName(hq: string | undefined | null): string {
  if (!hq) return 'Unassigned HQ';
  let clean = cleanKey(hq);
  if (!clean || clean.toUpperCase() === 'UNDEFINED' || clean.toUpperCase() === 'NULL') {
    return 'Unassigned HQ';
  }
  clean = clean.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  return clean;
}

/**
 * Parses and strictly validates Last Month Sales File.
 * By default, selects Sheet 2 (HQ-Customer Sales) / second sheet (index 1).
 * Validates the 10 columns: HQ_CODE, HQ_NAME, CUST_CODE, MHL_CUST_ID, MHL_CUST_NAME, THERAPY, EXP_QTY_BOX, EXP_VALUE, SALES_QTY_BOX, SALES_VALUE
 */
export async function parseLastMonthSalesFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  validation: FileValidationResult;
  workbook: XLSX.WorkBook;
}> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  const sheetNames = workbook.SheetNames;

  // Default: Sheet 2 (HQ-Customer Sales) -> index 1 if available
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    if (sheetNames.length >= 2) {
      targetSheetName = sheetNames[1]; // Sheet 2 default
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          (s.toLowerCase().includes('hq-customer') && !s.toLowerCase().includes('product')) ||
          s.toLowerCase().includes('customer sales') ||
          s.toLowerCase() === 'sheet2'
      );
      targetSheetName = namedSheet || sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  if (!worksheet) {
    return {
      customerRecords: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CUSTOMER_SALES_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" not found.` }],
        rowCount: 0,
      },
    };
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  if (rawRows.length === 0) {
    return {
      customerRecords: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CUSTOMER_SALES_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" is empty.` }],
        rowCount: 0,
      },
    };
  }

  // Find header row (usually row 1 or 2)
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_CUSTOMER_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    if (matchCount >= 3) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = rawRows.length > 1 ? 1 : 0;
    detectedHeaders = (rawRows[headerRowIndex] || []).map((c: any) => cleanKey(c));
    issues.push({
      type: 'warning',
      message: `Defaulting to header row ${headerRowIndex + 1}`,
    });
  }

  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (
        norm === 'SALESVALUE' ||
        norm === 'SALES_VALUE' ||
        norm === 'SALESVAL' ||
        norm === 'TOTALSALES' ||
        (norm.includes('SALES') && norm.includes('VAL'))
      ) {
        colMap.set('SALES_VALUE', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID'
      ) {
        colMap.set('CUST_CODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
      }
      if (norm === 'HQNAME' || norm === 'HQ_NAME' || norm === 'HQ') {
        colMap.set('HQ_NAME', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
      if (
        norm === 'PRODUCTCOUNT' ||
        norm === 'PRODUCT_COUNT' ||
        norm === 'PRODCOUNT' ||
        norm === 'PROD_COUNT' ||
        norm === 'PRODUCT' ||
        norm === 'PRODUCTS' ||
        norm === 'TOTALPRODUCT' ||
        norm === 'NOOFPRODUCT' ||
        norm === 'NOOFPRODUCTS' ||
        norm === 'THERAPY' ||
        norm === 'THERAPYNAME'
      ) {
        colMap.set('PRODUCT_COUNT', idx);
      }
      if (norm === 'EXPQTYBOX' || norm === 'EXP_QTY_BOX' || norm === 'EXPQTY') {
        colMap.set('EXP_QTY_BOX', idx);
      }
      if (norm === 'EXPVALUE' || norm === 'EXP_VALUE' || norm === 'EXPVAL') {
        colMap.set('EXP_VALUE', idx);
      }
      if (norm === 'SALESQTYBOX' || norm === 'SALES_QTY_BOX' || norm === 'SALESQTY') {
        colMap.set('SALES_QTY_BOX', idx);
      }
    }
  });

  // Check missing expected columns
  const missingCols: string[] = [];
  EXPECTED_CUSTOMER_SALES_COLUMNS.forEach((exp) => {
    const norm = normalizeHeader(exp);
    const found =
      colMap.has(norm) ||
      colMap.has(exp) ||
      detectedHeaders.some((h) => normalizeHeader(h) === norm);
    if (!found) {
      missingCols.push(exp);
    }
  });

  if (missingCols.length > 0) {
    issues.push({
      type: 'warning',
      message: `Missing ${missingCols.length} expected columns: ${missingCols.join(', ')}`,
    });
  }

  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const idx = colMap.get(normalizeHeader(colName));
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      PRODUCT_COUNT: 5,
      THERAPY: 5,
      EXP_QTY_BOX: 6,
      EXP_VALUE: 7,
      SALES_QTY_BOX: 8,
      SALES_VALUE: 9,
    };
    const fallbackIdx = positionalFallback[colName];
    if (fallbackIdx !== undefined && fallbackIdx < row.length) {
      const val = row[fallbackIdx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    const val = getColVal(row, colName, 0);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const records: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const salesVal = getNumVal(row, 'SALES_VALUE');

    if (!custCode && !hqCode && salesVal === 0) continue;

    const prodCountVal = getColVal(row, 'PRODUCT_COUNT') || getColVal(row, 'THERAPY');

    records.push({
      id: `last_month_cust_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      PRODUCT_COUNT: prodCountVal !== '' ? prodCountVal : '-',
      THERAPY: cleanKey(prodCountVal),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  const isValid = records.length > 0;

  return {
    customerRecords: records,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingCols,
      issues,
      rowCount: records.length,
    },
  };
}

/**
 * Helper to parse a Sheet 2 (HQ-Customer Sales) from workbook
 */
export function parseCustomerSalesSheetFromWorkbook(
  workbook: XLSX.WorkBook,
  customSheetName?: string
): {
  records: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  sheetName: string;
} {
  const sheetNames = workbook.SheetNames;
  let targetSheetName = customSheetName;

  if (!targetSheetName) {
    if (sheetNames.length >= 2) {
      targetSheetName = sheetNames[1]; // Sheet 2 (index 1) default!
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          (s.toLowerCase().includes('hq-customer') && !s.toLowerCase().includes('product')) ||
          s.toLowerCase().includes('customer sales') ||
          s.toLowerCase() === 'sheet2'
      );
      targetSheetName = namedSheet || sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    return { records: [], sheetName: targetSheetName };
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  if (rawRows.length === 0) {
    return { records: [], sheetName: targetSheetName };
  }

  // Find header row (usually row 1 or 2)
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_CUSTOMER_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    if (matchCount >= 3) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = rawRows.length > 1 ? 1 : 0;
    detectedHeaders = (rawRows[headerRowIndex] || []).map((c: any) => cleanKey(c));
  }

  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (
        norm === 'SALESVALUE' ||
        norm === 'SALES_VALUE' ||
        norm === 'SALESVAL' ||
        norm === 'TOTALSALES' ||
        (norm.includes('SALES') && norm.includes('VAL'))
      ) {
        colMap.set('SALES_VALUE', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID'
      ) {
        colMap.set('CUST_CODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
      }
      if (norm === 'HQNAME' || norm === 'HQ_NAME' || norm === 'HQ') {
        colMap.set('HQ_NAME', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
      if (
        norm === 'PRODUCTCOUNT' ||
        norm === 'PRODUCT_COUNT' ||
        norm === 'PRODCOUNT' ||
        norm === 'PROD_COUNT' ||
        norm === 'PRODUCT' ||
        norm === 'PRODUCTS' ||
        norm === 'TOTALPRODUCT' ||
        norm === 'NOOFPRODUCT' ||
        norm === 'NOOFPRODUCTS' ||
        norm === 'THERAPY' ||
        norm === 'THERAPYNAME'
      ) {
        colMap.set('PRODUCT_COUNT', idx);
      }
    }
  });

  if (!colMap.has('CUST_CODE') && detectedHeaders.length > 2) {
    colMap.set('CUST_CODE', 2);
  }
  if (!colMap.has('SALES_VALUE') && detectedHeaders.length > 9) {
    colMap.set('SALES_VALUE', 9);
  }

  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const idx = colMap.get(normalizeHeader(colName));
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      PRODUCT_COUNT: 5,
      THERAPY: 5,
      EXP_QTY_BOX: 6,
      EXP_VALUE: 7,
      SALES_QTY_BOX: 8,
      SALES_VALUE: 9,
    };
    const fallbackIdx = positionalFallback[colName];
    if (fallbackIdx !== undefined && fallbackIdx < row.length) {
      const val = row[fallbackIdx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    const val = getColVal(row, colName, 0);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const records: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const salesVal = getNumVal(row, 'SALES_VALUE');

    if (!custCode && !hqCode && salesVal === 0) continue;

    const prodCountVal = getColVal(row, 'PRODUCT_COUNT') || getColVal(row, 'THERAPY');

    records.push({
      id: `cust_sales_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      PRODUCT_COUNT: prodCountVal !== '' ? prodCountVal : '-',
      THERAPY: cleanKey(prodCountVal),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  return { records, sheetName: targetSheetName };
}

/**
 * Parses Sales Excel file
 * Defaults to Sheet 4 (index 3) for HQ-Customer-Product Sales
 * Also automatically parses Sheet 2 (HQ-Customer Sales)
 */
export async function parseSalesFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  records: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[];
  customerSheetName: string;
  dateHeader: string;
  validation: FileValidationResult;
  workbook: XLSX.WorkBook;
}> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  const sheetNames = workbook.SheetNames;

  // Rule: Sheet 4 (index 3) is strictly default when >= 4 sheets exist
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    if (sheetNames.length >= 4) {
      targetSheetName = sheetNames[3]; // Sheet 4 default!
    } else {
      const namedSheet = sheetNames.find(
        (s) =>
          s.toLowerCase().includes('hq-customer-product') ||
          s.toLowerCase().includes('sales') ||
          s.toLowerCase().includes('hq')
      );
      targetSheetName = namedSheet || sheetNames[0];
    }
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  // Also parse Sheet 2 (HQ-Customer Sales) from the workbook
  const { records: customerRecords, sheetName: customerSheetName } =
    parseCustomerSalesSheetFromWorkbook(workbook);

  if (!worksheet) {
    return {
      records: [],
      customerRecords: [],
      customerSheetName,
      dateHeader: '',
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_SALES_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" not found.` }],
        rowCount: 0,
      },
    };
  }

  // Extract cell A1 text for the date header
  const cellA1 = worksheet['A1'];
  let dateHeader = '';
  if (cellA1) {
    if (cellA1.w) {
      dateHeader = String(cellA1.w).trim();
    } else if (cellA1.v !== undefined && cellA1.v !== null) {
      if (cellA1.v instanceof Date) {
        dateHeader = cellA1.v.toLocaleDateString();
      } else {
        dateHeader = String(cellA1.v).trim();
      }
    }
  }

  // Read raw 2D array of rows with raw values
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  // Find header row (usually row 2 / index 1, or row 1 / index 0)
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const matchCount = EXPECTED_SALES_COLUMNS.filter((exp) =>
      normalizedRow.includes(normalizeHeader(exp))
    ).length;

    // If at least 3 expected columns match, this is the header row
    if (matchCount >= 3) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = rawRows.length > 1 ? 1 : 0;
    detectedHeaders = (rawRows[headerRowIndex] || []).map((c: any) => cleanKey(c));
    issues.push({
      type: 'warning',
      message: 'Defaulting to header row ' + (headerRowIndex + 1),
    });
  }

  // Map column index to column name with exact priority matching
  const colMap = new Map<string, number>();
  detectedHeaders.forEach((colName, idx) => {
    if (colName) {
      const norm = normalizeHeader(colName);
      colMap.set(norm, idx);

      if (norm === 'BRAND' || (norm.includes('BRAND') && !norm.includes('NAME'))) {
        colMap.set('BRAND', idx);
      }
      if (
        norm === 'SALESVALUE' ||
        norm === 'SALES_VALUE' ||
        norm === 'SALESVAL' ||
        norm === 'TOTALSALES' ||
        (norm.includes('SALES') && norm.includes('VAL'))
      ) {
        colMap.set('SALES_VALUE', idx);
      }
      if (
        norm === 'CUSTCODE' ||
        norm === 'CUSTOMERCODE' ||
        norm === 'CUST_CODE' ||
        norm === 'CUSTOMER_CODE' ||
        norm === 'CUSTID'
      ) {
        colMap.set('CUST_CODE', idx);
      }
      if (norm === 'HQCODE' || norm === 'HQ_CODE') {
        colMap.set('HQ_CODE', idx);
      }
      if (norm === 'HQNAME' || norm === 'HQ_NAME' || norm === 'HQ') {
        colMap.set('HQ_NAME', idx);
      }
      if (norm === 'MHLCUSTID' || norm === 'MHL_CUST_ID' || norm === 'MHLCODE') {
        colMap.set('MHL_CUST_ID', idx);
      }
      if (norm === 'MHLCUSTNAME' || norm === 'MHL_CUST_NAME') {
        colMap.set('MHL_CUST_NAME', idx);
      }
      if (norm === 'ITEMCODE' || norm === 'ITEM_CODE') {
        colMap.set('ITEM_CODE', idx);
      }
      if (norm === 'ITEMNAME' || norm === 'ITEM_NAME') {
        colMap.set('ITEM_NAME', idx);
      }
      if (norm === 'ITEMSER' || norm === 'ITEM_SER') {
        colMap.set('ITEM_SER', idx);
      }
      if (norm === 'SALESPACK' || norm === 'SALES_PACK') {
        colMap.set('SALES_PACK', idx);
      }
      if (norm === 'EXPQTYBOX' || norm === 'EXP_QTY_BOX' || norm === 'EXPQTY') {
        colMap.set('EXP_QTY_BOX', idx);
      }
      if (norm === 'EXPVALUE' || norm === 'EXP_VALUE' || norm === 'EXPVAL') {
        colMap.set('EXP_VALUE', idx);
      }
      if (norm === 'SALESQTYBOX' || norm === 'SALES_QTY_BOX' || norm === 'SALESQTY') {
        colMap.set('SALES_QTY_BOX', idx);
      }
      if (norm === 'THERAPY' || norm === 'THERAPYNAME') {
        colMap.set('THERAPY', idx);
      }
    }
  });

  // Check missing expected columns
  const missingCols: string[] = [];
  EXPECTED_SALES_COLUMNS.forEach((exp) => {
    const norm = normalizeHeader(exp);
    const found =
      colMap.has(norm) ||
      colMap.has(exp) ||
      detectedHeaders.some((h) => normalizeHeader(h) === norm);
    if (!found) {
      missingCols.push(exp);
    }
  });

  if (missingCols.length > 0) {
    issues.push({
      type: 'warning',
      message: `Missing ${missingCols.length} expected columns: ${missingCols.join(', ')}`,
    });
  }

  // Fallback positional indexing if not matched by name:
  // Col A: HQ_CODE (0)
  // Col B: HQ_NAME (1)
  // Col C: CUST_CODE (2)
  // Col D: MHL_CUST_ID (3)
  // Col E: MHL_CUST_NAME (4)
  // Col F: THERAPY (5)
  // Col G: BRAND (6)
  // Col H: ITEM_CODE (7)
  // Col I: ITEM_NAME (8)
  // Col J: ITEM_SER (9)
  // Col K: SALES_PACK (10)
  // Col L: EXP_QTY_BOX (11)
  // Col M: EXP_VALUE (12)
  // Col N: SALES_QTY_BOX (13)
  // Col O: SALES_VALUE (14)
  const getColVal = (row: any[], colName: string, defaultVal: any = '') => {
    const idx = colMap.get(normalizeHeader(colName));
    if (idx !== undefined && idx < row.length) {
      const val = row[idx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    const positionalFallback: Record<string, number> = {
      HQ_CODE: 0,
      HQ_NAME: 1,
      CUST_CODE: 2,
      MHL_CUST_ID: 3,
      MHL_CUST_NAME: 4,
      THERAPY: 5,
      BRAND: 6,
      ITEM_CODE: 7,
      ITEM_NAME: 8,
      ITEM_SER: 9,
      SALES_PACK: 10,
      EXP_QTY_BOX: 11,
      EXP_VALUE: 12,
      SALES_QTY_BOX: 13,
      SALES_VALUE: 14,
    };
    const fallbackIdx = positionalFallback[colName];
    if (fallbackIdx !== undefined && fallbackIdx < row.length) {
      const val = row[fallbackIdx];
      return val !== undefined && val !== null ? val : defaultVal;
    }
    return defaultVal;
  };

  const getNumVal = (row: any[], colName: string): number => {
    const val = getColVal(row, colName, 0);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === undefined || val === null || val === '') return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Extract records
  const records: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const custCode = cleanKey(getColVal(row, 'CUST_CODE'));
    const hqCode = cleanKey(getColVal(row, 'HQ_CODE'));
    const brand = cleanKey(getColVal(row, 'BRAND')) || 'OTHER';
    const salesVal = getNumVal(row, 'SALES_VALUE');

    // Only skip if completely blank across all fields
    if (!custCode && !hqCode && brand === 'OTHER' && salesVal === 0) continue;

    records.push({
      id: `sales_${r}_${custCode}`,
      HQ_CODE: hqCode,
      HQ_NAME: cleanKey(getColVal(row, 'HQ_NAME')),
      CUST_CODE: custCode,
      MHL_CUST_ID: cleanKey(getColVal(row, 'MHL_CUST_ID')),
      MHL_CUST_NAME: cleanKey(getColVal(row, 'MHL_CUST_NAME')),
      THERAPY: cleanKey(getColVal(row, 'THERAPY')),
      BRAND: brand,
      ITEM_CODE: cleanKey(getColVal(row, 'ITEM_CODE')),
      ITEM_NAME: cleanKey(getColVal(row, 'ITEM_NAME')),
      ITEM_SER: cleanKey(getColVal(row, 'ITEM_SER')),
      SALES_PACK: getColVal(row, 'SALES_PACK'),
      EXP_QTY_BOX: getNumVal(row, 'EXP_QTY_BOX'),
      EXP_VALUE: getNumVal(row, 'EXP_VALUE'),
      SALES_QTY_BOX: getNumVal(row, 'SALES_QTY_BOX'),
      SALES_VALUE: salesVal,
      rawRowIndex: r + 1,
    });
  }

  const isValid = records.length > 0;

  return {
    records,
    customerRecords,
    customerSheetName,
    dateHeader,
    workbook,
    validation: {
      isValid,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingCols,
      issues,
      dateHeader,
      rowCount: records.length,
    },
  };
}

/**
 * Parses Chemist Excel file (Sheet DHK-MYN-KH)
 */
export async function parseChemistFile(
  file: File | ArrayBuffer,
  selectedSheetName?: string
): Promise<{
  chemistMap: Map<string, ChemistRecord>;
  chemistList: ChemistRecord[];
  validation: FileValidationResult;
  workbook: XLSX.WorkBook;
}> {
  const data = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });
  const sheetNames = workbook.SheetNames;

  // Rule: Sheet Name- DHK-MYN-KH
  let targetSheetName = selectedSheetName;
  if (!targetSheetName) {
    const namedSheet = sheetNames.find(
      (s) =>
        s.toLowerCase().includes('dhk-myn-kh') ||
        s.toLowerCase().includes('dhk') ||
        s.toLowerCase().includes('chemist')
    );
    targetSheetName = namedSheet || sheetNames[0];
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const issues: ValidationIssue[] = [];

  if (!worksheet) {
    return {
      chemistMap: new Map(),
      chemistList: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CHEMIST_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" not found.` }],
        rowCount: 0,
      },
    };
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  if (rawRows.length === 0) {
    return {
      chemistMap: new Map(),
      chemistList: [],
      workbook,
      validation: {
        isValid: false,
        sheetName: targetSheetName,
        availableSheets: sheetNames,
        detectedColumns: [],
        missingColumns: EXPECTED_CHEMIST_COLUMNS,
        issues: [{ type: 'error', message: `Sheet "${targetSheetName}" is empty.` }],
        rowCount: 0,
      },
    };
  }

  // Find header row in first 10 rows
  let headerRowIndex = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r] || [];
    const normalizedRow = row.map(normalizeHeader);
    const hasCustCode = normalizedRow.some(
      (h) => h === 'CUSTCODE' || h === 'CUSTOMERCODE' || h === 'CUST_CODE' || h.includes('CUST')
    );
    const hasFlmOrFsm = normalizedRow.some((h) => h.includes('FSM') || h.includes('FLM'));

    if (hasCustCode && hasFlmOrFsm) {
      headerRowIndex = r;
      detectedHeaders = row.map((cell: any) => cleanKey(cell));
      break;
    }
  }

  if (headerRowIndex === -1) {
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const row = rawRows[r] || [];
      const normalizedRow = row.map(normalizeHeader);
      if (normalizedRow.some((h) => h.includes('CUST') || h.includes('CODE'))) {
        headerRowIndex = r;
        detectedHeaders = row.map((cell: any) => cleanKey(cell));
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    detectedHeaders = (rawRows[0] || []).map((c: any) => cleanKey(c));
    issues.push({
      type: 'warning',
      message: 'Chemist List header row defaulted to row 1.',
    });
  }

  // Map columns
  let custCodeIdx = -1;
  let custNameIdx = -1;
  let flmIdx = -1;
  let hqIdx = -1;
  let slNoIdx = -1;
  let mhlCodeIdx = -1;
  let addressIdx = -1;
  let depotIdx = -1;
  let rsmIdx = -1;

  detectedHeaders.forEach((colName, idx) => {
    const norm = normalizeHeader(colName);
    if (!norm) return;

    if (
      norm === 'CUSTCODE' ||
      norm === 'CUSTOMERCODE' ||
      norm === 'CUST_CODE' ||
      norm === 'CUSTID' ||
      norm === 'CODE'
    ) {
      if (custCodeIdx === -1) custCodeIdx = idx;
    } else if (norm === 'CUSTNAME' || norm === 'CUSTOMERNAME' || norm === 'CHEMISTNAME') {
      custNameIdx = idx;
    } else if (
      norm.includes('FSMNEW') ||
      norm.includes('FSM-(NEW)') ||
      norm.includes('FSM(NEW)') ||
      norm.includes('FSM-NEW') ||
      norm === 'FSM' ||
      norm === 'FLM' ||
      norm.includes('FLM')
    ) {
      flmIdx = idx;
    } else if (
      norm.includes('AZURAHQ(NEWDESIGN)') ||
      norm.includes('AZURAHQ') ||
      norm.includes('NEWDESIGN') ||
      norm === 'HQ' ||
      norm === 'AZURAHQ' ||
      (norm.includes('HQ') && !norm.includes('CODE'))
    ) {
      hqIdx = idx;
    } else if (norm === 'SLNO' || norm === 'SL') {
      slNoIdx = idx;
    } else if (norm === 'MHLCODE' || norm === 'MHLCUSTID') {
      mhlCodeIdx = idx;
    } else if (norm.includes('ADDRESS')) {
      addressIdx = idx;
    } else if (norm.includes('DEPOT')) {
      depotIdx = idx;
    } else if (norm.includes('RSM')) {
      rsmIdx = idx;
    }
  });

  // Positional fallback for Chemist Sheet:
  // Column C: Cust code (index 2)
  // Column D: Cust name (index 3)
  // Column I: FSM-(NEW)2026-27 (index 8) -> FLM
  // Column K: AZURA HQ ( New Design)-2026-27 (index 10) -> HQ
  if (custCodeIdx === -1 && detectedHeaders.length > 2) custCodeIdx = 2;
  if (custNameIdx === -1 && detectedHeaders.length > 3) custNameIdx = 3;
  if (flmIdx === -1 && detectedHeaders.length > 8) flmIdx = 8;
  if (hqIdx === -1 && detectedHeaders.length > 10) hqIdx = 10;

  const chemistMap = new Map<string, ChemistRecord>();
  const chemistList: ChemistRecord[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawCustCode = custCodeIdx !== -1 && custCodeIdx < row.length ? row[custCodeIdx] : '';
    const cleanCustCode = cleanKey(rawCustCode);

    if (!cleanCustCode) continue;

    const custName =
      custNameIdx !== -1 && custNameIdx < row.length ? cleanKey(row[custNameIdx]) : '';
    const rawFlm = flmIdx !== -1 && flmIdx < row.length ? row[flmIdx] : '';
    const rawHq = hqIdx !== -1 && hqIdx < row.length ? row[hqIdx] : '';

    const flmName = normalizeFlmName(rawFlm);
    const hqName = normalizeHqName(rawHq);

    const record: ChemistRecord = {
      slNo: slNoIdx !== -1 && slNoIdx < row.length ? row[slNoIdx] : r,
      mhlCode: mhlCodeIdx !== -1 && mhlCodeIdx < row.length ? cleanKey(row[mhlCodeIdx]) : '',
      custCode: cleanCustCode,
      custName: custName,
      address: addressIdx !== -1 && addressIdx < row.length ? cleanKey(row[addressIdx]) : '',
      nameOfDepot: depotIdx !== -1 && depotIdx < row.length ? cleanKey(row[depotIdx]) : '',
      rsm: rsmIdx !== -1 && rsmIdx < row.length ? cleanKey(row[rsmIdx]) : '',
      fsmNew2627: flmName,
      azuraHqNew2627: hqName,
    };

    chemistMap.set(cleanCustCode, record);
    // Also index normalized numeric code (e.g. without leading zeros or with string conversion)
    const upperCode = cleanCustCode.toUpperCase();
    if (upperCode !== cleanCustCode) {
      chemistMap.set(upperCode, record);
    }

    chemistList.push(record);
  }

  const missingChemistCols: string[] = [];
  if (custCodeIdx === -1) missingChemistCols.push('Cust code (Column C)');
  if (flmIdx === -1) missingChemistCols.push('FSM-(NEW)2026-27 (Column I / FLM)');
  if (hqIdx === -1) missingChemistCols.push('AZURA HQ ( New Design)-2026-27 (Column K / HQ)');

  return {
    chemistMap,
    chemistList,
    workbook,
    validation: {
      isValid: chemistList.length > 0,
      sheetName: targetSheetName,
      availableSheets: sheetNames,
      detectedColumns: detectedHeaders.filter(Boolean),
      missingColumns: missingChemistCols,
      issues,
      rowCount: chemistList.length,
    },
  };
}

/**
 * Enriches Sales Records (Sheet 4) with FLM and HQ via VLOOKUP matching
 *
 * Rules:
 * 1. P2: FLM = VLOOKUP from Chemist List Column I [FSM-(NEW)2026-27]
 * 2. Q2: HQ  = VLOOKUP from Chemist List Column K [AZURA HQ ( New Design)-2026-27]
 */
export function enrichSalesWithChemist(
  salesRecords: Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedRecords: SalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
  unmatchedCodes: string[];
} {
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedSet = new Set<string>();

  const enrichedRecords: SalesRecord[] = salesRecords.map((rec) => {
    const custKey = cleanKey(rec.CUST_CODE);
    let chemist = chemistMap.get(custKey);

    if (!chemist && custKey) {
      chemist = chemistMap.get(custKey.toUpperCase());
    }

    // Try without leading zeros or trimmed
    if (!chemist && custKey) {
      const stripped = custKey.replace(/^0+/, '');
      if (stripped && stripped !== custKey) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = 'Unassigned FLM';
    let hq = rec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || 'Unassigned FLM';
      hq = chemist.azuraHqNew2627 || rec.HQ_NAME || 'Unassigned HQ';
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
      if (rec.CUST_CODE) {
        unmatchedSet.add(rec.CUST_CODE);
      }
    }

    return {
      ...rec,
      FLM: flm,
      HQ: hq,
      isMatched,
    };
  });

  return {
    enrichedRecords,
    matchedCount,
    unmatchedCount,
    unmatchedCodes: Array.from(unmatchedSet),
  };
}

/**
 * Enriches Sheet 2 (HQ-Customer Sales) in Standard Mode
 * Appends:
 * - K2: FLM = VLOOKUP from Chemist List Column I [FSM-(NEW)2026-27]
 * - L2: HQ  = VLOOKUP from Chemist List Column K [AZURA HQ ( New Design)-2026-27]
 */
export function enrichCustomerSalesWithChemist(
  customerRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedCustomerRecords: CustomerSalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
} {
  let matchedCount = 0;
  let unmatchedCount = 0;

  const enrichedCustomerRecords: CustomerSalesRecord[] = customerRecords.map((rec) => {
    const custKey = cleanKey(rec.CUST_CODE);
    let chemist = chemistMap.get(custKey);

    if (!chemist && custKey) {
      chemist = chemistMap.get(custKey.toUpperCase());
    }
    if (!chemist && custKey) {
      const stripped = custKey.replace(/^0+/, '');
      if (stripped && stripped !== custKey) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = 'Unassigned FLM';
    let hq = rec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || 'Unassigned FLM';
      hq = chemist.azuraHqNew2627 || rec.HQ_NAME || 'Unassigned HQ';
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    return {
      ...rec,
      FLM: flm,
      HQ: hq,
      isMatched,
    };
  });

  return {
    enrichedCustomerRecords,
    matchedCount,
    unmatchedCount,
  };
}

/**
 * Month-on-Month Comparison & Enrichment for Sheet 2 (HQ-Customer Sales)
 *
 * Requirements:
 * 1. Sheet 2 columns:
 *    Col A..J: HQ_CODE, HQ_NAME, CUST_CODE, MHL_CUST_ID, MHL_CUST_NAME, THERAPY, EXP_QTY_BOX, EXP_VALUE, SALES_QTY_BOX
 *    Col K: SALES_VALUE_CURRENT
 *    Col L: SALES_VALUE_LAST
 *    Col M: Deficit = SALES_VALUE_CURRENT - SALES_VALUE_LAST (negative in red text)
 *    Col N: FLM (VLOOKUP from Chemist List Col I)
 *    Col O: HQ (VLOOKUP from Chemist List Col K)
 *
 * 2. Full outer join: Includes chemists present in current month and/or last month.
 */
export function compareAndEnrichCustomerSales(
  currentRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  lastMonthRecords: Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[],
  chemistMap: Map<string, ChemistRecord>
): {
  enrichedCustomerRecords: CustomerSalesRecord[];
  matchedCount: number;
  unmatchedCount: number;
  totalDeficit: number;
  totalCurrentSales: number;
  totalLastSales: number;
} {
  // Aggregate current month by CUST_CODE
  const currentMap = new Map<string, Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>>();
  currentRecords.forEach((rec) => {
    const key = cleanKey(rec.CUST_CODE);
    if (key) {
      if (currentMap.has(key)) {
        const existing = currentMap.get(key)!;
        existing.SALES_VALUE += rec.SALES_VALUE;
        existing.SALES_QTY_BOX += rec.SALES_QTY_BOX;
        existing.EXP_VALUE += rec.EXP_VALUE;
        existing.EXP_QTY_BOX += rec.EXP_QTY_BOX;
      } else {
        currentMap.set(key, { ...rec });
      }
    }
  });

  // Aggregate last month by CUST_CODE
  const lastMap = new Map<string, Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>>();
  lastMonthRecords.forEach((rec) => {
    const key = cleanKey(rec.CUST_CODE);
    if (key) {
      if (lastMap.has(key)) {
        const existing = lastMap.get(key)!;
        existing.SALES_VALUE += rec.SALES_VALUE;
        existing.SALES_QTY_BOX += rec.SALES_QTY_BOX;
        existing.EXP_VALUE += rec.EXP_VALUE;
        existing.EXP_QTY_BOX += rec.EXP_QTY_BOX;
      } else {
        lastMap.set(key, { ...rec });
      }
    }
  });

  // Collect union of all customer codes
  const allCustCodes = new Set<string>();
  currentMap.forEach((_, code) => allCustCodes.add(code));
  lastMap.forEach((_, code) => allCustCodes.add(code));

  let matchedCount = 0;
  let unmatchedCount = 0;
  let totalDeficit = 0;
  let totalCurrentSales = 0;
  let totalLastSales = 0;

  const enrichedCustomerRecords: CustomerSalesRecord[] = [];

  allCustCodes.forEach((custCode) => {
    const cur = currentMap.get(custCode);
    const last = lastMap.get(custCode);

    const isCurrentOnly = !!cur && !last;
    const isLastMonthOnly = !cur && !!last;

    const baseRec = cur || last!;
    const curSalesVal = cur ? cur.SALES_VALUE : 0;
    const lastSalesVal = last ? last.SALES_VALUE : 0;
    const deficit = curSalesVal - lastSalesVal;

    totalCurrentSales += curSalesVal;
    totalLastSales += lastSalesVal;
    totalDeficit += deficit;

    // VLOOKUP Chemist
    let chemist = chemistMap.get(custCode);
    if (!chemist && custCode) {
      chemist = chemistMap.get(custCode.toUpperCase());
    }
    if (!chemist && custCode) {
      const stripped = custCode.replace(/^0+/, '');
      if (stripped && stripped !== custCode) {
        chemist = chemistMap.get(stripped);
      }
    }

    let flm = 'Unassigned FLM';
    let hq = baseRec.HQ_NAME || 'Unassigned HQ';
    let isMatched = false;

    if (chemist) {
      flm = chemist.fsmNew2627 || 'Unassigned FLM';
      hq = chemist.azuraHqNew2627 || baseRec.HQ_NAME || 'Unassigned HQ';
      isMatched = true;
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    enrichedCustomerRecords.push({
      ...baseRec,
      id: `compare_${custCode}`,
      SALES_VALUE: curSalesVal,
      SALES_VALUE_CURRENT: curSalesVal,
      SALES_VALUE_LAST: lastSalesVal,
      deficit: deficit,
      isLastMonthOnly,
      isCurrentMonthOnly: isCurrentOnly,
      FLM: flm,
      HQ: hq,
      isMatched,
    });
  });

  // Sort by Deficit ascending (largest drops first)
  enrichedCustomerRecords.sort((a, b) => (a.deficit || 0) - (b.deficit || 0));

  return {
    enrichedCustomerRecords,
    matchedCount,
    unmatchedCount,
    totalDeficit,
    totalCurrentSales,
    totalLastSales,
  };
}
