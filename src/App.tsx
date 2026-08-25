/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileValidationResult,
  PivotTableData,
  SalesRecord,
  CustomerSalesRecord,
  ChemistRecord,
} from './types';
import {
  parseSalesFile,
  parseChemistFile,
  enrichSalesWithChemist,
  enrichCustomerSalesWithChemist,
} from './utils/excelParser';
import { generatePivotTable } from './utils/pivotEngine';
import {
  exportConsolidatedFile,
  exportPivotReportFile,
} from './utils/excelExporter';

import { Header } from './components/Header';
import { FileUploadCards } from './components/FileUploadCards';
import { ValidationAlerts } from './components/ValidationAlerts';
import { PivotTableView } from './components/PivotTableView';
import { EnrichedDataView } from './components/EnrichedDataView';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ChemistMasterView } from './components/ChemistMasterView';
import { ExportToolbar } from './components/ExportToolbar';

import {
  Table as TableIcon,
  FileSpreadsheet,
  BarChart3,
  Users,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  // Raw file state
  const [salesRawFile, setSalesRawFile] = useState<File | null>(null);
  const [salesFileName, setSalesFileName] = useState<string>('');
  const [chemistRawFile, setChemistRawFile] = useState<File | null>(null);
  const [chemistFileName, setChemistFileName] = useState<string>('');

  // Selected sheet names
  const [selectedSalesSheet, setSelectedSalesSheet] = useState<string>('');
  const [selectedChemistSheet, setSelectedChemistSheet] = useState<string>('');

  // Parsed records and validations
  // Sheet 4 (Product level)
  const [rawSalesRecords, setRawSalesRecords] = useState<
    Omit<SalesRecord, 'FLM' | 'HQ' | 'isMatched'>[]
  >([]);
  // Sheet 2 (Customer level: HQ-Customer Sales)
  const [rawCustomerRecords, setRawCustomerRecords] = useState<
    Omit<CustomerSalesRecord, 'FLM' | 'HQ' | 'isMatched'>[]
  >([]);
  const [customerSheetName, setCustomerSheetName] = useState<string>('HQ-Customer Sales');

  const [chemistMap, setChemistMap] = useState<Map<string, ChemistRecord>>(new Map());
  const [chemistList, setChemistList] = useState<ChemistRecord[]>([]);

  const [dateHeader, setDateHeader] = useState<string>('');
  const [salesValidation, setSalesValidation] = useState<FileValidationResult | undefined>();
  const [chemistValidation, setChemistValidation] = useState<FileValidationResult | undefined>();

  // Enriched & Pivot state
  const [enrichedRecords, setEnrichedRecords] = useState<SalesRecord[]>([]);
  const [enrichedCustomerRecords, setEnrichedCustomerRecords] = useState<CustomerSalesRecord[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [unmatchedCount, setUnmatchedCount] = useState<number>(0);
  const [unmatchedCodes, setUnmatchedCodes] = useState<string[]>([]);
  const [hasReportGenerated, setHasReportGenerated] = useState<boolean>(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'pivot' | 'enriched' | 'charts' | 'chemist'>('pivot');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Upload Handlers
  const handleUploadSalesFile = async (file: File) => {
    setSalesRawFile(file);
    setSalesFileName(file.name);
    setHasReportGenerated(false);
    setIsLoading(true);
    try {
      const result = await parseSalesFile(file);
      setRawSalesRecords(result.records);
      setRawCustomerRecords(result.customerRecords);
      setCustomerSheetName(result.customerSheetName || 'HQ-Customer Sales');
      setDateHeader(result.dateHeader);
      setSalesValidation(result.validation);
      if (result.validation.sheetName) {
        setSelectedSalesSheet(result.validation.sheetName);
      }
      showNotification(
        `Sales Data loaded: Sheet 4 (${result.records.length.toLocaleString()} rows) & Sheet 2 (${result.customerRecords.length.toLocaleString()} rows)`
      );
    } catch (err: any) {
      console.error('Error parsing Sales file:', err);
      showNotification('Failed to read Sales Excel file: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadChemistFile = async (file: File) => {
    setChemistRawFile(file);
    setChemistFileName(file.name);
    setHasReportGenerated(false);
    setIsLoading(true);
    try {
      const result = await parseChemistFile(file);
      setChemistMap(result.chemistMap);
      setChemistList(result.chemistList);
      setChemistValidation(result.validation);
      if (result.validation.sheetName) {
        setSelectedChemistSheet(result.validation.sheetName);
      }
      showNotification(`Chemist List loaded: ${result.chemistList.length.toLocaleString()} chemists`);
    } catch (err: any) {
      console.error('Error parsing Chemist file:', err);
      showNotification('Failed to read Chemist Excel file: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Sheet switchers
  const handleSelectSalesSheet = async (sheetName: string) => {
    if (salesRawFile) {
      setSelectedSalesSheet(sheetName);
      setHasReportGenerated(false);
      setIsLoading(true);
      try {
        const result = await parseSalesFile(salesRawFile, sheetName);
        setRawSalesRecords(result.records);
        setRawCustomerRecords(result.customerRecords);
        setCustomerSheetName(result.customerSheetName || 'HQ-Customer Sales');
        setDateHeader(result.dateHeader);
        setSalesValidation(result.validation);
      } catch (err: any) {
        showNotification('Error changing sheet: ' + err.message, 'info');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectChemistSheet = async (sheetName: string) => {
    if (chemistRawFile) {
      setSelectedChemistSheet(sheetName);
      setHasReportGenerated(false);
      setIsLoading(true);
      try {
        const result = await parseChemistFile(chemistRawFile, sheetName);
        setChemistMap(result.chemistMap);
        setChemistList(result.chemistList);
        setChemistValidation(result.validation);
      } catch (err: any) {
        showNotification('Error changing sheet: ' + err.message, 'info');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Explicit Generation trigger: "Generate Sales Report"
  const handleGenerateReport = async () => {
    if (!salesRawFile || !chemistRawFile) {
      showNotification('Please select both Sales Data file and Chemist List file first.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      // Re-verify parsing if records aren't loaded
      let currentSales = rawSalesRecords;
      let currentCustomerSales = rawCustomerRecords;
      let currentChemistMap = chemistMap;

      if (currentSales.length === 0 || currentCustomerSales.length === 0) {
        const salesRes = await parseSalesFile(salesRawFile, selectedSalesSheet);
        currentSales = salesRes.records;
        currentCustomerSales = salesRes.customerRecords;
        setRawSalesRecords(salesRes.records);
        setRawCustomerRecords(salesRes.customerRecords);
        setCustomerSheetName(salesRes.customerSheetName);
        setDateHeader(salesRes.dateHeader);
        setSalesValidation(salesRes.validation);
      }

      if (currentChemistMap.size === 0) {
        const chemistRes = await parseChemistFile(chemistRawFile, selectedChemistSheet);
        currentChemistMap = chemistRes.chemistMap;
        setChemistMap(chemistRes.chemistMap);
        setChemistList(chemistRes.chemistList);
        setChemistValidation(chemistRes.validation);
      }

      // Perform VLOOKUP mapping for Sheet 4 (P2: FLM, Q2: HQ)
      const { enrichedRecords: enriched, matchedCount: mCount, unmatchedCount: uCount, unmatchedCodes: uCodes } =
        enrichSalesWithChemist(currentSales, currentChemistMap);

      // Perform VLOOKUP mapping for Sheet 2 (K2: FLM, L2: HQ)
      const { enrichedCustomerRecords: enrichedCustomer } =
        enrichCustomerSalesWithChemist(currentCustomerSales, currentChemistMap);

      setEnrichedRecords(enriched);
      setEnrichedCustomerRecords(enrichedCustomer);
      setMatchedCount(mCount);
      setUnmatchedCount(uCount);
      setUnmatchedCodes(uCodes);
      setHasReportGenerated(true);
      setActiveTab('pivot');

      showNotification(
        `Sales Report generated! Sheet 4 (${enriched.length.toLocaleString()} rows) & Sheet 2 (${enrichedCustomer.length.toLocaleString()} rows) enriched.`
      );

      // Smooth scroll down to output
      setTimeout(() => {
        const outputSection = document.getElementById('report-output-section');
        if (outputSection) {
          outputSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Error generating sales report:', err);
      showNotification('Error generating report: ' + err.message, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Pivot Table Data
  const pivotData: PivotTableData = useMemo(() => {
    if (!hasReportGenerated || enrichedRecords.length === 0) {
      return {
        flmGroups: [],
        brands: [],
        columnGrandTotals: {},
        grandTotal: 0,
        totalRecords: 0,
        matchedRecords: 0,
        unmatchedRecords: 0,
      };
    }
    return generatePivotTable(enrichedRecords);
  }, [enrichedRecords, hasReportGenerated]);

  // Exports
  const handleExportConsolidated = () => {
    if (enrichedRecords.length === 0) {
      showNotification('No generated report to export. Please click Generate Sales Report first.', 'info');
      return;
    }
    exportConsolidatedFile(
      enrichedRecords,
      enrichedCustomerRecords,
      pivotData,
      chemistList,
      dateHeader,
      'Consolidated File with FLM HQ BRAND CHEMIST.xlsx'
    );
    showNotification('Downloaded: Consolidated File with FLM HQ BRAND CHEMIST.xlsx');
  };

  const handleExportPivot = () => {
    if (pivotData.flmGroups.length === 0) {
      showNotification('No pivot data available. Please generate the report first.', 'info');
      return;
    }
    exportPivotReportFile(pivotData, dateHeader, 'SALES REPORT PIVOT.xlsx');
    showNotification('Downloaded: SALES REPORT PIVOT.xlsx (Value in Lac)');
  };

  const handleReset = () => {
    setSalesRawFile(null);
    setSalesFileName('');
    setChemistRawFile(null);
    setChemistFileName('');
    setRawSalesRecords([]);
    setRawCustomerRecords([]);
    setEnrichedRecords([]);
    setEnrichedCustomerRecords([]);
    setChemistMap(new Map());
    setChemistList([]);
    setDateHeader('');
    setSalesValidation(undefined);
    setChemistValidation(undefined);
    setHasReportGenerated(false);
    showNotification('Workbench reset. You can select fresh Excel files.', 'info');
  };

  const hasData = hasReportGenerated && enrichedRecords.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        dateHeader={dateHeader}
        hasData={hasData}
        onExportConsolidated={handleExportConsolidated}
        onExportPivot={handleExportPivot}
        onReset={handleReset}
        matchedCount={matchedCount}
        totalRecords={enrichedRecords.length}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        
        {/* Upload Cards & Generate Button */}
        <FileUploadCards
          salesFileName={salesFileName}
          chemistFileName={chemistFileName}
          salesValidation={salesValidation}
          chemistValidation={chemistValidation}
          isLoading={isLoading}
          onUploadSalesFile={handleUploadSalesFile}
          onUploadChemistFile={handleUploadChemistFile}
          onGenerateReport={handleGenerateReport}
          hasReportGenerated={hasReportGenerated}
        />

        {/* Validation Warnings & Alerts */}
        <ValidationAlerts
          salesValidation={salesValidation}
          chemistValidation={chemistValidation}
          unmatchedCount={unmatchedCount}
          unmatchedCodes={unmatchedCodes}
          onSelectSalesSheet={handleSelectSalesSheet}
          onSelectChemistSheet={handleSelectChemistSheet}
        />

        {/* Generated Report Output Section */}
        {hasData && (
          <div id="report-output-section" className="space-y-6 mt-6">
            
            {/* Export Toolbar */}
            <ExportToolbar
              salesRecords={enrichedRecords}
              pivotData={pivotData}
              dateHeader={dateHeader}
              onExportConsolidated={handleExportConsolidated}
              onExportPivot={handleExportPivot}
            />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
              <button
                id="tab-pivot-report"
                onClick={() => setActiveTab('pivot')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'pivot'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>SALES REPORT PIVOT</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  In Lac (1.00 = 100k)
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  {pivotData.flmGroups.length} FLMs
                </span>
              </button>

              <button
                id="tab-enriched-data"
                onClick={() => setActiveTab('enriched')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'enriched'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border-t-2 border-t-teal-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Enriched Sales Data Tables</span>
                <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  Sheet 4 (P & Q) & Sheet 2 (K & L)
                </span>
              </button>

              <button
                id="tab-visual-charts"
                onClick={() => setActiveTab('charts')}
                className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'charts'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-t-indigo-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Visual Analytics</span>
              </button>

              {chemistList.length > 0 && (
                <button
                  id="tab-chemist-master"
                  onClick={() => setActiveTab('chemist')}
                  className={`px-4 py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'chemist'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-t-emerald-600 border-x border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Chemist Database ({chemistList.length})</span>
                </button>
              )}
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'pivot' && (
                <PivotTableView
                  pivotData={pivotData}
                  dateHeader={dateHeader}
                  onExportPivot={handleExportPivot}
                  onExportConsolidated={handleExportConsolidated}
                />
              )}

              {activeTab === 'enriched' && (
                <EnrichedDataView
                  records={enrichedRecords}
                  customerRecords={enrichedCustomerRecords}
                  dateHeader={dateHeader}
                  onExportConsolidated={handleExportConsolidated}
                />
              )}

              {activeTab === 'charts' && (
                <AnalyticsCharts pivotData={pivotData} />
              )}

              {activeTab === 'chemist' && (
                <ChemistMasterView
                  chemistList={chemistList}
                  sheetName={selectedChemistSheet || 'DHK-MYN-KH'}
                />
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <div class="custom-badge">
  Designed By Salim
</div>
      


      
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Declaration: This web application is an entirely unofficial, independently developed tool and is not affiliated with, endorsed by, or officially supported by Sun Pharma. However, the data files processed or used within this application are official Sun Pharma files.

This application is strictly intended for use by authorized Sun Pharma employees only. The website link, application, and any data/files processed through it must not be shared, distributed, forwarded, or made accessible to anyone outside Sun Pharma.

By using this application, users acknowledge and agree to comply with the confidentiality and authorized-use requirements applicable to the official data and files.</div>
      </footer>

    </div>
  );
}
