import React, { useState, useEffect } from 'react';
import { Plus, Minus, Droplet, Trash2, Edit2, Save, X, Check } from 'lucide-react';
import { saveWaterLog, getWaterLogs, getHistoryData, getTodaySummary, updateWaterLog, deleteWaterLog } from '../services/storageService';
import { WaterLog, GraphDataPoint } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  isDarkMode: boolean;
}

export const WaterTracker: React.FC<Props> = ({ isDarkMode }) => {
  const [todayAmount, setTodayAmount] = useState(0);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [history, setHistory] = useState<WaterLog[]>([]);
  const [viewPeriod, setViewPeriod] = useState<'WEEK' | 'YEAR'>('WEEK');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, [viewPeriod]);

  const refreshData = () => {
    const today = getTodaySummary();
    setTodayAmount(today.totalWaterMl);
    setGraphData(getHistoryData('WATER', viewPeriod));
    setHistory(getWaterLogs());
  };

  const addWater = (amount: number) => {
    const log: WaterLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      amountMl: amount
    };
    saveWaterLog(log);
    refreshData();
  };

  const startEdit = (log: WaterLog) => {
    setDeletingLogId(null);
    setEditingLogId(log.id);
    setEditAmount(log.amountMl.toString());
  };

  const saveEdit = () => {
    if (!editingLogId) return;
    const log = history.find(l => l.id === editingLogId);
    if (log) {
      updateWaterLog({ ...log, amountMl: parseInt(editAmount) || 0 });
      setEditingLogId(null);
      refreshData();
    }
  };

  const initiateDelete = (id: string) => {
    setEditingLogId(null);
    setDeletingLogId(id);
  };

  const confirmDelete = (id: string) => {
    deleteWaterLog(id);
    setDeletingLogId(null);
    refreshData();
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-dark-600 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-gold-500/5 dark:bg-gold-900/10 blur-xl"></div>
        <div className="relative z-10 w-48 h-48 rounded-full border-4 border-gold-500/20 flex items-center justify-center bg-gray-50 dark:bg-dark-900 shadow-2xl transition-colors">
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tighter">{todayAmount}</span>
            <span className="block text-sm text-gold-500 font-medium uppercase tracking-widest mt-1">ml</span>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 mt-8 w-full max-w-xs">
          <button
            onClick={() => addWater(-250)}
            className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gold-500 transition-all active:scale-95"
          >
            <Minus className="w-6 h-6" />
          </button>
          <button
            onClick={() => addWater(250)}
            className="flex-1 bg-gold-500 text-black font-bold rounded-2xl shadow-lg shadow-gold-900/20 hover:bg-gold-400 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add 250ml
          </button>
        </div>
      </div>


      <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-600 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {viewPeriod === 'WEEK' ? 'Hydration Trend' : 'Yearly Trend (Avg)'}
          </h3>
          <div className="flex bg-gray-100 dark:bg-dark-900 rounded-lg p-1">
            <button
              onClick={() => setViewPeriod('WEEK')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewPeriod === 'WEEK' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewPeriod('YEAR')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewPeriod === 'YEAR' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Year
            </button>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} key={viewPeriod}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: isDarkMode ? '#666' : '#999' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderRadius: '8px',
                  border: isDarkMode ? '1px solid #333' : '1px solid #e5e5e5',
                  color: isDarkMode ? '#fff' : '#000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#D4AF37' }}
                formatter={(value: number) => [`${value} ml`, viewPeriod === 'YEAR' ? 'Daily Avg' : 'Amount']}
                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D4AF37"
                fillOpacity={1}
                fill="url(#colorWater)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-widest">Log History</h3>
        {history.slice(0, 8).map((log) => (
          <div key={log.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-600 flex items-center justify-between group transition-colors">
            {editingLogId === log.id ? (
              <div className="flex items-center gap-2 w-full animate-fade-in">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white px-3 py-2 rounded border border-gray-300 dark:border-dark-600 flex-1 outline-none focus:border-gold-500"
                />
                <button onClick={saveEdit} className="p-2 bg-gold-500 text-black rounded"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditingLogId(null)} className="p-2 bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded"><X className="w-4 h-4" /></button>
              </div>
            ) : deletingLogId === log.id ? (
              <div className="w-full flex items-center justify-between animate-fade-in">
                <span className="text-sm font-medium text-red-500 ml-2">Delete entry?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmDelete(log.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingLogId(null)}
                    className="p-2 bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded-lg hover:text-black dark:hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 flex items-center justify-center text-gold-500">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-200">{log.amountMl} ml</p>
                    <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.dateStr}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(log)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => initiateDelete(log.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};