import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { getConsolidatedFileName } from '../utils/excelExporter';

interface HeaderProps {
  dateHeader: string;
  hasData: boolean;
  onExportConsolidated: () => void;
  onExportPivot?: () => void;
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
  isExportingConsolidated = false,
  onReset,
  matchedCount,
  totalRecords,
}) => {
  const { theme, language, toggleTheme, toggleLanguage, t } = useThemeLanguage();
  const dynamicFileName = getConsolidatedFileName(dateHeader);

  return (
    <header id="main-header" className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          
          {/* Logo & Clean Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0 border border-slate-700/50">
              <img
                src="/Logo.png"
                alt="App Logo"
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight">
                {t.appTitle}
              </h1>
            </div>
          </div>

          {/* Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Language Toggle */}
            <button
              id="btn-toggle-language"
              onClick={toggleLanguage}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title={language === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono">{language === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 bg-slate-800 hover:bg-slate-700 text-amber-400 dark:text-amber-300 rounded-lg border border-slate-700 transition-all cursor-pointer shadow-sm"
              title={theme === 'dark' ? t.themeToggleLight : t.themeToggleDark}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
            </button>

            {/* Export & Reset Actions */}
            {hasData && (
              <>
                <button
                  id="btn-export-consolidated-header"
                  onClick={onExportConsolidated}
                  disabled={isExportingConsolidated}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer border border-emerald-400/30"
                  title={`Download ${dynamicFileName}`}
                >
                  {isExportingConsolidated ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200 shrink-0" />
                  ) : (
                    <Download className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{isExportingConsolidated ? t.exporting : (language === 'bn' ? 'কনসলিডেটেড ফাইল ডাউনলোড' : 'Export Consolidated File')}</span>
                </button>
                <button
                  id="btn-reset-data"
                  onClick={onReset}
                  disabled={isExportingConsolidated}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all cursor-pointer"
                  title="Upload New Files"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.reset}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Date & Status Strip */}
        {hasData && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-amber-300">{t.reportDate}</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 font-mono text-xs border border-slate-700">
                {dateHeader || t.currentPeriod}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {t.vlookupMatched} <strong>{matchedCount.toLocaleString()}</strong> / {totalRecords.toLocaleString()} {t.rows} ({Math.round((matchedCount / (totalRecords || 1)) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

