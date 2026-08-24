import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ChemistRecord, CustomerSalesRecord, PivotTableData, SalesRecord } from '../types';

/**
 * Helper to style headers
 */
function applyHeaderStyle(row: ExcelJS.Row, bgColor = '1E3A8A', textColor = 'FFFFFF') {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
    cell.font = {
      bold: true,
      color: { argb: textColor },
      size: 11,
      name: 'Calibri',
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'D1D5DB' } },
      left: { style: 'thin', color: { argb: 'D1D5DB' } },
      bottom: { style: 'medium', color: { argb: '9CA3AF' } },
      right: { style: 'thin', color: { argb: 'D1D5DB' } },
    };
  });
  row.height = 28;
}

/**
 * Builds Sheet 4: HQ-Customer-Product Sales (Enriched with Col P: FLM, Col Q: HQ)
 */
function buildEnrichedSalesSheet(
  worksheet: ExcelJS.Worksheet,
  salesRecords: SalesRecord[],
  dateHeader: string
) {
  // Row 1: Date text at top (Cell A1)
  const titleRow = worksheet.addRow([dateHeader || 'Sales Data Analysis Report (HQ-Customer-Product Sales)']);
  titleRow.height = 24;
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: '1E3A8A' } };
  worksheet.mergeCells('A1:Q1');
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 2: Headers (A2 to Q2)
  // P2: FLM, Q2: HQ
  const headers = [
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
    'FLM', // Col P (P2)
    'HQ',  // Col Q (Q2)
  ];

  const headerRow = worksheet.addRow(headers);
  applyHeaderStyle(headerRow, '1E40AF', 'FFFFFF');

  // Highlight newly added P2 (FLM) and Q2 (HQ) with teal accent
  headerRow.getCell(16).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0D9488' }, // Teal
  };
  headerRow.getCell(17).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F766E' }, // Darker Teal
  };

  // Data rows (P3, Q3 onwards)
  salesRecords.forEach((rec, idx) => {
    const row = worksheet.addRow([
      rec.HQ_CODE,
      rec.HQ_NAME,
      rec.CUST_CODE,
      rec.MHL_CUST_ID,
      rec.MHL_CUST_NAME,
      rec.THERAPY,
      rec.BRAND,
      rec.ITEM_CODE,
      rec.ITEM_NAME,
      rec.ITEM_SER,
      rec.SALES_PACK,
      rec.EXP_QTY_BOX,
      rec.EXP_VALUE,
      rec.SALES_QTY_BOX,
      rec.SALES_VALUE,
      rec.FLM, // Populated FLM value
      rec.HQ,  // Populated HQ value
    ]);

    // Format numbers
    row.getCell(12).numFmt = '#,##0';
    row.getCell(13).numFmt = '#,##0.00';
    row.getCell(14).numFmt = '#,##0';
    row.getCell(15).numFmt = '#,##0.00';

    // Highlight enriched cells
    row.getCell(16).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? 'F0FDFA' : 'CCFBF1' },
    };
    row.getCell(17).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? 'F0FDFA' : 'CCFBF1' },
    };

    // Cell borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'F3F4F6' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'F3F4F6' } },
        right: { style: 'thin', color: { argb: 'F3F4F6' } },
      };
    });
  });

  // Auto column widths
  worksheet.columns.forEach((col, idx) => {
    let maxLen = headers[idx] ? headers[idx].length : 12;
    if (idx === 4) maxLen = 28; // MHL_CUST_NAME
    if (idx === 8) maxLen = 25; // ITEM_NAME
    if (idx === 15 || idx === 16) maxLen = 22; // FLM & HQ
    col.width = Math.max(maxLen + 4, 12);
  });
}

/**
 * Builds Sheet 2: HQ-Customer Sales (Enriched with Col K: FLM, Col L: HQ)
 * As requested: "A sheet er sese not on kore K2 L2 column a vlookup formula use Kore Chemist list file theke FLM, HQ bosbe"
 */
