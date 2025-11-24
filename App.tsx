import React, { useState, useEffect } from 'react';
import { Utensils, Droplet, IndianRupee, Moon, Sun, Download } from 'lucide-react';
import { FoodTracker } from './components/FoodTracker';
import { WaterTracker } from './components/WaterTracker';
import { FinanceTracker } from './components/FinanceTracker';
import { AppTab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FOOD);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifebalance_theme');
      return saved === 'dark' || (!saved);
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('lifebalance_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('lifebalance_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col relative border-x border-gray-200 dark:border-dark-800 ${isDarkMode ? 'bg-black text-gray-100' : 'bg-gray-50 text-gray-900'}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >


      <header className="px-6 pt-6 pb-2 flex justify-between items-center z-10">
        <div>
          <h1 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            HUSTLE<span className="text-gold-500">.</span>
          </h1>
          <p className={`text-xs font-medium tracking-widest uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Progress Tracker</p>
        </div>
        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-gold-500 text-black text-xs font-bold rounded-full shadow-lg hover:bg-gold-400 transition-all animate-fade-in"
            >
              <Download className="w-3 h-3" /> Install
            </button>
          )}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDarkMode
                ? 'bg-dark-800 text-gold-500 hover:bg-dark-700'
                : 'bg-white text-gold-600 shadow-md hover:bg-gray-100'
              }`}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>


      <main className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {activeTab === AppTab.FOOD && <FoodTracker isDarkMode={isDarkMode} />}
        {activeTab === AppTab.WATER && <WaterTracker isDarkMode={isDarkMode} />}
        {activeTab === AppTab.FINANCE && <FinanceTracker isDarkMode={isDarkMode} />}
      </main>


      <div className={`absolute bottom-6 left-4 right-4 rounded-2xl shadow-2xl border p-2 flex justify-around items-center z-50 transition-colors duration-300 backdrop-blur-md ${isDarkMode
          ? 'bg-dark-800/90 border-dark-600'
          : 'bg-white/90 border-gray-200'
        }`}>
        <button
          onClick={() => setActiveTab(AppTab.FOOD)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${activeTab === AppTab.FOOD
              ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20 -translate-y-3 scale-110'
              : isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-dark-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Utensils className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Diet</span>
        </button>

        <button
          onClick={() => setActiveTab(AppTab.WATER)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${activeTab === AppTab.WATER
              ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20 -translate-y-3 scale-110'
              : isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-dark-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Droplet className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Water</span>
        </button>

        <button
          onClick={() => setActiveTab(AppTab.FINANCE)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${activeTab === AppTab.FINANCE
              ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20 -translate-y-3 scale-110'
              : isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-dark-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
        >
          <IndianRupee className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Money</span>
        </button>
      </div>
    </div>
  );
};

export default App;