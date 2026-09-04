import React, { useState, useMemo } from 'react';
import { Search, Building2, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChemistRecord } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface ChemistMasterViewProps {
  chemistList: ChemistRecord[];
  sheetName: string;
}

export const ChemistMasterView: React.FC<ChemistMasterViewProps> = ({
  chemistList,
  sheetName,
}) => {
  const { t, language } = useThemeLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filtered = useMemo(() => {
    if (!searchTerm) return chemistList;
    const q = searchTerm.toLowerCase();
    return chemistList.filter(
      (c) =>
        c.custCode.toLowerCase().includes(q) ||
        c.custName.toLowerCase().includes(q) ||
        c.fsmNew2627.toLowerCase().includes(q) ||
        c.azuraHqNew2627.toLowerCase().includes(q) ||
        (c.mhlCode && c.mhlCode.toLowerCase().includes(q))
    );
  }, [chemistList, searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div id="chemist-master-container" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.chemistMasterTitle} ({sheetName})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.chemistMasterDesc}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.searchChemistPlaceholder}
            className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[550px]">
        <table id="chemist-master-table" className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-900 text-white sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-slate-300 border-r border-slate-800 w-16">#</th>
              <th className="py-2.5 px-4 font-semibold text-slate-100 border-r border-slate-800 min-w-[120px]">
                Cust code (Key)
              </th>
              <th className="py-2.5 px-4 font-semibold text-slate-100 border-r border-slate-800 min-w-[220px]">
                CUST NAME
              </th>
              <th className="py-2.5 px-4 font-bold text-teal-200 bg-teal-900/70 border-r border-teal-700 min-w-[220px]">
                FLM [Col I: FSM-(NEW)2026-27]
              </th>
              <th className="py-2.5 px-4 font-bold text-teal-200 bg-teal-900/70 border-r border-teal-700 min-w-[180px]">
                HQ [Col K: AZURA HQ]
              </th>
              <th className="py-2.5 px-4 font-semibold text-slate-300 min-w-[120px]">MHL CODE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                  {language === 'bn' ? 'কোনো কেমিস্ট রেকর্ড পাওয়া যায়নি।' : 'No chemist records found.'}
                </td>
              </tr>
            ) : (
              paginated.map((chem, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={chem.custCode + idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-4 text-slate-400 border-r border-slate-100 dark:border-slate-800">
                      {chem.slNo || globalIndex}
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800">
                      {chem.custCode}
                    </td>
                    <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                      {chem.custName}
                    </td>
                    <td className="py-2 px-4 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40">
                      {chem.fsmNew2627}
                    </td>
                    <td className="py-2 px-4 font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/20 border-r border-teal-100 dark:border-teal-900/40">
                      {chem.azuraHqNew2627}
                    </td>
                    <td className="py-2 px-4 text-slate-500 dark:text-slate-400 font-mono">
                      {chem.mhlCode || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          {language === 'bn' ? (
            <>
              মোট <strong>{filtered.length.toLocaleString()}</strong> জনের মধ্যে <strong>{(currentPage - 1) * pageSize + 1}</strong> থেকে{' '}
              <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> দেখানো হচ্ছে
            </>
          ) : (
            <>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> of{' '}
              <strong>{filtered.length.toLocaleString()}</strong> chemists
            </>
          )}
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
            {language === 'bn' ? `পৃষ্ঠা ${currentPage} / ${totalPages}` : `Page ${currentPage} / ${totalPages}`}
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

