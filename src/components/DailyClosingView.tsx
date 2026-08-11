import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Role, Expense, Ingredient } from '@/types';
import { formatETB, formatDate, formatEthiopianDate, generateId, printDailyClosing } from '@/utils/formatters';
import { STORAGE_KEYS } from '@/constants/data';
import {
  Money, QrCode, Bank, HandCoins, Fire,
  Plus, X, Check, Printer, ArrowRight, CaretLeft, CaretRight,
  Warning, Calendar, CurrencyDollar, Receipt, FileText,
} from '@phosphor-icons/react';

interface Props {
  t: (key: string) => string;
  salesByMethod: Record<string, number>;
  totalSales: number;
  totalTax: number;
  totalTransactionCount: number;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  totalExpenses: number;
  lowStockItems: Ingredient[];
  currentRole: Role;
  lang: 'en' | 'am';
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash', telebirr: 'Telebirr', cbe_birr: 'CBE Birr',
  credit: 'Credit (Wollo)', catering: 'Catering',
};

const paymentMethodIcons: Record<string, any> = {
  cash: Money, telebirr: QrCode, cbe_birr: Bank,
  credit: HandCoins, catering: Fire,
};

const paymentMethodColors: Record<string, string> = {
  cash: 'text-emerald-600', telebirr: 'text-blue-600',
  cbe_birr: 'text-purple-600', credit: 'text-amber-600', catering: 'text-rose-600',
};

