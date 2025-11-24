import { FoodLog, WaterLog, FinanceLog, DailySummary, GraphDataPoint } from "../types";

const FOOD_KEY = 'lifebalance_food';
const WATER_KEY = 'lifebalance_water';
const FINANCE_KEY = 'lifebalance_finance';
const GOAL_KEY = 'lifebalance_calorie_goal';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getItems = <T>(key: string): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return [];
  }
};
const saveItem = <T>(key: string, item: T, maxLength = 5000) => {
  const items = getItems<T>(key);
  const newItems = [item, ...items].slice(0, maxLength);
  localStorage.setItem(key, JSON.stringify(newItems));
};

const updateItem = <T extends { id: string }>(key: string, updatedItem: T) => {
  const items = getItems<T>(key);
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items[index] = updatedItem;
    localStorage.setItem(key, JSON.stringify(items));
  }
};

const deleteItem = <T extends { id: string }>(key: string, id: string) => {
  const items = getItems<T>(key);
  const newItems = items.filter(i => i.id !== id);
  localStorage.setItem(key, JSON.stringify(newItems));
};

// Calorie Goal
export const saveCalorieGoal = (goal: number) => localStorage.setItem(GOAL_KEY, goal.toString());
export const getCalorieGoal = (): number => {
  const g = localStorage.getItem(GOAL_KEY);
  return g ? parseInt(g, 10) : 2000;
};

// Food
export const saveFoodLog = (log: FoodLog) => {
  const { imageBase64, ...logWithoutImage } = log;
  saveItem(FOOD_KEY, logWithoutImage);
};
export const getFoodLogs = () => getItems<FoodLog>(FOOD_KEY);
export const updateFoodLog = (log: FoodLog) => updateItem(FOOD_KEY, log);
export const deleteFoodLog = (id: string) => deleteItem<FoodLog>(FOOD_KEY, id);

// Water
export const saveWaterLog = (log: WaterLog) => saveItem(WATER_KEY, log);
export const getWaterLogs = () => getItems<WaterLog>(WATER_KEY);
export const updateWaterLog = (log: WaterLog) => updateItem(WATER_KEY, log);
export const deleteWaterLog = (id: string) => deleteItem<WaterLog>(WATER_KEY, id);

// Finance
export const saveFinanceLog = (log: FinanceLog) => saveItem(FINANCE_KEY, log);
export const getFinanceLogs = () => getItems<FinanceLog>(FINANCE_KEY);
export const updateFinanceLog = (log: FinanceLog) => updateItem(FINANCE_KEY, log);
export const deleteFinanceLog = (id: string) => deleteItem<FinanceLog>(FINANCE_KEY, id);

// Aggregation for Graphs
export const getHistoryData = (
  type: 'FOOD' | 'WATER' | 'FINANCE',
  period: 'WEEK' | 'YEAR'
): GraphDataPoint[] => {
  const foodLogs = getFoodLogs();
  const waterLogs = getWaterLogs();
  const financeLogs = getFinanceLogs();

  const data: GraphDataPoint[] = [];

  if (period === 'WEEK') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue

      let val = 0;
      if (type === 'FOOD') {
        val = foodLogs.filter(l => l.dateStr === dateStr).reduce((sum, l) => sum + l.data.calories, 0);
      } else if (type === 'WATER') {
        val = waterLogs.filter(l => l.dateStr === dateStr).reduce((sum, l) => sum + l.amountMl, 0);
      } else {
        val = financeLogs.filter(l => l.dateStr === dateStr).reduce((sum, l) => sum + l.amount, 0);
      }

      data.push({ label: dayLabel, value: val, fullDate: dateStr });
    }
  } else {
    // Last 12 Months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYearStr = d.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' }); // Jan, Feb

      let val = 0;

      // Filter logs for this month
      if (type === 'FOOD') {
        const logs = foodLogs.filter(l => l.dateStr.startsWith(monthYearStr));
        const total = logs.reduce((sum, l) => sum + l.data.calories, 0);
        // For food, we want Daily Average, not total monthly calories (which would be huge)
        // Approximate days in month: 30
        const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        val = Math.round(total / days);
      } else if (type === 'WATER') {
        const logs = waterLogs.filter(l => l.dateStr.startsWith(monthYearStr));
        const total = logs.reduce((sum, l) => sum + l.amountMl, 0);
        // Average daily water
        const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        val = Math.round(total / days);
      } else {
        // For Finance, Total Spent per month is usually preferred over daily average
        val = financeLogs
          .filter(l => l.dateStr.startsWith(monthYearStr))
          .reduce((sum, l) => sum + l.amount, 0);
      }

      data.push({ label: monthLabel, value: val, fullDate: monthYearStr });
    }
  }

  return data;
};

export const getTodaySummary = (): DailySummary => {
  const today = getTodayStr();
  // Reuse logic or just fetch manually for speed
  const foodLogs = getFoodLogs();
  const waterLogs = getWaterLogs();
  const financeLogs = getFinanceLogs();

  const totalCalories = foodLogs.filter(l => l.dateStr === today).reduce((sum, l) => sum + l.data.calories, 0);
  const totalWaterMl = waterLogs.filter(l => l.dateStr === today).reduce((sum, l) => sum + l.amountMl, 0);
  const totalSpent = financeLogs.filter(l => l.dateStr === today).reduce((sum, l) => sum + l.amount, 0);

  return {
    dateStr: today,
    totalCalories,
    totalWaterMl,
    totalSpent
  };
};