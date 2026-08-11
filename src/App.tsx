import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import POSFastEntry from './components/POSFastEntry';
import InventoryManager from './components/InventoryManager';
import DashboardAndReports from './components/DashboardAndReports';
import { SEED_USERS, TRANSLATIONS, STORAGE_KEYS } from './constants/data';
import { getPendingCount } from './utils/formatters';
import type { Role, User } from './types';
import { Coffee } from '@phosphor-icons/react';

type Lang = 'en' | 'am';

interface TranslationCtx {
  t: (key: string) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
}
const TranslationContext = createContext<TranslationCtx>({
  t: (k) => k, lang: 'en', setLang: () => {},
});
export const useTranslation = () => useContext(TranslationContext);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [isDark, setIsDark] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>('cashier');
  const [currentUser, setCurrentUser] = useState('Cashier');
  const [activeView, setActiveView] = useState('pos');
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const t = useCallback((key: string) => TRANSLATIONS[lang]?.[key] || key, [lang]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (saved) {
      const u = JSON.parse(saved) as User;
      setUser(u);
      setCurrentRole(u.role);
      setCurrentUser(u.name);
    }
    const theme = localStorage.getItem('habesha_pos_theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('habesha_pos_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const updatePending = () => setPendingCount(getPendingCount());
    updatePending();
    const interval = setInterval(updatePending, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setIsOnline(navigator.onLine), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    const found = SEED_USERS.find((u) => u.pin === pinInput);
    if (found) {
      setUser(found);
      setCurrentRole(found.role);
      setCurrentUser(found.name);
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(found));
      setPinError('');
    } else {
      setPinError('Invalid PIN');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPinInput('');
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    const roleUser = SEED_USERS.find((u) => u.role === role);
    if (roleUser) setCurrentUser(roleUser.name);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
              <Coffee size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Habesha Café</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">POS &amp; Inventory System</p>
          </div>
          <div className="space-y-3">
            <input type="password" maxLength={4} inputMode="numeric"
              value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            {pinError && <p className="text-xs text-red-500 text-center">{pinError}</p>}
            <button onClick={handleLogin} disabled={pinInput.length !== 4}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98]">
              Sign In
            </button>
          </div>
          <div className="mt-6 text-xs text-center text-slate-400 dark:text-slate-500 space-y-1">
            <p>Demo PINs: 1234 (Owner), 2345 (Manager), 3456 (Cashier)</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <TranslationContext.Provider value={{ t, lang, setLang }}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navigation
          activeView={activeView} setActiveView={setActiveView}
          currentRole={currentRole} setCurrentRole={handleRoleChange}
          isOnline={isOnline} pendingCount={pendingCount}
          lang={lang} setLang={setLang}
          isDark={isDark} setIsDark={setIsDark}
          currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="p-4 lg:p-6 min-h-[calc(100vh-80px)] md:min-h-screen">
              {activeView === 'pos' && <POSFastEntry lang={lang} currentRole={currentRole} currentUser={currentUser} />}
              {activeView === 'inventory' && <InventoryManager lang={lang} currentRole={currentRole} />}
              {activeView === 'customers' && <InventoryManager lang={lang} currentRole={currentRole} customerTab />}
              {activeView === 'dashboard' && <DashboardAndReports lang={lang} currentRole={currentRole} />}
              {activeView === 'dailyClosing' && <DashboardAndReports lang={lang} currentRole={currentRole} closingTab />}
              {activeView === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h1 className="text-2xl font-bold">{t('settings')}</h1>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('language')}</p>
                        <p className="text-xs text-muted-foreground">English / አማርኛ</p>
                      </div>
                      <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
                        {lang === 'en' ? 'አማርኛ' : 'English'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('theme')}</p>
                        <p className="text-xs text-muted-foreground">{isDark ? t('darkMode') : t('lightMode')}</p>
                      </div>
                      <button onClick={() => setIsDark(!isDark)}
                        className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium transition-all">
                        {isDark ? t('lightMode') : t('darkMode')}
                      </button>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground">Habesha Café POS v1.0</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </TranslationContext.Provider>
  );
}

export default App;