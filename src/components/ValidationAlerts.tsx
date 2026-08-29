import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { FileValidationResult } from '../types';

interface ValidationAlertsProps {
  salesValidation?: FileValidationResult;
  chemistValidation?: FileValidationResult;
  lastMonthValidation?: FileValidationResult;
  isCompareMode?: boolean;
  unmatchedCount?: number;
  unmatchedCodes?: string[];
  onSelectSalesSheet?: (sheetName: string) => void;
  onSelectChemistSheet?: (sheetName: string) => void;
  onSelectLastMonthSheet?: (sheetName: string) => void;
}

export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({
  salesValidation,
  chemistValidation,
  lastMonthValidation,
  isCompareMode = false,
  unmatchedCount = 0,
  unmatchedCodes = [],
  onSelectSalesSheet,
  onSelectChemistSheet,
  onSelectLastMonthSheet,
}) => {
  const [expandedSales, setExpandedSales] = React.useState(false);
  const [expandedChemist, setExpandedChemist] = React.useState(false);
  const [expandedLastMonth, setExpandedLastMonth] = React.useState(false);
  const [showUnmatchedList, setShowUnmatchedList] = React.useState(false);

  const hasSalesIssues =
    salesValidation &&
    (salesValidation.missingColumns.length > 0 ||
      salesValidation.issues.some((i) => i.type === 'warning' || i.type === 'error'));

  const hasChemistIssues =
    chemistValidation &&
    (chemistValidation.missingColumns.length > 0 ||
      chemistValidation.issues.some((i) => i.type === 'warning' || i.type === 'error'));

  const hasLastMonthIssues =
    lastMonthValidation &&
    (lastMonthValidation.missingColumns.length > 0 ||
      lastMonthValidation.issues.some((i) => i.type === 'warning' || i.type === 'error'));

  if (!salesValidation && !chemistValidation && (!isCompareMode || !lastMonthValidation)) return null;

  return (
    <div id="validation-section" className="space-y-3 mb-6">
      {/* 1. Sales File Validation Warning / Status */}
      {salesValidation && (
        <div
          id="sales-validation-card"
          className={`rounded-xl border p-4 transition-all ${
            hasSalesIssues
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-200'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {hasSalesIssues ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">
                    Sales Data File Validation: {hasSalesIssues ? 'Formatting Notice / Warnings' : 'Format Verified Perfectly'}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/60 dark:bg-slate-800/60 border border-current/20">
                    Sheet: {salesValidation.sheetName} ({salesValidation.rowCount} rows)
                  </span>
                </div>

                <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                  {hasSalesIssues
                    ? 'Some columns or sheet configuration differed from standard format. Check details below.'
                    : 'Target sheet (HQ-Customer-Product Sales / Sheet 4), cell A1 Date header, and all 15 sales columns detected.'}
                </p>

                {/* Sheet Selector if multi-sheet */}
                {salesValidation.availableSheets.length > 1 && onSelectSalesSheet && (
                  <div className="mt-2 flex items-center space-x-2 text-xs">
                    <span className="font-medium">Active Sheet:</span>
                    <select
                      id="sales-sheet-select"
                      value={salesValidation.sheetName}
                      onChange={(e) => onSelectSalesSheet(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs cursor-pointer"
                    >
                      {salesValidation.availableSheets.map((s, idx) => (
                        <option key={s} value={s}>
                          Sheet {idx + 1}: {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setExpandedSales(!expandedSales)}
              className="text-xs flex items-center space-x-1 opacity-80 hover:opacity-100 cursor-pointer"
            >
              <span>{expandedSales ? 'Hide' : 'Check Columns'}</span>
              {expandedSales ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expandedSales && (
            <div className="mt-3 pt-3 border-t border-current/15 text-xs">
              <div className="font-medium mb-1">Expected Sales Columns Status:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {[
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
                ].map((col) => {
                  const isMissing = salesValidation.missingColumns.includes(col);
                  return (
                    <div
                      key={col}
                      className={`px-2 py-1 rounded flex items-center space-x-1.5 text-[11px] font-mono ${
                        isMissing
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300'
                          : 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      }`}
                    >
                      {isMissing ? (
                        <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{col}</span>
                    </div>
                  );
                })}
              </div>

              {/* Notice for new P and Q columns */}
              <div className="mt-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-2 rounded text-teal-800 dark:text-teal-200">
                ✨ <strong>Columns P & Q:</strong> Automatically appended as <code className="font-mono font-bold">P2: FLM</code> and <code className="font-mono font-bold">Q2: HQ</code> with VLOOKUP references to the Chemist list.
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Chemist File Validation Warning / Status */}
      {chemistValidation && (
        <div
          id="chemist-validation-card"
          className={`rounded-xl border p-4 transition-all ${
            hasChemistIssues
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-200'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {hasChemistIssues ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">
                    Chemist List File Validation: {hasChemistIssues ? 'Formatting Notice' : 'Format Verified Perfectly'}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/60 dark:bg-slate-800/60 border border-current/20">
                    Sheet: {chemistValidation.sheetName} ({chemistValidation.rowCount} chemists)
                  </span>
                </div>

                <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                  {hasChemistIssues
                    ? 'Expected sheet DHK-MYN-KH or target columns (Cust code, Col I: FSM-(NEW)2026-27, Col K: AZURA HQ) needed mapping.'
                    : 'Target sheet (DHK-MYN-KH), Cust code, Column I (FLM), and Column K (HQ) mapped successfully.'}
                </p>

                {/* Sheet Selector */}
                {chemistValidation.availableSheets.length > 1 && onSelectChemistSheet && (
                  <div className="mt-2 flex items-center space-x-2 text-xs">
                    <span className="font-medium">Active Sheet:</span>
                    <select
                      id="chemist-sheet-select"
                      value={chemistValidation.sheetName}
                      onChange={(e) => onSelectChemistSheet(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs cursor-pointer"
                    >
                      {chemistValidation.availableSheets.map((s, idx) => (
                        <option key={s} value={s}>
                          Sheet {idx + 1}: {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setExpandedChemist(!expandedChemist)}
              className="text-xs flex items-center space-x-1 opacity-80 hover:opacity-100 cursor-pointer"
            >
              <span>{expandedChemist ? 'Hide' : 'Check Columns'}</span>
              {expandedChemist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expandedChemist && (
            <div className="mt-3 pt-3 border-t border-current/15 text-xs">
              <div className="font-medium mb-1">Key Chemist Columns Mapped:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">Lookup Key:</div>
                  <div className="font-mono text-[11px]">Cust code ⇄ CUST_CODE</div>
                </div>
                <div className="p-2 rounded bg-teal-100/60 dark:bg-teal-950/40 border border-teal-300">
                  <div className="font-bold text-teal-800 dark:text-teal-300">FLM Column:</div>
                  <div className="font-mono text-[11px]">Col I / FSM-(NEW)2026-27 ➔ P (FLM)</div>
                </div>
                <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-950/40 border border-blue-300">
                  <div className="font-bold text-blue-800 dark:text-blue-300">HQ Column:</div>
                  <div className="font-mono text-[11px]">Col K / AZURA HQ ➔ Q (HQ)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Last Month Sales File Validation Warning / Status */}
      {isCompareMode && lastMonthValidation && (
        <div
          id="last-month-validation-card"
          className={`rounded-xl border p-4 transition-all ${
            hasLastMonthIssues
              ? 'bg-amber-50/80 border-amber-300 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-200'
              : 'bg-indigo-50/80 border-indigo-300 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-700 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {hasLastMonthIssues ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">
                    Last Month Sales File (Sheet 2) Validation: {hasLastMonthIssues ? 'Formatting Notice / Missing Columns' : 'Format Verified Perfectly'}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-white/60 dark:bg-slate-800/60 border border-current/20">
                    Default Sheet 2: {lastMonthValidation.sheetName} ({lastMonthValidation.rowCount} customer rows)
                  </span>
                </div>

                <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                  {hasLastMonthIssues
                    ? 'Some required columns for HQ-Customer Sales format are missing or differ. Check details below.'
                    : '2 number sheet (HQ-Customer Sales) set as default. All 10 required customer sales columns verified.'}
                </p>

                {/* Sheet Selector if user wants to override */}
                {lastMonthValidation.availableSheets.length > 1 && onSelectLastMonthSheet && (
                  <div className="mt-2 flex items-center space-x-2 text-xs">
                    <span className="font-medium">Active Sheet:</span>
                    <select
                      id="last-month-sheet-select"
                      value={lastMonthValidation.sheetName}
                      onChange={(e) => onSelectLastMonthSheet(e.target.value)}
                      className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs cursor-pointer font-medium"
                    >
                      {lastMonthValidation.availableSheets.map((s, idx) => (
                        <option key={s} value={s}>
                          Sheet {idx + 1}: {s} {idx === 1 ? '(Default Sheet 2: HQ-Customer Sales)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setExpandedLastMonth(!expandedLastMonth)}
              className="text-xs flex items-center space-x-1 opacity-80 hover:opacity-100 cursor-pointer"
            >
              <span>{expandedLastMonth ? 'Hide' : 'Check Columns'}</span>
              {expandedLastMonth ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expandedLastMonth && (
            <div className="mt-3 pt-3 border-t border-current/15 text-xs">
              <div className="font-medium mb-1">Sheet 2 (HQ-Customer Sales) 10 Required Columns Status:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {[
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
                ].map((col) => {
                  const isMissing = lastMonthValidation.missingColumns.includes(col);
                  return (
                    <div
                      key={col}
                      className={`px-2 py-1 rounded flex items-center space-x-1.5 text-[11px] font-mono ${
                        isMissing
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300'
                          : 'bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-300'
                      }`}
                    >
                      {isMissing ? (
                        <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                      )}
                      <span className="truncate">{col}</span>
                    </div>
                  );
                })}
              </div>

              {/* Notice for Comparison */}
              <div className="mt-2 bg-indigo-100/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-2 rounded text-indigo-800 dark:text-indigo-200">
                📊 <strong>Month-on-Month Comparison:</strong> Reads <code className="font-mono font-bold">SALES_VALUE</code> from Sheet 2 of this file as <code className="font-mono font-bold">SALES_VALUE_LAST</code> to calculate <code className="font-mono font-bold">Deficit</code> in the consolidated Sheet 2.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unmatched Warning if any */}
      {unmatchedCount > 0 && (
        <div
          id="unmatched-warning"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200 text-xs flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{unmatchedCount} customer codes</strong> in Sales data were not found in the Chemist List. Defaulted to "Unassigned FLM" and original HQ.
            </span>
          </div>
          {unmatchedCodes.length > 0 && (
            <button
              onClick={() => setShowUnmatchedList(!showUnmatchedList)}
              className="text-amber-800 dark:text-amber-300 underline font-medium cursor-pointer"
            >
              {showUnmatchedList ? 'Hide' : `View ${unmatchedCodes.length} Unmatched Codes`}
            </button>
          )}
        </div>
      )}

      {showUnmatchedList && unmatchedCodes.length > 0 && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Unmatched Customer Codes (CUST_CODE):
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
            {unmatchedCodes.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
