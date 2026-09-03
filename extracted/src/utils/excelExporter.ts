import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ChemistRecord, CustomerSalesRecord, PivotTableData, SalesRecord } from '../types';
import { generateMonthComparisonData } from './pivotEngine';

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
 * Builds Sheet 2: HQ-Customer Sales (Enriched with Col K/M: FLM, Col L/N: HQ, and Comparison if enabled)
 */
function buildEnrichedHqCustomerSheet(
  worksheet: ExcelJS.Worksheet,
  customerRecords: CustomerSalesRecord[],
  dateHeader: string,
  isCompareMode = false
) {
  if (isCompareMode) {
    // Comparison Mode
    // Row 1: Date text at top (Cell A1)
    const titleRow = worksheet.addRow([
      dateHeader ? `${dateHeader} (Month-on-Month Comparison)` : 'HQ-Customer Sales (Month-on-Month Comparison)',
    ]);
    titleRow.height = 24;
    titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: '1E3A8A' } };
    worksheet.mergeCells('A1:N1');
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 2: Headers (A2 to N2)
    const headers = [
      'HQ_CODE',
      'HQ_NAME',
      'CUST_CODE',
      'MHL_CUST_ID',
      'MHL_CUST_NAME',
      'PRODUCT_COUNT',
      'EXP_QTY_BOX',
      'EXP_VALUE',
      'SALES_QTY_BOX',
      'SALES_VALUE_CURRENT',
      'SALES_VALUE_LAST',
      'Deficit',
      'FLM',
      'HQ',
    ];

    const headerRow = worksheet.addRow(headers);
    applyHeaderStyle(headerRow, '1E40AF', 'FFFFFF');

    // Accent colors for headers
    headerRow.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }; // Current (Blue)
    headerRow.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } }; // Last (Indigo)
    headerRow.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BE123C' } }; // Deficit (Rose/Red)
    headerRow.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D9488' } }; // FLM (Teal)
    headerRow.getCell(14).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } }; // HQ (Dark Teal)

    // Data rows
    customerRecords.forEach((rec, idx) => {
      const curVal = rec.SALES_VALUE_CURRENT !== undefined ? rec.SALES_VALUE_CURRENT : rec.SALES_VALUE;
      const lastVal = rec.SALES_VALUE_LAST !== undefined ? rec.SALES_VALUE_LAST : 0;
      const deficitVal = rec.deficit !== undefined ? rec.deficit : curVal - lastVal;

      const row = worksheet.addRow([
        rec.HQ_CODE,
        rec.HQ_NAME,
        rec.CUST_CODE,
        rec.MHL_CUST_ID,
        rec.MHL_CUST_NAME,
        rec.PRODUCT_COUNT ?? rec.THERAPY ?? '',
        rec.EXP_QTY_BOX,
        rec.EXP_VALUE,
        rec.SALES_QTY_BOX,
        curVal,
        lastVal,
        deficitVal,
        rec.FLM,
        rec.HQ,
      ]);

      // Format numbers
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '#,##0.00';
      row.getCell(9).numFmt = '#,##0';
      row.getCell(10).numFmt = '#,##0.00';
      row.getCell(11).numFmt = '#,##0.00';
      row.getCell(12).numFmt = '#,##0.00;[Red]-#,##0.00;0.00';

      // Deficit font color (- value red text)
      if (deficitVal < 0) {
        row.getCell(12).font = { bold: true, color: { argb: 'DC2626' } }; // Red text
      } else if (deficitVal > 0) {
        row.getCell(12).font = { bold: true, color: { argb: '059669' } }; // Green text
      }

      // Highlight enriched FLM and HQ
      row.getCell(13).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'F0FDFA' : 'CCFBF1' },
      };
      row.getCell(14).fill = {
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
      if (idx === 9 || idx === 10 || idx === 11) maxLen = 20; // Sales values & Deficit
      if (idx === 12 || idx === 13) maxLen = 22; // FLM & HQ
      col.width = Math.max(maxLen + 4, 12);
    });
  } else {
    // Standard Mode (Original 12 columns)
    // Row 1: Date text at top (Cell A1)
    const titleRow = worksheet.addRow([dateHeader || 'Customer Sales Report (HQ-Customer Sales)']);
    titleRow.height = 24;
    titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: '1E3A8A' } };
    worksheet.mergeCells('A1:L1');
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    // Row 2: Headers (A2 to L2)
    const headers = [
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
        rec.PRODUCT_COUNT ?? rec.THERAPY ?? '',
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
}

