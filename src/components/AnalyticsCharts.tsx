import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PivotTableData } from '../types';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  pivotData: PivotTableData;
}

const COLORS = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#059669', // Emerald
  '#DB2777', // Pink
  '#D97706', // Amber
  '#4F46E5', // Indigo
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ pivotData }) => {
  // 1. FLM Performance Data (in Lac)
  const flmData = pivotData.flmGroups.map((g) => ({
    name: g.flm.replace('FLM - ', '').trim(),
    salesLac: Number((g.flmTotal / 100000).toFixed(2)),
    salesRaw: g.flmTotal,
    hqs: g.hqList.length,
  }));

  // 2. Brand Distribution Data
  const brandData = pivotData.brands.map((b) => ({
    name: b,
    value: pivotData.columnGrandTotals[b] || 0,
    valueLac: Number(((pivotData.columnGrandTotals[b] || 0) / 100000).toFixed(2)),
  })).sort((a, b) => b.value - a.value);

  return (
    <div id="analytics-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Chart 1: FLM Performance */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              FLM Sales Contribution (in Lac)
            </h4>
            <p className="text-xs text-slate-500">Sales value aggregated by First Line Manager (100,000 = 1.00 Lac)</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flmData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(v) => `${v} L`} stroke="#94A3B8" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`${value} Lac (৳${(Number(value) * 100000).toLocaleString()})`, 'Sales Value']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="salesLac" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Brand Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Brand Wise Sales Distribution
            </h4>
            <p className="text-xs text-slate-500">Share of total portfolio sales across brands</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={brandData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={10}
              >
                {brandData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${((Number(value) || 0) / 100000).toFixed(2)} Lac (৳${Number(value || 0).toLocaleString()})`, 'Sales Value']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
