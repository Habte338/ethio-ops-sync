import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Customer, Role } from '@/types';
import { SEED_CUSTOMERS, SEED_CUSTOMER_LEDGER, STORAGE_KEYS, TRANSLATIONS } from '@/constants/data';
import { formatETB, generateId } from '@/utils/formatters';
import { Users, HandCoins, Eye, X, Check, MagnifyingGlass } from '@phosphor-icons/react';

interface Props { lang: 'en' | 'am'; currentRole: Role; }

export default function CustomerLedgerTab({ lang }: Props) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.customers);
    return saved ? JSON.parse(saved) : SEED_CUSTOMERS;
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [recordPaymentFor, setRecordPaymentFor] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const saveCustomers = (list: Customer[]) => {
    setCustomers(list);
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(list));
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, customerSearch]);

  const handleRecordPayment = () => {
    if (!recordPaymentFor || !paymentAmount.trim()) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    const updated = customers.map((c) =>
      c.id === recordPaymentFor.id ? { ...c, balance: Math.max(0, c.balance - amt) } : c
    );
    saveCustomers(updated);
    const entry = { customerId: recordPaymentFor.id, type: 'payment', amount: amt, description: 'Tab payment', createdAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.customerLedger) || '[]');
    existing.push(entry);
    localStorage.setItem(STORAGE_KEYS.customerLedger, JSON.stringify(existing));
    toast.success('Payment of ' + formatETB(amt) + ' recorded');
    setRecordPaymentFor(null);
    setPaymentAmount('');
  };

  const getCustomerLedger = (customerId: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.customerLedger) || '[]');
    const seed = SEED_CUSTOMER_LEDGER.find((c) => c.customerId === customerId);
    const seedEntries = seed ? seed.entries.map((e) => ({ ...e, customerId })) : [];
    return [...seedEntries, ...all.filter((e: any) => e.customerId === customerId)]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
          placeholder={t('search') + '...'}
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCustomers.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <div className={`text-right ${c.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <p className="text-xs text-muted-foreground">{t('balance')}</p>
                <p className="font-bold">{formatETB(c.balance)}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setRecordPaymentFor(c)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all">
                <HandCoins size={14} /> {t('recordPayment')}
              </button>
              <button onClick={() => setStatementCustomer(c)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-accent text-xs font-medium transition-all">
                <Eye size={14} /> {t('statement')}
              </button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
            <Users size={48} className="opacity-20 mb-3" />
            <p className="text-sm">{t('noItems')}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {recordPaymentFor && (
          <Modal onClose={() => { setRecordPaymentFor(null); setPaymentAmount(''); }}>
            <h3 className="font-semibold mb-2">{t('recordPayment')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{recordPaymentFor.name} - {t('balance')}: {formatETB(recordPaymentFor.balance)}</p>
            <div className="space-y-3">
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              <div className="flex gap-2">
                <button onClick={handleRecordPayment}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5">
                  <Check size={16} /> {t('confirm')}
                </button>
                <button onClick={() => { setRecordPaymentFor(null); setPaymentAmount(''); }}
                  className="px-4 py-2.5 rounded-xl border border-input text-sm font-medium hover:bg-accent transition-all">{t('cancel')}</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {statementCustomer && (
          <Modal onClose={() => setStatementCustomer(null)}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{statementCustomer.name}</h3>
                <p className="text-xs text-muted-foreground">{statementCustomer.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('balance')}</p>
                <p className={`font-bold text-lg ${statementCustomer.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatETB(statementCustomer.balance)}
                </p>
              </div>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {getCustomerLedger(statementCustomer.id).map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs font-medium">{entry.description}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold ${entry.type === 'charge' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {entry.type === 'charge' ? '+' : '-'}{formatETB(entry.amount)}
                  </span>
                </div>
              ))}
              {getCustomerLedger(statementCustomer.id).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">{t('noItems')}</p>
              )}
            </div>
            <button onClick={() => setStatementCustomer(null)}
              className="w-full mt-4 py-2.5 rounded-xl border border-input text-sm font-medium hover:bg-accent transition-all">{t('close')}</button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-5"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}