function buildEnrichedHqCustomerSheet(
  worksheet: ExcelJS.Worksheet,
  customerRecords: CustomerSalesRecord[],
  dateHeader: string
) {
  // Row 1: Date text at top (Cell A1)
  const titleRow = worksheet.addRow([dateHeader || 'Customer Sales Report (HQ-Customer Sales)']);
  titleRow.height = 24;
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: '1E3A8A' } };
  worksheet.mergeCells('A1:L1');
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 2: Headers (A2 to L2)
  // K2: FLM, L2: HQ
  const headers = [
    'HQ_CODE',
    'HQ_NAME',
    'CUST_CODE',
    'MHL_CUST_ID',
    'MHL_CUST_NAME',
    'THERAPY',
    'EXP_QTY_BOX',
    'EXP_VALUE',
    'SALES_QTY_BOX',
    'SALES_VALUE',
    'FLM', // Col K (K2)
    'HQ',  // Col L (L2)
  ];

  const headerRow = worksheet.addRow(headers);
  applyHeaderStyle(headerRow, '1E40AF', 'FFFFFF');

  // Highlight newly added K2 (FLM) and L2 (HQ) with teal accent
  headerRow.getCell(11).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0D9488' }, // Teal
  };
  headerRow.getCell(12).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F766E' }, // Darker Teal
  };

  // Data rows (K3, L3 onwards)
  customerRecords.forEach((rec, idx) => {
    const row = worksheet.addRow([
      rec.HQ_CODE,
      rec.HQ_NAME,
      rec.CUST_CODE,
      rec.MHL_CUST_ID,
      rec.MHL_CUST_NAME,
      rec.THERAPY,
      rec.EXP_QTY_BOX,
      rec.EXP_VALUE,
      rec.SALES_QTY_BOX,
      rec.SALES_VALUE,
      rec.FLM, // Populated FLM value in Col K
      rec.HQ,  // Populated HQ value in Col L
    ]);

    // Format numbers
    row.getCell(7).numFmt = '#,##0';
    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(9).numFmt = '#,##0';
    row.getCell(10).numFmt = '#,##0.00';

    // Highlight enriched cells
    row.getCell(11).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? 'F0FDFA' : 'CCFBF1' },
    };
    row.getCell(12).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? 'F0FDFA' : 'CCFBF1' },
    };

    // Cell borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'F3F4F6' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'F3F4F6' } },
        right: { style: 'thin', color: { argb: 'F3F4F6' } },
      };
    });
  });

  // Auto column widths
  worksheet.columns.forEach((col, idx) => {
    let maxLen = headers[idx] ? headers[idx].length : 12;
    if (idx === 4) maxLen = 28; // MHL_CUST_NAME
    if (idx === 10 || idx === 11) maxLen = 22; // FLM & HQ (Col K & L)
    col.width = Math.max(maxLen + 4, 12);
  });
}

/**
 * Builds the Pivot Table Sheet
 * Columns: BRAND
 * Rows: FLM, HQ
 * Values: SALES_VALUE (Sum) in Lac (100,000 = 1.00, 10,000 = 0.10)
 */
function buildPivotReportSheet(
  worksheet: ExcelJS.Worksheet,
  pivotData: PivotTableData,
  dateHeader: string
) {
  const toLac = (val: number | undefined | null) => {
    if (!val) return 0;
    return Number((val / 100000).toFixed(2));
  };

  // Title Row with date text
  const titleRow = worksheet.addRow([
    dateHeader ? `${dateHeader} - SALES REPORT PIVOT (Value in Lac)` : 'SALES REPORT PIVOT (Value in Lac)',
  ]);
  titleRow.height = 26;
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: '1E3A8A' } };
  worksheet.mergeCells(1, 1, 1, Math.max(pivotData.brands.length + 3, 5));

  // Subtitle / metadata row
  const subRow = worksheet.addRow([
    `Report Structure: Rows = FLM > HQ | Columns = BRAND | Value = Sum of SALES_VALUE in Lac (1.00 Lac = 100,000 | 0.10 Lac = 10,000) | Grand Total: ${toLac(pivotData.grandTotal).toFixed(2)} Lac`,
  ]);
  subRow.height = 18;
  subRow.getCell(1).font = { italic: true, size: 10, color: { argb: '4B5563' } };
  worksheet.mergeCells(2, 1, 2, Math.max(pivotData.brands.length + 3, 5));

  // Blank row
  worksheet.addRow([]);

  // Headers: Row 4
  const headerCols = ['FLM (First Line Manager)', 'HQ (Headquarter)', ...pivotData.brands, 'Grand Total (Lac)'];
  const headerRow = worksheet.addRow(headerCols);
  applyHeaderStyle(headerRow, '1E3A8A', 'FFFFFF');

  // Highlight Grand Total column header
  headerRow.getCell(headerCols.length).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F172A' },
  };

  // Group rows by FLM
  pivotData.flmGroups.forEach((group) => {
    // FLM Summary Header / Group Row
    const flmSummaryCols = [
      `▶ ${group.flm}`,
      'All HQs Total',
      ...pivotData.brands.map((b) => toLac(group.flmSubtotal[b])),
      toLac(group.flmTotal),
    ];
    const flmRow = worksheet.addRow(flmSummaryCols);
    flmRow.height = 22;

    flmRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 11, color: { argb: '1E3A8A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DBEAFE' }, // Light Blue accent
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '93C5FD' } },
        bottom: { style: 'thin', color: { argb: '93C5FD' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      };
      if (colNum >= 3) {
        cell.numFmt = '#,##0.00';
      }
    });

    // HQ Child Rows under this FLM
    group.hqList.forEach((hqItem, hqIdx) => {
      const hqRowCols = [
        '', // empty FLM column for indented hierarchy
        hqItem.hq,
        ...pivotData.brands.map((b) => toLac(hqItem.brandValues[b])),
        toLac(hqItem.rowTotal),
      ];
      const hqRow = worksheet.addRow(hqRowCols);
      hqRow.height = 19;

      hqRow.eachCell((cell, colNum) => {
        cell.font = { size: 10, color: { argb: '374151' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hqIdx % 2 === 0 ? 'FFFFFF' : 'F9FAFB' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'F3F4F6' } },
          bottom: { style: 'thin', color: { argb: 'F3F4F6' } },
          left: { style: 'thin', color: { argb: 'F3F4F6' } },
          right: { style: 'thin', color: { argb: 'F3F4F6' } },
        };
        if (colNum >= 3) {
          cell.numFmt = '#,##0.00';
        }
      });
    });
  });

  // Grand Total Row
  const grandTotalCols = [
    'GRAND TOTAL',
    'All Regions',
    ...pivotData.brands.map((b) => toLac(pivotData.columnGrandTotals[b])),
    toLac(pivotData.grandTotal),
  ];
  const grandTotalRow = worksheet.addRow(grandTotalCols);
  grandTotalRow.height = 26;

  grandTotalRow.eachCell((cell, colNum) => {
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Dark slate
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
    };
    if (colNum >= 3) {
      cell.numFmt = '#,##0.00';
    }
  });

  // Column widths
  worksheet.getColumn(1).width = 28;
  worksheet.getColumn(2).width = 24;
  pivotData.brands.forEach((_, idx) => {
    worksheet.getColumn(idx + 3).width = 16;
  });
  worksheet.getColumn(headerCols.length).width = 20;
}

