import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import { PivotTableData, SalesRecord } from '../types';

interface ExportToolbarProps {
  salesRecords: SalesRecord[];
  pivotData: PivotTableData;
  dateHeader: string;
  onExportConsolidated: () => void;
  onExportPivot: () => void;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  salesRecords,
  pivotData,
  dateHeader,
  onExportConsolidated,
  onExportPivot,
}) => {
  return (
    <div id="export-section" className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Left side: Export descriptions */}
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Download className="w-4 h-4" />
            <span>Ready for Export & Download</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Generated Output Workbooks
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Download your consolidated files with preserved A1 date headers, auto-mapped <strong>Column P (FLM)</strong>, <strong>Column Q (HQ)</strong>, and the multi-dimensional Pivot Table report.
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Total Sales Value</div>
              <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5">
                ৳{pivotData.grandTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Total Records</div>
              <div className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                {salesRecords.length.toLocaleString()} rows
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">FLM Managers</div>
              <div className="text-sm sm:text-base font-bold text-blue-400 font-mono mt-0.5">
                {pivotData.flmGroups.length} FLMs
              </div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Active Brands</div>
              <div className="text-sm sm:text-base font-bold text-teal-400 font-mono mt-0.5">
                {pivotData.brands.length} Brands
              </div>
            </div>
          </div>
        </div>

        {/* Right side: 2 primary requested download buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          
          {/* Output File 1 */}
          <button
            id="btn-download-consolidated-main"
            onClick={onExportConsolidated}
            className="group px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-between space-x-3 text-xs cursor-pointer border border-emerald-400/30"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">Consolidated File.xlsx</div>
                <div className="text-[11px] text-emerald-100">
                  With FLM, HQ, Brand, Chemist & Pivot
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-200 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Output File 2 */}
          <button
            id="btn-download-pivot-main"
            onClick={onExportPivot}
            className="group px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/30 transition-all flex items-center justify-between space-x-3 text-xs cursor-pointer border border-blue-400/30"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">SALES REPORT PIVOT.xlsx</div>
                <div className="text-[11px] text-blue-100">
                  Rows: FLM, HQ | Cols: BRAND | Value: Sales
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-blue-200 group-hover:translate-y-0.5 transition-transform" />
          </button>

        </div>

      </div>
    </div>
  );
};
