import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Role, Sale, Ingredient, Expense } from '@/types';
import { SEED_INGREDIENTS, TRANSLATIONS, STORAGE_KEYS } from '@/constants/data';
import { formatETB, formatDate, formatTime, getCurrentEthiopianDate, getToday, getStockStatus } from '@/utils/formatters';
import { ChartBar, Clock, Warning, CurrencyDollar, Receipt, FileText, Calendar, Money, QrCode, Bank, HandCoins, Fire } from '@phosphor-icons/react';
import DailyClosingView from './DailyClosingView';

interface Props {
  lang: 'en' | 'am';
  currentRole: Role;
  closingTab?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash', telebirr: 'Telebirr', cbe_birr: 'CBE Birr',
  credit: 'Credit (Wollo)', catering: 'Catering',
};

export const paymentMethodIcons: Record<string, any> = {
  cash: Money, telebirr: QrCode, cbe_birr: Bank,
  credit: HandCoins, catering: Fire,
};

export const paymentMethodColors: Record<string, string> = {
  cash: 'text-emerald-600', telebirr: 'text-blue-600',
  cbe_birr: 'text-purple-600', credit: 'text-amber-600', catering: 'text-rose-600',
};

export default function DashboardAndReports({ lang, currentRole, closingTab }: Props) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [activeSection, setActiveSection] = useState(closingTab ? 'closing' : 'dashboard');
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.expenses);
    return saved ? JSON.parse(saved) : [];
  });
  const [sales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sales);
    return saved ? JSON.parse(saved) : [];
  });
  const [ingredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ingredients);
    return saved ? JSON.parse(saved) : SEED_INGREDIENTS;
  });

  const todaySales = useMemo(() => {
    const todayStart = getToday();
    return sales.filter((s) => s.createdAt >= todayStart);
  }, [sales]);

  const salesByMethod = useMemo(() => {
    const map: Record<string, number> = { cash: 0, telebirr: 0, cbe_birr: 0, credit: 0, catering: 0 };
    todaySales.forEach((s) => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total; });
    return map;
  }, [todaySales]);

  const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalTax = todaySales.reduce((sum, s) => sum + s.tax, 0);
  const totalTransactionCount = todaySales.length;

  const lowStockItems = useMemo(() => {
    return ingredients.filter((i) => getStockStatus(i.stock, i.minStock) !== 'ok');
  }, [ingredients]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const sectionTabs = [
    { id: 'dashboard', icon: ChartBar, labelKey: 'dashboard', roles: ['owner', 'manager'] as Role[] },
    { id: 'closing', icon: Clock, labelKey: 'dailyClosing', roles: ['owner', 'manager'] as Role[] },
  ];

  const canAccess = (item: typeof sectionTabs[0]) => item.roles.includes(currentRole);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t(closingTab ? 'dailyClosing' : 'dashboard')}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={14} />
          <span>{formatDate(new Date().toISOString())}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {getCurrentEthiopianDate()}
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {sectionTabs.filter(canAccess).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeSection === 'closing' ? (
            <DailyClosingView
              t={t}
              salesByMethod={salesByMethod}
              totalSales={totalSales}
              totalTax={totalTax}
              totalTransactionCount={totalTransactionCount}
              expenses={expenses}
              setExpenses={setExpenses}
              totalExpenses={totalExpenses}
              lowStockItems={lowStockItems}
              currentRole={currentRole}
              lang={lang}
            />
          ) : (
            <DashboardView
              t={t}
              salesByMethod={salesByMethod}
              totalSales={totalSales}
              totalTax={totalTax}
              totalTransactionCount={totalTransactionCount}
              lowStockItems={lowStockItems}
              todaySales={todaySales}
              currentRole={currentRole}
              lang={lang}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DashboardView({
  t, salesByMethod, totalSales, totalTax, totalTransactionCount,
  lowStockItems, todaySales, currentRole, lang,
}: {
  t: (k: string) => string;
  salesByMethod: Record<string, number>;
  totalSales: number; totalTax: number; totalTransactionCount: number;
  lowStockItems: Ingredient[]; todaySales: Sale[];
  currentRole: Role; lang: 'en' | 'am';
}) {
  const kpiCards = [
    { label: t('todaySales'), value: formatETB(totalSales), icon: CurrencyDollar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Transactions', value: String(totalTransactionCount), icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: t('vat') || 'VAT (15%)', value: formatETB(totalTax), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: t('lowStock'), value: String(lowStockItems.length), icon: Warning, color: lowStockItems.length > 0 ? 'text-red-600' : 'text-emerald-600', bg: lowStockItems.length > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon size={20} className={kpi.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="font-semibold text-sm mb-4">{t('paymentMethod') || 'Sales by Payment'}</h3>
        <div className="space-y-3">
          {Object.entries(salesByMethod).map(([method, amount]) => {
            const Icon = paymentMethodIcons[method] || Money;
            const pct = totalSales > 0 ? (amount / totalSales) * 100 : 0;
            return (
              <div key={method}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={paymentMethodColors[method] || 'text-muted-foreground'} />
                    <span className="text-xs font-medium">{paymentMethodLabels[method] || method}</span>
                  </div>
                  <span className="text-xs font-semibold">{formatETB(amount)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {Object.values(salesByMethod).every((v) => v === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noSalesToday')}</p>
          )}
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Warning size={16} className="text-amber-500" />
            <h3 className="font-semibold text-sm">{t('lowStock')}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {lowStockItems.slice(0, 8).map((ing) => (
              <div key={ing.id} className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-medium">{lang === 'am' ? ing.nameAm : ing.nameEn}</span>
                <span className="text-xs font-bold text-red-600">{ing.stock} {ing.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentRole === 'owner' && todaySales.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-semibold text-sm mb-3">{t('todaySales')}</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {todaySales.slice(-10).reverse().map((sale) => {
              const Icon = paymentMethodIcons[sale.paymentMethod] || Money;
              return (
                <div key={sale.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={paymentMethodColors[sale.paymentMethod] || 'text-muted-foreground'} />
                    <div>
                      <p className="text-xs font-medium">{formatTime(sale.createdAt)}</p>
                      <p className="text-[10px] text-muted-foreground">{sale.items.length} items</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold">{formatETB(sale.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}