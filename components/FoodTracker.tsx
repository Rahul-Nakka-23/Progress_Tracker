import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, AlertCircle, RefreshCw, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { analyzeFoodImage, recalculateNutrition } from '../services/geminiService';
import { saveFoodLog, getFoodLogs, getHistoryData, getCalorieGoal, saveCalorieGoal, deleteFoodLog, updateFoodLog } from '../services/storageService';
import { FoodAnalysisResult, FoodLog, GraphDataPoint } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  isDarkMode: boolean;
}

export const FoodTracker: React.FC<Props> = ({ isDarkMode }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);


  const [editMode, setEditMode] = useState(false);
  const [correctionText, setCorrectionText] = useState('');


  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FoodLog[]>([]);
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [viewPeriod, setViewPeriod] = useState<'WEEK' | 'YEAR'>('WEEK');

  const [calorieGoal, setCalorieGoalValue] = useState(2000);
  const [showGoalInput, setShowGoalInput] = useState(false);


  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogName, setEditLogName] = useState('');
  const [editLogCals, setEditLogCals] = useState('');


  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, [viewPeriod]);

  const refreshData = () => {
    const logs = getFoodLogs();
    setHistory(logs);
    setGraphData(getHistoryData('FOOD', viewPeriod));
    setCalorieGoalValue(getCalorieGoal());
  };

  const handleGoalUpdate = () => {
    saveCalorieGoal(calorieGoal);
    setShowGoalInput(false);
  };

  const initiateDelete = (id: string) => {
    setDeletingLogId(id);
    setEditingLogId(null); // Close edit if open
  };

  const confirmDelete = (id: string) => {
    deleteFoodLog(id);
    setDeletingLogId(null);
    refreshData();
  };

  const startEditLog = (log: FoodLog) => {
    setDeletingLogId(null); // Close delete if open
    setEditingLogId(log.id);
    setEditLogName(log.data.dishName);
    setEditLogCals(log.data.calories.toString());
  };

  const saveEditedLog = () => {
    if (!editingLogId) return;
    const log = history.find(h => h.id === editingLogId);
    if (!log) return;

    const updatedLog: FoodLog = {
      ...log,
      data: {
        ...log.data,
        dishName: editLogName,
        calories: parseInt(editLogCals) || 0
      }
    };
    updateFoodLog(updatedLog);
    setEditingLogId(null);
    refreshData();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];

      setImagePreview(base64);
      setAnalysisResult(null);
      setError(null);
      setIsAnalyzing(true);

      try {
        const result = await analyzeFoodImage(base64Data);
        setAnalysisResult(result);
        setCorrectionText(result.ingredients.join(', '));
      } catch (err) {
        setError("Failed to analyze image. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionText) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await recalculateNutrition(correctionText);
      setAnalysisResult({
        ...result,
        dishName: result.dishName || analysisResult?.dishName || "Custom Meal"
      });
      setEditMode(false);
    } catch (err) {
      setError("Failed to recalculate.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveLog = () => {
    if (!analysisResult) return;
    const newLog: FoodLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      mealType: 'Snack',
      data: analysisResult,
      imageBase64: imagePreview || undefined
    };
    saveFoodLog(newLog);
    setImagePreview(null);
    setAnalysisResult(null);
    refreshData();
  };


  const todayStr = new Date().toISOString().split('T')[0];
  const todayCalories = history
    .filter(h => h.dateStr === todayStr)
    .reduce((sum, item) => sum + item.data.calories, 0);

  const progressPercent = Math.min((todayCalories / calorieGoal) * 100, 100);

  return (
    <div className="space-y-8 pb-24">

      <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-dark-600 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-sm font-medium text-gold-500 uppercase tracking-widest">Daily Intake</h2>
            <div className="flex items-baseline mt-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white transition-colors">{todayCalories}</span>
              <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">/ {calorieGoal} kcal</span>
              <button onClick={() => setShowGoalInput(!showGoalInput)} className="ml-3 p-1 text-gray-400 hover:text-gold-500 transition">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{Math.max(0, calorieGoal - todayCalories)}</div>
          </div>
        </div>

        {showGoalInput && (
          <div className="mb-4 flex gap-2 animate-fade-in">
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoalValue(parseInt(e.target.value) || 0)}
              className="bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white border border-gray-200 dark:border-dark-600 rounded-lg px-3 py-1 text-sm w-full focus:border-gold-500 outline-none transition-colors"
            />
            <button onClick={handleGoalUpdate} className="bg-gold-500 text-black px-3 py-1 rounded-lg text-xs font-bold">Save</button>
          </div>
        )}


        <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden transition-colors">
          <div
            className="h-full gold-gradient transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>


      <div className="bg-white dark:bg-dark-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-600 transition-colors">
        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-dark-600 hover:border-gold-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-dark-900 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-white dark:bg-dark-800 shadow-sm flex items-center justify-center mb-3 group-hover:bg-gray-100 dark:group-hover:bg-dark-700 transition">
              <Camera className="w-6 h-6 text-gold-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium group-hover:text-gold-500 dark:group-hover:text-gold-400 transition">Scan Meal</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="relative p-3 bg-gray-100 dark:bg-dark-900 rounded-xl transition-colors">
            <img src={imagePreview} alt="Meal" className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-dark-700" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-5 right-5 bg-white/70 dark:bg-black/70 text-black dark:text-white p-2 rounded-full hover:bg-gold-500 hover:text-black transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="p-8 flex flex-col items-center justify-center text-gold-500 animate-pulse">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-sm font-medium">Analyzing Nutrients...</span>
          </div>
        )}

        {error && (
          <div className="m-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg flex items-center text-sm transition-colors">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
      </div>


      {analysisResult && !isAnalyzing && (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gold-500/30 shadow-xl animate-fade-in relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gold-500"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{analysisResult.dishName}</h3>
              <p className="text-gray-500 text-xs mt-1">AI Detected</p>
            </div>
            <div className="text-right">
              <span className="block text-3xl font-bold text-gold-500">{analysisResult.calories}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Kcal</span>
            </div>
          </div>

          {editMode ? (
            <div className="mb-4 bg-gray-50 dark:bg-dark-900 p-3 rounded-lg border border-gray-200 dark:border-dark-600 transition-colors">
              <textarea
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                className="w-full bg-transparent text-gray-800 dark:text-gray-200 text-sm outline-none resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={handleCorrectionSubmit}
                  className="bg-gold-500 text-black px-3 py-1.5 rounded text-xs font-bold flex-1 hover:bg-gold-400"
                >
                  Update
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded text-xs font-medium hover:text-black dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 leading-relaxed">
                {analysisResult.ingredients.join(', ')}
              </p>
              <button
                onClick={() => setEditMode(true)}
                className="text-gold-600 dark:text-gold-500/80 text-xs hover:text-gold-500 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Wrong ingredients?
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-dark-900 p-3 rounded-lg text-center border border-gray-200 dark:border-dark-700 transition-colors">
              <span className="block text-lg font-bold text-gray-900 dark:text-white">{analysisResult.macros.protein}g</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Protein</span>
            </div>
            <div className="bg-gray-50 dark:bg-dark-900 p-3 rounded-lg text-center border border-gray-200 dark:border-dark-700 transition-colors">
              <span className="block text-lg font-bold text-gray-900 dark:text-white">{analysisResult.macros.carbs}g</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Carbs</span>
            </div>
            <div className="bg-gray-50 dark:bg-dark-900 p-3 rounded-lg text-center border border-gray-200 dark:border-dark-700 transition-colors">
              <span className="block text-lg font-bold text-gray-900 dark:text-white">{analysisResult.macros.fat}g</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Fat</span>
            </div>
          </div>

          <button
            onClick={saveLog}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-gold-900/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add to Diary
          </button>
        </div>
      )}


      {graphData.length > 0 && (
        <div className="bg-white dark:bg-dark-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-600 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {viewPeriod === 'WEEK' ? 'Weekly Overview' : 'Yearly Trend (Avg)'}
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

              <BarChart data={graphData} key={viewPeriod}>
                <defs>
                  <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                    <stop offset="100%" stopColor="#AA8C2C" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: isDarkMode ? '#666' : '#999' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    borderRadius: '8px',
                    border: isDarkMode ? '1px solid #333' : '1px solid #e5e5e5',
                    color: isDarkMode ? '#fff' : '#000',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#D4AF37' }}
                  formatter={(value: number) => [`${value} kcal`, viewPeriod === 'YEAR' ? 'Daily Avg' : 'Calories']}
                  labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  fill="url(#goldBar)"
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2 uppercase tracking-widest">Recent Logs</h3>
        {history.slice(0, 10).map((log) => (
          <div key={log.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 dark:border-dark-600 flex items-center justify-between group hover:border-gold-500/30 dark:hover:border-dark-500 transition-colors">
            {editingLogId === log.id ? (
              <div className="flex-1 flex gap-2 items-center animate-fade-in">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editLogName}
                    onChange={(e) => setEditLogName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:border-gold-500 outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editLogCals}
                      onChange={(e) => setEditLogCals(e.target.value)}
                      className="w-20 bg-gray-50 dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:border-gold-500 outline-none"
                    />
                    <span className="text-xs text-gray-500">kcal</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={saveEditedLog} className="p-2 bg-gold-500 text-black rounded hover:bg-gold-400"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditingLogId(null)} className="p-2 bg-gray-200 dark:bg-dark-700 text-gray-500 dark:text-gray-400 rounded hover:text-black dark:hover:text-white"><X className="w-4 h-4" /></button>
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
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-200">{log.data.dishName}</h4>
                  <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{log.dateStr}</span>
                    <span>•</span>
                    <span>{log.mealType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gold-500">{log.data.calories} kcal</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditLog(log)}
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
      </div>
    </div>
  );
};