/**
 * Builds Sheet: Current Month vs Last Month
 * Required Sheet Name: "Current Month vs Last Month"
 * Format matches the Pivot Table hierarchical structure (FLM -> HQ rows underneath):
 * Row 4: FLM (First Line Manager) | HQ (Headquarter) | CURRENT MONTH SALES | LAST MONTH SALES | DEFICIT
 * FLM Group Row:
 *   Col A: "► " + FLM
 *   Col B: "All HQs Total"
 *   Col C: FLM Current Sales
 *   Col D: FLM Last Sales
 *   Col E: FLM Deficit
 * HQ Rows under FLM:
 *   Col A: ""
 *   Col B: HQ
 *   Col C: HQ Current Sales
 *   Col D: HQ Last Sales
 *   Col E: HQ Deficit
 * Grand Total Row:
 *   Col A: "TOTAL"
 *   Col B: "All Regions Total"
 *   Col C: Total Current Sales
 *   Col D: Total Last Sales
 *   Col E: Total Deficit
 */
export function buildCurrentVsLastMonthSheet(
  worksheet: ExcelJS.Worksheet,
  customerRecords: CustomerSalesRecord[],
  dateHeader: string
) {
  const { flmGroups, totalCurrentSales, totalLastSales, totalDeficit } =
    generateMonthComparisonData(customerRecords);

  // Conversion helper: 10,000 = 0.10, 100,000 = 1.00 (figures in Lac)
  const toLac = (val: number | undefined | null) => {
    if (!val) return 0;
    return Number((val / 100000).toFixed(2));
  };

  // Title Row
  const titleText = dateHeader
    ? `${dateHeader} - CURRENT MONTH VS LAST MONTH SALES COMPARISON (Value in Lac)`
    : 'CURRENT MONTH VS LAST MONTH SALES COMPARISON (Value in Lac)';
  const titleRow = worksheet.addRow([titleText]);
  titleRow.height = 28;
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: '1E3A8A' } };
  worksheet.mergeCells('A1:E1');
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Subtitle Row
  const subRow = worksheet.addRow([
    'Month-on-Month Performance Analysis | Value in Lac (10,000 = 0.10 | 100,000 = 1.00) | Formula: DEFICIT = CURRENT MONTH SALES - LAST MONTH SALES | Structure: FLM (First Line Manager) > HQ (Headquarter)',
  ]);
  subRow.height = 20;
  subRow.getCell(1).font = { italic: true, size: 10, color: { argb: '4B5563' } };
  worksheet.mergeCells('A2:E2');
  subRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Blank Row
  worksheet.addRow([]);

  // Table Headers (Row 4): Matches the exact screenshot layout
  const headerRow = worksheet.addRow([
    'FLM (First Line Manager)',
    'HQ (Headquarter)',
    'CURRENT MONTH SALES',
    'LAST MONTH SALES',
    'DEFICIT',
  ]);
  headerRow.height = 28;
  applyHeaderStyle(headerRow, '1E3A8A', 'FFFFFF');

  // Loop through each FLM Group
  flmGroups.forEach((group) => {
    // 1. FLM Summary Group Header Row (Col A: ► FLM, Col B: All HQs Total)
    const flmSummaryRow = worksheet.addRow([
      `► ${group.flm}`,
      'All HQs Total',
      toLac(group.currentSales),
      toLac(group.lastSales),
      toLac(group.deficit),
    ]);
    flmSummaryRow.height = 22;

    flmSummaryRow.eachCell((cell, colNum) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DBEAFE' }, // Light Blue Tint matching screenshot
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '93C5FD' } },
        bottom: { style: 'thin', color: { argb: '93C5FD' } },
        left: { style: 'thin', color: { argb: 'BFDBFE' } },
        right: { style: 'thin', color: { argb: 'BFDBFE' } },
      };

      if (colNum === 1) {
        cell.font = { bold: true, size: 11, color: { argb: '1E3A8A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colNum === 2) {
        cell.font = { bold: true, size: 11, color: { argb: '1E40AF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colNum === 3 || colNum === 4) {
        cell.numFmt = '#,##0.00';
        cell.font = { bold: true, size: 11, color: { argb: '1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colNum === 5) {
        cell.numFmt = '#,##0.00;[Red]-#,##0.00;0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (group.deficit < 0) {
          cell.font = { bold: true, size: 11, color: { argb: 'DC2626' } };
        } else if (group.deficit > 0) {
          cell.font = { bold: true, size: 11, color: { argb: '059669' } };
        } else {
          cell.font = { bold: true, size: 11, color: { argb: '64748B' } };
        }
      }
    });

    // 2. HQ Child Rows under this FLM (Col A is blank, Col B is HQ name)
    group.hqList.forEach((hqItem, hqIdx) => {
      const hqRow = worksheet.addRow([
        '', // Empty FLM column for hierarchical indent
        hqItem.hq,
        toLac(hqItem.currentSales),
        toLac(hqItem.lastSales),
        toLac(hqItem.deficit),
      ]);
      hqRow.height = 20;

      const isEven = hqIdx % 2 === 0;
      hqRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum <= 5) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFF' : 'F9FAFB' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'F1F5F9' } },
            bottom: { style: 'thin', color: { argb: 'F1F5F9' } },
            left: { style: 'thin', color: { argb: 'F1F5F9' } },
            right: { style: 'thin', color: { argb: 'F1F5F9' } },
          };

          if (colNum === 2) {
            cell.font = { size: 10, color: { argb: '334155' } };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else if (colNum === 3 || colNum === 4) {
            cell.numFmt = '#,##0.00';
            cell.font = { size: 10, color: { argb: '1E293B' } };
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          } else if (colNum === 5) {
            cell.numFmt = '#,##0.00;[Red]-#,##0.00;0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            if (hqItem.deficit < 0) {
              cell.font = { bold: true, size: 10, color: { argb: 'DC2626' } };
            } else if (hqItem.deficit > 0) {
              cell.font = { bold: true, size: 10, color: { argb: '059669' } };
            } else {
              cell.font = { size: 10, color: { argb: '64748B' } };
            }
          }
        }
      });
    });
  });

  // Grand Total Row
  const grandTotalRow = worksheet.addRow([
    'TOTAL',
    'All Regions Total',
    toLac(totalCurrentSales),
    toLac(totalLastSales),
    toLac(totalDeficit),
  ]);
  grandTotalRow.height = 26;
  grandTotalRow.eachCell((cell, colNum) => {
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Dark slate
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '64748B' } },
      bottom: { style: 'double', color: { argb: 'FFFFFF' } },
      left: { style: 'thin', color: { argb: '334155' } },
      right: { style: 'thin', color: { argb: '334155' } },
    };

    if (colNum >= 3) {
      cell.numFmt = '#,##0.00';
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      if (colNum === 5) {
        cell.numFmt = '#,##0.00;[Red]-#,##0.00;0.00';
        if (totalDeficit < 0) {
          cell.font = { bold: true, size: 11, color: { argb: 'FCA5A5' } };
        } else if (totalDeficit > 0) {
          cell.font = { bold: true, size: 11, color: { argb: '86EFAC' } };
        }
      }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'center' : 'left' };
    }
  });

  // Auto column widths
  worksheet.columns = [
    { width: 30 }, // Col A: FLM (First Line Manager)
    { width: 36 }, // Col B: HQ (Headquarter)
    { width: 25 }, // Col C: CURRENT MONTH SALES
    { width: 25 }, // Col D: LAST MONTH SALES
    { width: 22 }, // Col E: DEFICIT
  ];
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

