import React, { useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Play,
  ArrowRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { FileValidationResult } from '../types';

interface FileUploadCardsProps {
  salesFileName: string;
  chemistFileName: string;
  salesValidation?: FileValidationResult;
  chemistValidation?: FileValidationResult;
  isLoading: boolean;
  onUploadSalesFile: (file: File) => void;
  onUploadChemistFile: (file: File) => void;
  onGenerateReport: () => void;
  hasReportGenerated: boolean;
}

export const FileUploadCards: React.FC<FileUploadCardsProps> = ({
  salesFileName,
  chemistFileName,
  salesValidation,
  chemistValidation,
  isLoading,
  onUploadSalesFile,
  onUploadChemistFile,
  onGenerateReport,
  hasReportGenerated,
}) => {
  const salesInputRef = useRef<HTMLInputElement>(null);
  const chemistInputRef = useRef<HTMLInputElement>(null);

  const handleSalesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadSalesFile(e.dataTransfer.files[0]);
    }
  };

  const handleChemistDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadChemistFile(e.dataTransfer.files[0]);
    }
  };

  const isBothFilesSelected = Boolean(salesFileName && chemistFileName);

  return (
    <div id="file-upload-section" className="mb-8">
      
      {/* Top Banner Guide */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Excel Sales Data Processing & Pivot Generator</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Select your <strong>Sales Data file</strong> and <strong>Chemist list file</strong>, then click <strong>"Generate Sales Report"</strong>. The engine performs VLOOKUP mapping into Columns P (FLM) & Q (HQ), maps BRAND from Column G (G2), and generates multi-level Pivot tables with sales values in <strong>Lac (100,000 = 1.00)</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-medium">Col G: BRAND</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-300 font-medium">10,000 = 0.10 Lac</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Sales Data File */}
        <div
          id="upload-card-sales"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleSalesDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 transition-all bg-white dark:bg-slate-900 ${
            salesFileName
              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'
          }`}
        >
          <input
            type="file"
            ref={salesInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadSalesFile(e.target.files[0])}
            accept=".xlsx, .xls, .xlsm, .csv"
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
              Input File 1
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              1. Sales Data File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-Sheet: <strong>Sheet 4</strong> (Product Sales) & <strong>Sheet 2</strong> (Customer Sales)
            </p>

            <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>File Specifications:</span>
              </div>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>Cell A1:</strong> Date text (preserved at top of output files)
              </p>
              <p className="pl-5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                • <strong>Sheet 4:</strong> Col G (BRAND), Col P2 (FLM) & Col Q2 (HQ)
              </p>
              <p className="pl-5 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                • <strong>Sheet 2:</strong> Col K2 (FLM) & Col L2 (HQ) via Chemist VLOOKUP
              </p>
            </div>

            {salesFileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-100/60 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {salesFileName}
                    </div>
                    {salesValidation && (
                      <div className="text-[11px] text-blue-700 dark:text-blue-300">
                        {salesValidation.rowCount.toLocaleString()} rows • {salesValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => salesInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => salesInputRef.current?.click()}
                className="w-full py-5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Sales Data File (.xlsx, .xls)
                </span>
                <span className="text-[11px] text-slate-400">
                  Drag & Drop or Click to browse
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Chemist List File */}
        <div
          id="upload-card-chemist"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleChemistDrop}
          className={`relative rounded-2xl border-2 border-dashed p-6 transition-all bg-white dark:bg-slate-900 ${
            chemistFileName
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400'
          }`}
        >
          <input
            type="file"
            ref={chemistInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadChemistFile(e.target.files[0])}
            accept=".xlsx, .xls, .xlsm, .csv"
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              Input File 2
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              2. Chemist List File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sheet: <strong>DHK-MYN-KH</strong> (Chemist Master)
            </p>

            <div className="my-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mapping Specifications:</span>
              </div>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>Lookup Key:</strong> Cust code (matches CUST_CODE in Sales)
              </p>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>FLM:</strong> Col I (<code>FSM-(NEW)2026-27</code>)
              </p>
              <p className="pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                • <strong>HQ:</strong> Col K (<code>AZURA HQ ( New Design)-2026-27</code>)
              </p>
            </div>

            {chemistFileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {chemistFileName}
                    </div>
                    {chemistValidation && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {chemistValidation.rowCount.toLocaleString()} chemists • {chemistValidation.sheetName}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => chemistInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => chemistInputRef.current?.click()}
                className="w-full py-5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select Chemist List File (.xlsx, .xls)
                </span>
                <span className="text-[11px] text-slate-400">
                  Drag & Drop or Click to browse
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Prominent Action Button: Generate Sales Report */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${salesFileName ? 'bg-blue-600' : 'bg-slate-400'}`}>
            {salesFileName ? '✓' : '1'}
          </span>
          <span className={salesFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>Sales Data</span>
          <span className="text-slate-300">→</span>
          <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${chemistFileName ? 'bg-emerald-600' : 'bg-slate-400'}`}>
            {chemistFileName ? '✓' : '2'}
          </span>
          <span className={chemistFileName ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}>Chemist List</span>
          <span className="text-slate-300">→</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Generate Report</span>
        </div>

        <button
          id="btn-generate-sales-report"
          onClick={onGenerateReport}
          disabled={!isBothFilesSelected || isLoading}
          className={`px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center space-x-3 transition-all cursor-pointer shadow-lg ${
            isBothFilesSelected && !isLoading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing VLOOKUP & Generating Pivot...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Generate Sales Report</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
