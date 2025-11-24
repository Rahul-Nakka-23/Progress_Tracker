import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Coffee, Home, Zap, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { saveFinanceLog, getFinanceLogs, getHistoryData, deleteFinanceLog, updateFinanceLog } from '../services/storageService';
import { FinanceLog, GraphDataPoint } from '../types';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  isDarkMode: boolean;
}

const CATEGORIES = [
  { name: 'Food', icon: Coffee },
  { name: 'Shopping', icon: ShoppingBag },
  { name: 'Bills', icon: Zap },
  { name: 'Home', icon: Home },
  { name: 'Other', icon: DollarSign },
];

export const FinanceTracker: React.FC<Props> = ({ isDarkMode }) => {
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Food');
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [recentLogs, setRecentLogs] = useState<FinanceLog[]>([]);
  const [viewPeriod, setViewPeriod] = useState<'WEEK' | 'YEAR'>('WEEK');


  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editItem, setEditItem] = useState('');


  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, [viewPeriod]);

  const refreshData = () => {
    setGraphData(getHistoryData('FINANCE', viewPeriod));
    const allLogs = getFinanceLogs();
    setRecentLogs(allLogs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !item) return;

    const log: FinanceLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      item,
      category
    };
    saveFinanceLog(log);
    setAmount('');
    setItem('');
    refreshData();
  };

  const initiateDelete = (id: string) => {
    setEditingLogId(null);
    setDeletingLogId(id);
  };

  const confirmDelete = (id: string) => {
    deleteFinanceLog(id);
    setDeletingLogId(null);
    refreshData();
  };

  const startEdit = (log: FinanceLog) => {
    setDeletingLogId(null);
    setEditingLogId(log.id);
    setEditAmount(log.amount.toString());
    setEditItem(log.item);
  };

  const saveEdit = () => {
    if (!editingLogId) return;
    const log = recentLogs.find(l => l.id === editingLogId);
    if (log) {
      updateFinanceLog({
        ...log,
        amount: parseFloat(editAmount) || 0,
        item: editItem
      });
      setEditingLogId(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-dark-600 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 bg-gold-500/5 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {viewPeriod === 'WEEK' ? 'Spending Trend' : 'Yearly Spending (Total)'}
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
        <div className="h-48 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData} key={viewPeriod}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#222' : '#e5e5e5'} />
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
                formatter={(value: number) => [`₹${value}`, viewPeriod === 'YEAR' ? 'Total Spent' : 'Spent']}
                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ r: 4, fill: isDarkMode ? '#1a1a1a' : '#fff', strokeWidth: 2, stroke: '#D4AF37' }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-600 space-y-5 transition-colors">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gold-500 font-bold text-lg">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none font-bold text-gray-900 dark:text-white text-lg placeholder-gray-400 dark:placeholder-gray-700 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Description</label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="What did you buy?"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Category</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all border ${isSelected ? 'bg-gold-500 text-black border-gold-500 font-bold' : 'bg-gray-50 dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <Icon className="w-4 h-4" /> {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        <button type="submit" className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-gold-900/20 transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </form>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-widest">Recent Activity</h3>
        {recentLogs.slice(0, 5).map((log) => (
          <div key={log.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-dark-600 group hover:border-gold-500/30 dark:hover:border-dark-500 transition-colors">
            {editingLogId === log.id ? (
              <div className="w-full flex items-center gap-2 animate-fade-in">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editItem}
                    onChange={(e) => setEditItem(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm outline-none"
                  />
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={saveEdit} className="p-2 bg-gold-500 text-black rounded"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditingLogId(null)} className="p-2 bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ) : deletingLogId === log.id ? (
              <div className="w-full flex items-center justify-between animate-fade-in">
                <span className="text-sm font-medium text-red-500 ml-2">Confirm Delete?</span>
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
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 flex items-center justify-center text-gold-500">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-200">{log.item}</p>
                    <p className="text-xs text-gray-500">{log.category} • {log.dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900 dark:text-white">-₹{log.amount}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(log)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => initiateDelete(log.id)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {recentLogs.length === 0 && <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">No expenses yet.</p>}
      </div>
    </div>
  );
};