const MONTH_MAP: Record<string, string> = {
  '01': 'Jan', '1': 'Jan',
  '02': 'Feb', '2': 'Feb',
  '03': 'Mar', '3': 'Mar',
  '04': 'Apr', '4': 'Apr',
  '05': 'May', '5': 'May',
  '06': 'Jun', '6': 'Jun',
  '07': 'Jul', '7': 'Jul',
  '08': 'Aug', '8': 'Aug',
  '09': 'Sep', '9': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
};

/**
 * Generate formatted filename with dynamic Date Range, e.g.:
 * "Consolidated Sales File Upto-31 Aug.xlsx"
 */
export function getConsolidatedFileName(dateHeader: string): string {
  if (!dateHeader || !dateHeader.trim()) {
    return 'Consolidated Sales File.xlsx';
  }

  const str = dateHeader.trim();

  // Pattern 1: "To : 31/08/2026" or "To: 31-08-2026" or "To: 31/08/26"
  const toNumMatch = str.match(/To\s*:\s*(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/i) ||
                     str.match(/To\s+(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/i);
  if (toNumMatch) {
    const day = parseInt(toNumMatch[1], 10);
    const monthNum = toNumMatch[2];
    const monthName = MONTH_MAP[monthNum] || monthNum;
    return `Consolidated Sales File Upto-${day} ${monthName}.xlsx`;
  }

  // Pattern 2: "To : 31-Aug-2026" or "To : 31 Aug 2026"
  const toNamedMatch = str.match(/To\s*:\s*(\d{1,2})[\s-]*([A-Za-z]{3,9})/i) ||
                       str.match(/To\s+(\d{1,2})[\s-]*([A-Za-z]{3,9})/i);
  if (toNamedMatch) {
    const day = parseInt(toNamedMatch[1], 10);
    const month = toNamedMatch[2].substring(0, 3);
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `Consolidated Sales File Upto-${day} ${formattedMonth}.xlsx`;
  }

  // Pattern 3: "Upto 31/08/2026" or "Upto-31/08/2026" or "Upto 31 Aug"
  const uptoMatch = str.match(/Upto\s*[-:]?\s*(\d{1,2})[/-](\d{1,2})/i);
  if (uptoMatch) {
    const day = parseInt(uptoMatch[1], 10);
    const monthNum = uptoMatch[2];
    const monthName = MONTH_MAP[monthNum] || monthNum;
    return `Consolidated Sales File Upto-${day} ${monthName}.xlsx`;
  }

  const uptoNameMatch = str.match(/Upto\s*[-:]?\s*(\d{1,2})\s*([A-Za-z]{3,9})/i);
  if (uptoNameMatch) {
    const day = parseInt(uptoNameMatch[1], 10);
    const month = uptoNameMatch[2].substring(0, 3);
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `Consolidated Sales File Upto-${day} ${formattedMonth}.xlsx`;
  }

  // Pattern 4: Any ending date in string like 31/08/2026
  const endDates = [...str.matchAll(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/g)];
  if (endDates.length > 0) {
    const lastDate = endDates[endDates.length - 1];
    const day = parseInt(lastDate[1], 10);
    const monthNum = lastDate[2];
    const monthName = MONTH_MAP[monthNum] || monthNum;
    return `Consolidated Sales File Upto-${day} ${monthName}.xlsx`;
  }

  // Pattern 5: Fallback - sanitize range string
  const cleanRange = str.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  return `Consolidated Sales File - ${cleanRange}.xlsx`;
}

/**
 * Export: Consolidated Sales File with Date Range (e.g. Consolidated Sales File Upto-31 Aug.xlsx)
 * Output consolidated file sheet serial:
 * 1. SALES REPORT PIVOT (Pivot Table in Lac)
 * 2. Current Month vs Last Month (MoM Performance - if compare mode enabled)
 * 3. HQ-Customer Sales (Enriched Sheet 2 with FLM, HQ and Comparison)
 * 4. HQ-Customer-Product Sales (Enriched Sheet 4 with FLM, HQ)
 * 5. DHK-MYN-KH (Chemist Master)
 */
export async function exportConsolidatedFile(
  salesRecords: SalesRecord[],
  customerRecords: CustomerSalesRecord[],
  pivotData: PivotTableData,
  chemistList: ChemistRecord[],
  dateHeader: string,
  fileName?: string,
  isCompareMode = false
) {
  const actualFileName = fileName || getConsolidatedFileName(dateHeader);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sales Data Analysis Workbench';
  workbook.created = new Date();

  // Sheet 1: SALES REPORT PIVOT
  const pivotSheet = workbook.addWorksheet('SALES REPORT PIVOT', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
  });
  buildPivotReportSheet(pivotSheet, pivotData, dateHeader);

  // Sheet 2: Current Month vs Last Month
  // Added ONLY if user has toggled Last Month / compare mode ON and customerRecords has last month data
  const hasLastMonthData =
    isCompareMode &&
    customerRecords &&
    customerRecords.some((r) => r.SALES_VALUE_LAST !== undefined);

  if (hasLastMonthData) {
    const compareSheet = workbook.addWorksheet('Current Month vs Last Month', {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }],
    });
    buildCurrentVsLastMonthSheet(compareSheet, customerRecords, dateHeader);
  }

  // Sheet 3: HQ-Customer Sales (Enriched Sheet 2 with FLM, HQ and Comparison if enabled)
  if (customerRecords && customerRecords.length > 0) {
    const customerSheet = workbook.addWorksheet('HQ-Customer Sales', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
    });
    buildEnrichedHqCustomerSheet(customerSheet, customerRecords, dateHeader, isCompareMode);
  }

  // Sheet 4: HQ-Customer-Product Sales (Enriched Sheet 4)
  const salesSheet = workbook.addWorksheet('HQ-Customer-Product Sales', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });
  buildEnrichedSalesSheet(salesSheet, salesRecords, dateHeader);

  // Sheet 5: DHK-MYN-KH (Chemist List)
  if (chemistList.length > 0) {
    const chemistSheet = workbook.addWorksheet('DHK-MYN-KH');
    buildChemistSheet(chemistSheet, chemistList);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, actualFileName);
}

/**
 * Export: Standalone Current Month vs Last Month Comparison Report (.xlsx)
 */
export async function exportCurrentVsLastMonthFile(
  customerRecords: CustomerSalesRecord[],
  dateHeader: string,
  fileName = 'Current Month vs Last Month.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sales Data Analysis Workbench';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Current Month vs Last Month', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }],
  });
  buildCurrentVsLastMonthSheet(worksheet, customerRecords, dateHeader);

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