export default function DailyClosingView({
  t, salesByMethod, totalSales, totalTax, totalTransactionCount,
  expenses, setExpenses, totalExpenses, lowStockItems, currentRole, lang,
}: Props) {
  const [step, setStep] = useState(0);
  const [cashInDrawer, setCashInDrawer] = useState(totalSales - totalExpenses);
  const [closingNotes, setClosingNotes] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const steps = [
    { id: 'summary', label: t('totalSales') || 'Sales Summary' },
    { id: 'expenses', label: t('expenses') || 'Expenses' },
    { id: 'cash', label: t('cashInDrawer') || 'Cash in Drawer' },
    { id: 'review', label: t('printSummary') || 'Review & Close' },
  ];

  const canAccess = currentRole === 'owner' || currentRole === 'manager';
  if (!canAccess) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t('noAccess') || 'Access restricted to Owner & Manager'}</p>
      </div>
    );
  }

  const addExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return;
    const expense: Expense = {
      id: generateId(),
      description: newExpenseDesc.trim(),
      amount: parseFloat(newExpenseAmount),
      category: 'operational',
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => {
      const updated = [...prev, expense];
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(updated));
      return updated;
    });
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClose = () => {
    const closing = {
      id: generateId(),
      date: formatDate(new Date().toISOString()),
      ethiopianDate: formatEthiopianDate(new Date().toISOString()),
      cashSales: salesByMethod.cash || 0,
      creditSales: salesByMethod.credit || 0,
      telebirrSales: salesByMethod.telebirr || 0,
      cbeBirrSales: salesByMethod.cbe_birr || 0,
      cateringSales: salesByMethod.catering || 0,
      totalSales,
      totalTax,
      expenses: expenses.map((e) => ({ description: e.description, amount: e.amount })),
      totalExpenses,
      cashInDrawer,
      lowStockItems: lowStockItems.map((i) => (lang === 'am' ? i.nameAm : i.nameEn)),
      closedBy: currentRole,
      notes: closingNotes,
      createdAt: new Date().toISOString(),
    };

    const closings = JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyClosings) || '[]');
    closings.push(closing);
    localStorage.setItem(STORAGE_KEYS.dailyClosings, JSON.stringify(closings));
    setIsClosed(true);
    printDailyClosing(closing, lang);
  };

  const netTotal = totalSales - totalExpenses;
  const difference = cashInDrawer - netTotal;

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              step === i
                ? 'bg-emerald-600 text-white shadow-sm'
                : i < step
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < step ? <Check size={12} weight="bold" /> : <span className="w-4 h-4 rounded-full border text-[10px] flex items-center justify-center">{i + 1}</span>}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {step === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">{t('totalSales') || 'Sales Summary'}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={14} />
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('totalSales')}</p>
                <p className="text-lg font-bold text-emerald-600">{formatETB(totalSales)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('transactions') || 'Transactions'}</p>
                <p className="text-lg font-bold text-blue-600">{totalTransactionCount}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('vat') || 'VAT'}</p>
                <p className="text-lg font-bold text-purple-600">{formatETB(totalTax)}</p>
              </div>
            </div>

            {/* Payment method breakdown */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground">{t('paymentMethod') || 'Payment Breakdown'}</p>
              {Object.entries(salesByMethod).map(([method, amount]) => {
                const Icon = paymentMethodIcons[method] || Money;
                const pct = totalSales > 0 ? (amount / totalSales) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={paymentMethodColors[method] || 'text-muted-foreground'} />
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
                <p className="text-xs text-muted-foreground text-center py-3">{t('noSalesToday')}</p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t('expenses') || 'Expenses'}</h3>
              <span className="text-xs font-semibold text-rose-600">{formatETB(totalExpenses)}</span>
            </div>

            {/* Add expense form */}
            <div className="flex items-center gap-2">
              <input
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                placeholder={t('description') || 'Description'}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <input
                type="number"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                placeholder="0.00"
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button onClick={addExpense} disabled={!newExpenseDesc.trim() || !newExpenseAmount}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all active:scale-[0.98]"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>

            {/* Expense list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {expenses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">{t('noExpenses') || 'No expenses recorded'}</p>
              )}
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{exp.description}</span>
                    <span className="text-[10px] text-muted-foreground">{exp.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-rose-600">{formatETB(exp.amount)}</span>
                    <button onClick={() => removeExpense(exp.id)} className="p-0.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-semibold text-sm">{t('cashInDrawer') || 'Cash in Drawer'}</h3>
            <p className="text-xs text-muted-foreground">{t('enterActualCash') || 'Enter the actual cash count in the drawer'}</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">ETB</span>
                <input
                  type="number"
                  value={cashInDrawer}
                  onChange={(e) => setCashInDrawer(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('netTotal') || 'Net Total'}</p>
                <p className="text-sm font-bold">{formatETB(netTotal)}</p>
              </div>
              <div className={`rounded-xl p-3 ${Math.abs(difference) > 10 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                <p className="text-xs text-muted-foreground">{t('difference') || 'Difference'}</p>
                <p className={`text-sm font-bold ${Math.abs(difference) > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatETB(difference)}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="font-semibold text-sm">{t('printSummary') || 'Closing Summary'}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t('totalSales')}</span><span className="font-semibold">{formatETB(totalSales)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('vat') || 'VAT'}</span><span className="font-semibold">{formatETB(totalTax)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('totalExpenses')}</span><span className="font-semibold text-rose-600">{formatETB(totalExpenses)}</span></div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between"><span className="font-semibold">{t('netTotal') || 'Net Total'}</span><span className="font-bold text-lg">{formatETB(netTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('cashInDrawer')}</span><span className="font-semibold">{formatETB(cashInDrawer)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t('difference')}</span><span className={`font-semibold ${Math.abs(difference) > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatETB(difference)}</span></div>
              </div>
            </div>

            {/* Low stock */}
            {lowStockItems.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Warning size={14} className="text-amber-500" />
                  <h3 className="font-semibold text-sm">{t('lowStockItems')}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowStockItems.map((ing) => (
                    <span key={ing.id} className="text-[10px] px-2 py-1 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 font-medium">
                      {lang === 'am' ? ing.nameAm : ing.nameEn} ({ing.stock} {ing.unit})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-semibold text-sm mb-2">{t('notes') || 'Notes'}</h3>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder={t('addNotes') || 'Add closing notes...'}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { handleClose(); }}
                disabled={isClosed}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Check size={18} weight="bold" />
                {isClosed ? (t('completed') || 'Completed') : (t('closeRegister') || 'Close Register')}
              </button>
              <button
                onClick={() => {
                  const closing = {
                    id: generateId(),
                    date: formatDate(new Date().toISOString()),
                    ethiopianDate: formatEthiopianDate(new Date().toISOString()),
                    cashSales: salesByMethod.cash || 0,
                    creditSales: salesByMethod.credit || 0,
                    telebirrSales: salesByMethod.telebirr || 0,
                    cbeBirrSales: salesByMethod.cbe_birr || 0,
                    cateringSales: salesByMethod.catering || 0,
                    totalSales, totalTax,
                    expenses: expenses.map((e) => ({ description: e.description, amount: e.amount })),
                    totalExpenses, cashInDrawer,
                    lowStockItems: lowStockItems.map((i) => (lang === 'am' ? i.nameAm : i.nameEn)),
                    closedBy: currentRole, notes: closingNotes,
                    createdAt: new Date().toISOString(),
                  };
                  printDailyClosing(closing, lang);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all active:scale-[0.98]"
              >
                <Printer size={18} />
                {t('printSummary')}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium transition-all active:scale-[0.98]"
        >
          <CaretLeft size={14} />
          {t('back') || 'Back'}
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all active:scale-[0.98]"
        >
          {t('next') || 'Next'}
          <CaretRight size={14} />
        </button>
      </div>
    </div>
  );
}