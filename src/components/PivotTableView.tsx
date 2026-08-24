import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Search,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  DollarSign,
  TrendingUp,
  Table as TableIcon
} from 'lucide-react';
import { PivotTableData } from '../types';

interface PivotTableViewProps {
  pivotData: PivotTableData;
  dateHeader: string;
  onExportPivot: () => void;
  onExportConsolidated: () => void;
}

export const PivotTableView: React.FC<PivotTableViewProps> = ({
  pivotData,
  dateHeader,
  onExportPivot,
  onExportConsolidated,
}) => {
  const [collapsedFlms, setCollapsedFlms] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [formatMode, setFormatMode] = useState<'lac' | 'currency' | 'raw'>('lac');
  const [sortBy, setSortBy] = useState<'default' | 'sales_desc'>('default');

  const toggleFlm = (flm: string) => {
    setCollapsedFlms((prev) => {
      const next = new Set(prev);
      if (next.has(flm)) next.delete(flm);
      else next.add(flm);
      return next;
    });
  };

  const collapseAll = () => {
    const all = new Set(pivotData.flmGroups.map((g) => g.flm));
    setCollapsedFlms(all);
  };

  const expandAll = () => {
    setCollapsedFlms(new Set());
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === 0) return '-';
    if (formatMode === 'lac') {
      // 10000 = 0.10, 100000 = 1.00
      const inLac = num / 100000;
      return inLac.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (formatMode === 'raw') {
      return num.toLocaleString();
    }
    return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter groups based on search
  const filteredGroups = pivotData.flmGroups
    .map((group) => {
      if (!searchQuery) return group;
      const q = searchQuery.toLowerCase();
      const flmMatches = group.flm.toLowerCase().includes(q);
      const filteredHqs = group.hqList.filter(
        (h) =>
          h.hq.toLowerCase().includes(q) ||
          Object.keys(h.brandValues).some((b) => b.toLowerCase().includes(q))
      );
      if (flmMatches) return group;
      if (filteredHqs.length > 0) {
        return {
          ...group,
          hqList: filteredHqs,
        };
      }
      return null;
    })
    .filter(Boolean) as typeof pivotData.flmGroups;

  if (sortBy === 'sales_desc') {
    filteredGroups.sort((a, b) => b.flmTotal - a.flmTotal);
  }

  return (
    <div id="pivot-table-container" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Pivot Header Toolbar */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <TableIcon className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                SALES REPORT PIVOT TABLE
              </h3>
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                Value in Lac (100,000 = 1.00)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Structure: <strong>Rows: FLM &gt; HQ</strong> | <strong>Columns: BRAND (Column G / G2)</strong> | <strong>Value: Sum of SALES_VALUE in Lac</strong>
            </p>
          </div>

          {/* Quick controls & actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="pivot-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FLM, HQ, Brand..."
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={expandAll}
              title="Expand all FLM groups"
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Expand</span>
            </button>
            <button
              onClick={collapseAll}
              title="Collapse all FLM groups"
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Collapse</span>
            </button>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'default' ? 'sales_desc' : 'default')}
              className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium cursor-pointer flex items-center space-x-1 transition-colors ${
                sortBy === 'sales_desc'
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
              title="Toggle sorting by highest sales"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortBy === 'sales_desc' ? 'Sorted by Sales' : 'Sort: Default'}</span>
            </button>

            {/* Format Mode Toggle */}
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden text-xs">
              <button
                onClick={() => setFormatMode('lac')}
                className={`px-2.5 py-1.5 cursor-pointer font-bold ${
                  formatMode === 'lac'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
                title="100,000 = 1.00 Lac, 10,000 = 0.10 Lac"
              >
                In Lac (1.00 = 100k)
              </button>
              <button
                onClick={() => setFormatMode('currency')}
                className={`px-2.5 py-1.5 cursor-pointer font-medium ${
                  formatMode === 'currency'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                ৳ BDT
              </button>
              <button
                onClick={() => setFormatMode('raw')}
                className={`px-2.5 py-1.5 cursor-pointer font-medium ${
                  formatMode === 'raw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Raw Num
              </button>
            </div>

            {/* Download Pivot Excel */}
            <button
              id="btn-download-pivot-table"
              onClick={onExportPivot}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm cursor-pointer ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SALES REPORT PIVOT.xlsx</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Banner above Pivot Table */}
      {dateHeader && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/50 px-6 py-2 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold">Report Date (A1):</span>
          <span className="font-mono">{dateHeader}</span>
        </div>
      )}

      {/* Pivot Table Grid */}
      <div className="overflow-x-auto max-h-[600px] relative">
        <table id="sales-pivot-grid" className="w-full text-left border-collapse text-xs">
          
          {/* Table Header */}
          <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="py-3 px-4 font-semibold text-slate-100 min-w-[240px] border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                FLM (First Line Manager)
              </th>
              <th className="py-3 px-4 font-semibold text-slate-100 min-w-[180px] border-r border-slate-800">
                HQ (Headquarter)
              </th>
              {pivotData.brands.map((brand) => (
                <th
                  key={brand}
                  className="py-3 px-3.5 font-semibold text-center text-slate-100 min-w-[130px] border-r border-slate-800 whitespace-nowrap"
                >
                  {brand}
                </th>
              ))}
              <th className="py-3 px-4 font-bold text-right text-emerald-300 min-w-[150px] bg-slate-950 border-l border-slate-800">
                {formatMode === 'lac' ? 'Grand Total (Lac)' : formatMode === 'currency' ? 'Grand Total (৳)' : 'Grand Total'}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={pivotData.brands.length + 3}
                  className="text-center py-12 text-slate-400 italic text-sm"
                >
                  No matching FLM or HQ records found.
                </td>
              </tr>
            ) : (
              filteredGroups.map((group) => {
                const isCollapsed = collapsedFlms.has(group.flm);

                return (
                  <React.Fragment key={group.flm}>
                    {/* FLM Summary Group Header Row */}
                    <tr
                      onClick={() => toggleFlm(group.flm)}
                      className="bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/90 dark:hover:bg-blue-900/50 cursor-pointer font-semibold transition-colors group"
                    >
                      {/* FLM Column */}
                      <td className="py-2.5 px-4 text-blue-900 dark:text-blue-100 border-r border-blue-200 dark:border-blue-900 sticky left-0 z-10 bg-blue-50/90 dark:bg-blue-950/40 group-hover:bg-blue-100/90">
                        <div className="flex items-center space-x-2">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span className="font-bold">{group.flm}</span>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">
                            ({group.hqList.length} HQs)
                          </span>
                        </div>
                      </td>

                      {/* HQ Column */}
                      <td className="py-2.5 px-4 text-blue-800 dark:text-blue-300 text-xs italic border-r border-blue-200 dark:border-blue-900">
                        All HQs Subtotal
                      </td>

                      {/* Brand Values for this FLM */}
                      {pivotData.brands.map((brand) => {
                        const val = group.flmSubtotal[brand] || 0;
                        return (
                          <td
                            key={brand}
                            className={`py-2.5 px-3.5 text-right font-semibold border-r border-blue-200 dark:border-blue-900 ${
                              val > 0
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-400 dark:text-slate-600'
                            }`}
                          >
                            {formatNumber(val)}
                          </td>
                        );
                      })}

                      {/* FLM Row Total */}
                      <td className="py-2.5 px-4 text-right font-bold text-blue-950 dark:text-blue-200 bg-blue-100/60 dark:bg-blue-900/60 border-l border-blue-200 dark:border-blue-900">
                        {formatNumber(group.flmTotal)}
                      </td>
                    </tr>

                    {/* Child HQ Rows under this FLM (if not collapsed) */}
                    {!isCollapsed &&
                      group.hqList.map((hqItem, hqIdx) => (
                        <tr
                          key={`${group.flm}_${hqItem.hq}_${hqIdx}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-300"
                        >
                          {/* Empty / Indented FLM column */}
                          <td className="py-2 px-4 border-r border-slate-100 dark:border-slate-800 pl-8 sticky left-0 z-10 bg-white dark:bg-slate-900">
                            <span className="text-slate-400 dark:text-slate-600 text-[11px]">↳</span>
                          </td>

                          {/* HQ Name */}
                          <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span>{hqItem.hq}</span>
                            {hqItem.customerCount && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {hqItem.customerCount} cust
                              </span>
                            )}
                          </td>

                          {/* Brand Values for this HQ */}
                          {pivotData.brands.map((brand) => {
                            const val = hqItem.brandValues[brand] || 0;
                            return (
                              <td
                                key={brand}
                                className={`py-2 px-3.5 text-right font-mono border-r border-slate-100 dark:border-slate-800 ${
                                  val > 0
                                    ? 'text-slate-800 dark:text-slate-200'
                                    : 'text-slate-300 dark:text-slate-700'
                                }`}
                              >
                                {formatNumber(val)}
                              </td>
                            );
                          })}

                          {/* HQ Total */}
                          <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 border-l border-slate-100 dark:border-slate-800">
                            {formatNumber(hqItem.rowTotal)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Table Footer - Grand Totals */}
          <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 shadow-lg">
            <tr>
              <td className="py-3 px-4 text-white border-r border-slate-800 sticky left-0 z-30 bg-slate-900">
                GRAND TOTAL
              </td>
              <td className="py-3 px-4 text-slate-300 border-r border-slate-800 text-xs">
                All {pivotData.flmGroups.length} FLMs
              </td>
              {pivotData.brands.map((brand) => (
                <td
                  key={brand}
                  className="py-3 px-3.5 text-right font-mono text-white border-r border-slate-800 whitespace-nowrap"
                >
                  {formatNumber(pivotData.columnGrandTotals[brand])}
                </td>
              ))}
              <td className="py-3 px-4 text-right font-mono text-base text-emerald-300 bg-slate-950 border-l border-slate-800">
                {formatNumber(pivotData.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Footer bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-300">
          <span>
            Total FLMs: <strong>{pivotData.flmGroups.length}</strong>
          </span>
          <span>•</span>
          <span>
            Active Brands: <strong>{pivotData.brands.length}</strong>
          </span>
          <span>•</span>
          <span>
            Total Sales Records: <strong>{pivotData.totalRecords.toLocaleString()}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onExportConsolidated}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Consolidated (Excel)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
