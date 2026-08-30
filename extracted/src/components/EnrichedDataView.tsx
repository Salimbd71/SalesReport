import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  GitCompare,
  TrendingDown,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { CustomerSalesRecord, SalesRecord } from '../types';

interface EnrichedDataViewProps {
  records: SalesRecord[];
  customerRecords?: CustomerSalesRecord[];
  dateHeader: string;
  isCompareMode?: boolean;
  onExportConsolidated: () => void;
  isExportingConsolidated?: boolean;
}

export const EnrichedDataView: React.FC<EnrichedDataViewProps> = ({
  records,
  customerRecords = [],
  dateHeader,
  isCompareMode = false,
  onExportConsolidated,
  isExportingConsolidated = false,
}) => {
  // Sub-view switch: Sheet 4 (Product Sales) or Sheet 2 (Customer Sales)
  const [subView, setSubView] = useState<'sheet4' | 'sheet2'>('sheet4');

  // Shared Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedFlm, setSelectedFlm] = useState<string>('ALL');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'MATCHED' | 'UNMATCHED'>('ALL');
  const [compareFilter, setCompareFilter] = useState<'ALL' | 'DEFICIT_ONLY' | 'GROWTH_ONLY' | 'LAST_ONLY' | 'CURRENT_ONLY'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Extract unique brands (from Sheet 4)
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.BRAND && set.add(r.BRAND));
    return Array.from(set).sort();
  }, [records]);

  // Extract unique FLMs (from current active subView)
  const uniqueFlms = useMemo(() => {
    const set = new Set<string>();
    if (subView === 'sheet4') {
      records.forEach((r) => r.FLM && set.add(r.FLM));
    } else {
      customerRecords.forEach((r) => r.FLM && set.add(r.FLM));
    }
    return Array.from(set).sort();
  }, [subView, records, customerRecords]);

  // Filtered records for Sheet 4
  const filteredSheet4Records = useMemo(() => {
    return records.filter((r) => {
      if (selectedBrand !== 'ALL' && r.BRAND !== selectedBrand) return false;
      if (selectedFlm !== 'ALL' && r.FLM !== selectedFlm) return false;
      if (matchFilter === 'MATCHED' && !r.isMatched) return false;
      if (matchFilter === 'UNMATCHED' && r.isMatched) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          r.CUST_CODE.toLowerCase().includes(q) ||
          r.MHL_CUST_NAME.toLowerCase().includes(q) ||
          r.HQ_NAME.toLowerCase().includes(q) ||
          r.FLM.toLowerCase().includes(q) ||
          r.HQ.toLowerCase().includes(q) ||
          r.BRAND.toLowerCase().includes(q) ||
          r.ITEM_NAME.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, selectedBrand, selectedFlm, matchFilter, searchTerm]);

  // Filtered records for Sheet 2
  const filteredSheet2Records = useMemo(() => {
    return customerRecords.filter((r) => {
      if (selectedFlm !== 'ALL' && r.FLM !== selectedFlm) return false;
      if (matchFilter === 'MATCHED' && !r.isMatched) return false;
      if (matchFilter === 'UNMATCHED' && r.isMatched) return false;

      if (isCompareMode) {
        const deficit = r.deficit !== undefined ? r.deficit : (r.SALES_VALUE_CURRENT || 0) - (r.SALES_VALUE_LAST || 0);
        if (compareFilter === 'DEFICIT_ONLY' && deficit >= 0) return false;
        if (compareFilter === 'GROWTH_ONLY' && deficit <= 0) return false;
        if (compareFilter === 'LAST_ONLY' && !r.isLastMonthOnly) return false;
        if (compareFilter === 'CURRENT_ONLY' && !r.isCurrentMonthOnly) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          r.CUST_CODE.toLowerCase().includes(q) ||
          r.MHL_CUST_NAME.toLowerCase().includes(q) ||
          r.HQ_NAME.toLowerCase().includes(q) ||
          r.FLM.toLowerCase().includes(q) ||
          r.HQ.toLowerCase().includes(q) ||
          String(r.PRODUCT_COUNT || r.THERAPY || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [customerRecords, selectedFlm, matchFilter, compareFilter, isCompareMode, searchTerm]);

  // Sheet 2 Comparison Summary Stats
  const comparisonStats = useMemo(() => {
    if (!isCompareMode || customerRecords.length === 0) return null;
    let currentTotal = 0;
    let lastTotal = 0;
    let deficitCount = 0;
    let growthCount = 0;
    let lastOnlyCount = 0;

    customerRecords.forEach((r) => {
      const cur = r.SALES_VALUE_CURRENT !== undefined ? r.SALES_VALUE_CURRENT : r.SALES_VALUE;
      const last = r.SALES_VALUE_LAST !== undefined ? r.SALES_VALUE_LAST : 0;
      const def = r.deficit !== undefined ? r.deficit : cur - last;
      currentTotal += cur;
      lastTotal += last;
      if (def < 0) deficitCount++;
      if (def > 0) growthCount++;
      if (r.isLastMonthOnly) lastOnlyCount++;
    });

    const netDeficit = currentTotal - lastTotal;
    return {
      currentTotal,
      lastTotal,
      netDeficit,
      deficitCount,
      growthCount,
      lastOnlyCount,
      totalCount: customerRecords.length,
    };
  }, [customerRecords, isCompareMode]);

  const activeRecordsCount = subView === 'sheet4' ? filteredSheet4Records.length : filteredSheet2Records.length;
  const totalPages = Math.ceil(activeRecordsCount / pageSize) || 1;

  const paginatedSheet4 = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSheet4Records.slice(start, start + pageSize);
  }, [filteredSheet4Records, currentPage, pageSize]);

  const paginatedSheet2 = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSheet2Records.slice(start, start + pageSize);
  }, [filteredSheet2Records, currentPage, pageSize]);

  return (
    <div id="enriched-data-container" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Top Banner & Sheet Selection */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Enriched Sales Data Tables (VLOOKUP Mapped)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Both Sheet 4 and Sheet 2 enriched with FLM & HQ from Chemist List Master
              {isCompareMode && (
                <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                  • Month-on-Month Comparison Active on Sheet 2
                </span>
              )}
            </p>
          </div>

          {/* Export Action */}
          <button
            onClick={onExportConsolidated}
            disabled={isExportingConsolidated}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer self-start lg:self-auto"
          >
            {isExportingConsolidated ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingConsolidated ? 'Exporting Consolidated...' : 'Export Consolidated File (.xlsx)'}</span>
          </button>
        </div>

        {/* Sub-view Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5">
          <button
            id="subtab-sheet4"
            type="button"
            onClick={() => {
              setSubView('sheet4');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subView === 'sheet4'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sheet 4: HQ-Customer-Product Sales</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              subView === 'sheet4' ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              Col P (FLM) & Q (HQ) • {records.length.toLocaleString()} rows
            </span>
          </button>

          <button
            id="subtab-sheet2"
            type="button"
            onClick={() => {
              setSubView('sheet2');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subView === 'sheet2'
                ? 'bg-teal-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sheet 2: HQ-Customer Sales</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              subView === 'sheet2' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {isCompareMode ? 'Comparison (Current vs Last)' : 'Col K (FLM) & L (HQ)'} • {customerRecords.length.toLocaleString()} rows
            </span>
          </button>
        </div>
      </div>

      {/* Comparison Summary Metric Cards (When Sheet 2 & Compare Mode is active) */}
      {subView === 'sheet2' && isCompareMode && comparisonStats && (
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">SALES_VALUE_CURRENT</div>
              <div className="text-sm sm:text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                ৳{comparisonStats.currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">SALES_VALUE_LAST</div>
              <div className="text-sm sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                ৳{comparisonStats.lastTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border shadow-sm ${
              comparisonStats.netDeficit < 0
                ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30'
                : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30'
            }`}>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>Net Deficit / Growth</span>
                {comparisonStats.netDeficit < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                comparisonStats.netDeficit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                ৳{comparisonStats.netDeficit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Deficit Chemist Count</div>
              <div className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {comparisonStats.deficitCount.toLocaleString()} / {comparisonStats.totalCount.toLocaleString()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, chemist, FLM, HQ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            />
          </div>

          {/* Brand Filter (Only in Sheet 4) */}
          {subView === 'sheet4' ? (
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
              >
                <option value="ALL">All Brands ({uniqueBrands.length})</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          ) : isCompareMode ? (
            /* Deficit / Comparison Filter (In Sheet 2 when compare mode is active) */
            <div>
              <select
                value={compareFilter}
                onChange={(e) => {
                  setCompareFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
              >
                <option value="ALL">All Month Comparisons</option>
                <option value="DEFICIT_ONLY">📉 Deficit Only (Drop / Negative)</option>
                <option value="GROWTH_ONLY">📈 Growth Only (Positive)</option>
                <option value="LAST_ONLY">⏮ Last Month Only (0 in Current)</option>
                <option value="CURRENT_ONLY">⏭ Current Month Only (0 in Last)</option>
              </select>
            </div>
          ) : null}

          {/* FLM Filter */}
          <div>
            <select
              value={selectedFlm}
              onChange={(e) => {
                setSelectedFlm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            >
              <option value="ALL">All FLMs ({uniqueFlms.length})</option>
              {uniqueFlms.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Match Status Filter */}
          <div>
            <select
              value={matchFilter}
              onChange={(e) => {
                setMatchFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            >
              <option value="ALL">All Match Status</option>
              <option value="MATCHED">✓ Matched in Chemist List</option>
              <option value="UNMATCHED">⚠ Unmatched / Unassigned</option>
            </select>
          </div>

        </div>
      </div>

      {/* Date Banner */}
      {dateHeader && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/50 px-6 py-2 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold">A1 Date Header:</span>
          <span className="font-mono">{dateHeader}</span>
        </div>
      )}

      {/* Table Display */}
      <div className="overflow-x-auto max-h-[550px] relative">
        {subView === 'sheet4' ? (
          /* Sheet 4: HQ-Customer-Product Sales Table */
          <table id="enriched-sales-table-sheet4" className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-slate-300 border-r border-slate-800">#</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[100px]">CUST_CODE</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[180px]">MHL_CUST_NAME</th>
                
                {/* Highlighted New Columns: P (FLM) and Q (HQ) */}
                <th className="py-2.5 px-3 font-bold text-teal-200 bg-teal-900/80 border-r border-teal-700 min-w-[180px]">
                  ★ P2: FLM (VLOOKUP)
                </th>
                <th className="py-2.5 px-3 font-bold text-teal-200 bg-teal-900/80 border-r border-teal-700 min-w-[150px]">
                  ★ Q2: HQ (VLOOKUP)
                </th>

                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[120px]">BRAND</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[140px]">THERAPY</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[160px]">ITEM_NAME</th>
                <th className="py-2.5 px-3 font-semibold text-right text-slate-100 border-r border-slate-800 min-w-[100px]">SALES_QTY</th>
                <th className="py-2.5 px-3 font-bold text-right text-emerald-300 bg-slate-950 border-r border-slate-800 min-w-[120px]">
                  SALES_VALUE (৳)
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[110px]">Orig HQ_NAME</th>
                <th className="py-2.5 px-3 font-semibold text-center text-slate-100 min-w-[90px]">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedSheet4.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400 italic">
                    No records matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedSheet4.map((rec, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={rec.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {globalIndex}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800">
                        {rec.CUST_CODE}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 truncate max-w-[200px]">
                        {rec.MHL_CUST_NAME || '-'}
                      </td>

                      <td className="py-2 px-3 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40 truncate max-w-[180px]">
                        {rec.FLM}
                      </td>

                      <td className="py-2 px-3 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40 truncate max-w-[150px]">
                        {rec.HQ}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {rec.BRAND}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {rec.THERAPY}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 truncate max-w-[160px]">
                        {rec.ITEM_NAME}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {rec.SALES_QTY_BOX.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                        ৳{rec.SALES_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {rec.HQ_NAME}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {rec.isMatched ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Matched</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Unmatched</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Sheet 2: HQ-Customer Sales Table (Supports Compare Mode) */
          <table id="enriched-sales-table-sheet2" className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-slate-300 border-r border-slate-800">#</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[100px]">CUST_CODE</th>
                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[200px]">MHL_CUST_NAME</th>
                
                {/* Highlighted FLM and HQ for Sheet 2 */}
                <th className="py-2.5 px-3 font-bold text-teal-200 bg-teal-900/80 border-r border-teal-700 min-w-[180px]">
                  ★ {isCompareMode ? 'M2: FLM (VLOOKUP)' : 'K2: FLM (VLOOKUP)'}
                </th>
                <th className="py-2.5 px-3 font-bold text-teal-200 bg-teal-900/80 border-r border-teal-700 min-w-[150px]">
                  ★ {isCompareMode ? 'N2: HQ (VLOOKUP)' : 'L2: HQ (VLOOKUP)'}
                </th>

                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[140px]">PRODUCT_COUNT</th>
                
                {isCompareMode ? (
                  /* Comparison Columns */
                  <>
                    <th className="py-2.5 px-3 font-bold text-right text-blue-200 bg-blue-950 border-r border-slate-800 min-w-[140px]">
                      SALES_VALUE_CURRENT (৳)
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right text-indigo-200 bg-indigo-950 border-r border-slate-800 min-w-[140px]">
                      SALES_VALUE_LAST (৳)
                    </th>
                    <th className="py-2.5 px-3 font-bold text-right text-rose-200 bg-rose-950 border-r border-slate-800 min-w-[130px]">
                      Deficit (৳)
                    </th>
                  </>
                ) : (
                  /* Standard Mode Columns */
                  <>
                    <th className="py-2.5 px-3 font-semibold text-right text-slate-100 border-r border-slate-800 min-w-[100px]">EXP_QTY</th>
                    <th className="py-2.5 px-3 font-semibold text-right text-slate-100 border-r border-slate-800 min-w-[110px]">EXP_VALUE</th>
                    <th className="py-2.5 px-3 font-semibold text-right text-slate-100 border-r border-slate-800 min-w-[100px]">SALES_QTY</th>
                    <th className="py-2.5 px-3 font-bold text-right text-emerald-300 bg-slate-950 border-r border-slate-800 min-w-[120px]">
                      SALES_VALUE (৳)
                    </th>
                  </>
                )}

                <th className="py-2.5 px-3 font-semibold text-slate-100 border-r border-slate-800 min-w-[110px]">Orig HQ_NAME</th>
                <th className="py-2.5 px-3 font-semibold text-center text-slate-100 min-w-[100px]">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedSheet2.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400 italic">
                    No records in Sheet 2 (HQ-Customer Sales) or none match filter.
                  </td>
                </tr>
              ) : (
                paginatedSheet2.map((rec, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const curVal = rec.SALES_VALUE_CURRENT !== undefined ? rec.SALES_VALUE_CURRENT : rec.SALES_VALUE;
                  const lastVal = rec.SALES_VALUE_LAST !== undefined ? rec.SALES_VALUE_LAST : 0;
                  const deficitVal = rec.deficit !== undefined ? rec.deficit : curVal - lastVal;

                  return (
                    <tr
                      key={rec.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {globalIndex}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800">
                        {rec.CUST_CODE}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 truncate max-w-[220px]">
                        {rec.MHL_CUST_NAME || '-'}
                      </td>

                      {/* FLM column */}
                      <td className="py-2 px-3 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40 truncate max-w-[180px]">
                        {rec.FLM}
                      </td>

                      {/* HQ column */}
                      <td className="py-2 px-3 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40 truncate max-w-[150px]">
                        {rec.HQ}
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                        {rec.PRODUCT_COUNT || rec.THERAPY || '-'}
                      </td>

                      {isCompareMode ? (
                        /* Compare Mode Columns */
                        <>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20 border-r border-slate-100 dark:border-slate-800">
                            ৳{curVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 border-r border-slate-100 dark:border-slate-800">
                            ৳{lastVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono font-bold border-r border-slate-100 dark:border-slate-800 ${
                            deficitVal < 0
                              ? 'text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30'
                              : deficitVal > 0
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {deficitVal < 0 ? `-৳${Math.abs(deficitVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `৳${deficitVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </td>
                        </>
                      ) : (
                        /* Standard Mode Columns */
                        <>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                            {rec.EXP_QTY_BOX.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                            ৳{rec.EXP_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                            {rec.SALES_QTY_BOX.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                            ৳{rec.SALES_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </>
                      )}

                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {rec.HQ_NAME}
                      </td>

                      <td className="py-2 px-3 text-center">
                        {rec.isLastMonthOnly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                            Last Month Only
                          </span>
                        ) : rec.isCurrentMonthOnly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                            Current Only
                          </span>
                        ) : rec.isMatched ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Matched</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Unmatched</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * pageSize, activeRecordsCount)}</strong> of{' '}
          <strong>{activeRecordsCount.toLocaleString()}</strong> rows (Total: {subView === 'sheet4' ? records.length.toLocaleString() : customerRecords.length.toLocaleString()})
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
