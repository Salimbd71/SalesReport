import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface HeaderProps {
  dateHeader: string;
  hasData: boolean;
  onExportConsolidated: () => void;
  onExportPivot: () => void;
  isExportingConsolidated?: boolean;
  isExportingPivot?: boolean;
  onReset: () => void;
  matchedCount: number;
  totalRecords: number;
}

export const Header: React.FC<HeaderProps> = ({
  dateHeader,
  hasData,
  onExportConsolidated,
  onExportPivot,
  isExportingConsolidated = false,
  isExportingPivot = false,
  onReset,
  matchedCount,
  totalRecords,
}) => {
  return (
    <header id="main-header" className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & Clean Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Excel Sales Data Processing & Pivot Generator
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {hasData && (
              <>
                <button
                  id="btn-export-pivot-header"
                  onClick={onExportPivot}
                  disabled={isExportingPivot || isExportingConsolidated}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/60 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Download SALES REPORT PIVOT.xlsx"
                >
                  {isExportingPivot ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                  <span>{isExportingPivot ? 'Exporting...' : 'Pivot Report (.xlsx)'}</span>
                </button>
                <button
                  id="btn-export-consolidated-header"
                  onClick={onExportConsolidated}
                  disabled={isExportingConsolidated || isExportingPivot}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Download Consolidated File with FLM HQ BRAND CHEMIST.xlsx"
                >
                  {isExportingConsolidated ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExportingConsolidated ? 'Exporting...' : 'Consolidated (.xlsx)'}</span>
                </button>
                <button
                  id="btn-reset-data"
                  onClick={onReset}
                  disabled={isExportingConsolidated || isExportingPivot}
                  className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
                  title="Upload New Files"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Date & Status Strip */}
        {hasData && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-amber-300">Report Date:</span>
              <span className="bg-slate-800 px-2.5 py-0.5 rounded text-slate-200 font-mono text-xs border border-slate-700">
                {dateHeader || 'Current Period'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  VLOOKUP Matched: <strong>{matchedCount.toLocaleString()}</strong> / {totalRecords.toLocaleString()} rows ({Math.round((matchedCount / (totalRecords || 1)) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