/**
 * Builds the Chemist List Sheet
 */
function buildChemistSheet(worksheet: ExcelJS.Worksheet, chemistList: ChemistRecord[]) {
  const headers = [
    'Sl.N0.',
    'MHL CODE',
    'Cust code',
    'CUST NAME',
    'FSM-(NEW)2026-27 (FLM)',
    'AZURA HQ ( New Design)-2026-27 (HQ)',
  ];

  const headerRow = worksheet.addRow(headers);
  applyHeaderStyle(headerRow, '047857', 'FFFFFF'); // Emerald

  chemistList.forEach((chem, idx) => {
    const row = worksheet.addRow([
      chem.slNo || idx + 1,
      chem.mhlCode || '',
      chem.custCode,
      chem.custName,
      chem.fsmNew2627,
      chem.azuraHqNew2627,
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'F3F4F6' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
      };
    });
  });

  worksheet.columns.forEach((col, idx) => {
    let len = headers[idx] ? headers[idx].length : 14;
    if (idx === 3) len = 30; // CUST NAME
    if (idx === 4 || idx === 5) len = 25;
    col.width = len + 4;
  });
}

/**
 * Export: Consolidated File with FLM HQ BRAND CHEMIST.xlsx
 * Includes:
 * 1. HQ-Customer-Product Sales (Sheet 4 with Col P2: FLM, Col Q2: HQ)
 * 2. HQ-Customer Sales (Sheet 2 with Col K2: FLM, Col L2: HQ)
 * 3. SALES REPORT PIVOT (Pivot Table in Lac)
 * 4. DHK-MYN-KH (Chemist Master)
 */
export async function exportConsolidatedFile(
  salesRecords: SalesRecord[],
  customerRecords: CustomerSalesRecord[],
  pivotData: PivotTableData,
  chemistList: ChemistRecord[],
  dateHeader: string,
  fileName = 'Consolidated File with FLM HQ BRAND CHEMIST.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sales Data Analysis Workbench';
  workbook.created = new Date();

  // Sheet 1: HQ-Customer-Product Sales (Enriched Sheet 4)
  const salesSheet = workbook.addWorksheet('HQ-Customer-Product Sales', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });
  buildEnrichedSalesSheet(salesSheet, salesRecords, dateHeader);

  // Sheet 2: HQ-Customer Sales (Enriched Sheet 2 with K2: FLM, L2: HQ)
  if (customerRecords && customerRecords.length > 0) {
    const customerSheet = workbook.addWorksheet('HQ-Customer Sales', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
    });
    buildEnrichedHqCustomerSheet(customerSheet, customerRecords, dateHeader);
  }

  // Sheet 3: SALES REPORT PIVOT
  const pivotSheet = workbook.addWorksheet('SALES REPORT PIVOT', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
  });
  buildPivotReportSheet(pivotSheet, pivotData, dateHeader);

  // Sheet 4: DHK-MYN-KH (Chemist List)
  if (chemistList.length > 0) {
    const chemistSheet = workbook.addWorksheet('DHK-MYN-KH');
    buildChemistSheet(chemistSheet, chemistList);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}

/**
 * Export: SALES REPORT PIVOT.xlsx
 */
export async function exportPivotReportFile(
  pivotData: PivotTableData,
  dateHeader: string,
  fileName = 'SALES REPORT PIVOT.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sales Data Analysis Workbench';
  workbook.created = new Date();

  const pivotSheet = workbook.addWorksheet('SALES REPORT PIVOT', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
  });
  buildPivotReportSheet(pivotSheet, pivotData, dateHeader);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}
