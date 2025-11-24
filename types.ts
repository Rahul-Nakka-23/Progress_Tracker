export enum AppTab {
  FOOD = 'FOOD',
  WATER = 'WATER',
  FINANCE = 'FINANCE',
}

export interface MicroNutrient {
  name: string;
  amount: string;
  unit: string;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysisResult {
  dishName: string;
  ingredients: string[];
  calories: number;
  macros: MacroNutrients;
  micros: MicroNutrient[];
  reasoning?: string;
}

export interface FoodLog {
  id: string;
  timestamp: number;
  dateStr: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  data: FoodAnalysisResult;
  imageBase64?: string;
}

export interface WaterLog {
  id: string;
  timestamp: number;
  dateStr: string;
  amountMl: number;
}

export interface FinanceLog {
  id: string;
  timestamp: number;
  dateStr: string;
  item: string;
  category: string;
  amount: number;
}

export interface DailySummary {
  dateStr: string;
  totalCalories: number;
  totalWaterMl: number;
  totalSpent: number;
}

export interface GraphDataPoint {
  label: string;
  value: number;
  fullDate?: string;
}