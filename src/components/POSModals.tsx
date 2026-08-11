import { motion, AnimatePresence } from 'framer-motion';
import type { PaymentMethod, Customer } from '@/types';
import { TRANSLATIONS } from '@/constants/data';
import { formatETB } from '@/utils/formatters';
import { Check, X, CreditCard, Bank, Money, QrCode, HandCoins, Fire } from '@phosphor-icons/react';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  cartTotal: number;
  selectedPayment: PaymentMethod;
  onPaymentSelect: (method: PaymentMethod) => void;
  paymentRef: string;
  setPaymentRef: (ref: string) => void;
  showCustomerSelect: boolean;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer) => void;
  onAddCustomer: () => void;
  onConfirm: () => void;
  lang: 'en' | 'am';
}

const paymentMethods: { method: PaymentMethod; icon: any; label: string }[] = [
  { method: 'cash', icon: Money, label: 'Cash' },
  { method: 'telebirr', icon: QrCode, label: 'Telebirr' },
  { method: 'cbe_birr', icon: Bank, label: 'CBE Birr' },
  { method: 'credit', icon: HandCoins, label: 'Credit (Wollo)' },
  { method: 'catering', icon: Fire, label: 'Catering' },
];

export default function PaymentModal({
  open, onClose, cartTotal, selectedPayment, onPaymentSelect,
  paymentRef, setPaymentRef, showCustomerSelect, customers,
  selectedCustomer, onSelectCustomer, onAddCustomer, onConfirm, lang,
}: PaymentModalProps) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const isDigital = selectedPayment === 'telebirr' || selectedPayment === 'cbe_birr';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold">{t('payment')}</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="text-center mb-2">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatETB(cartTotal)}
                </div>
                <div className="text-xs text-muted-foreground">{t('total')}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = selectedPayment === pm.method;
                  return (
                    <button
                      key={pm.method}
                      onClick={() => onPaymentSelect(pm.method)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Icon size={22} className={isSelected ? 'text-emerald-600' : 'text-muted-foreground'} />
                      <span className="text-[10px] font-medium text-center leading-tight">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {isDigital && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('transactionId')}</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder={t('enterTransactionId')}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              )}

              {showCustomerSelect && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('customer')}</label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectCustomer(c)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs font-medium text-amber-600">{formatETB(c.balance)}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onAddCustomer}
                    className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    + {t('addCustomer')}
                  </button>
                </div>
              )}

              {selectedCustomer && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg">
                  <HandCoins size={12} />
                  <span>{selectedCustomer.name} ({t('balance')}: {formatETB(selectedCustomer.balance + (selectedPayment === 'credit' ? cartTotal : 0))})</span>
                </div>
              )}

              <button
                onClick={onConfirm}
                disabled={isDigital && !paymentRef.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={16} />
                {t('confirm')} {formatETB(cartTotal)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ReceiptModal({
  open, onClose, sale, customerName, onPrint, lang,
}: {
  open: boolean;
  onClose: () => void;
  sale: any;
  customerName: string | null;
  onPrint: () => void;
  lang: 'en' | 'am';
}) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  return (
    <AnimatePresence>
      {open && sale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6"
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                <Check size={28} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg">{t('saleComplete')}</h3>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatETB(sale.total)}
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={onPrint}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <PrinterIcon />
                {t('print')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-all"
              >
                {t('close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,88H200V48a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8V88H40a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16H72v24a8,8,0,0,0,8,8h96a8,8,0,0,0,8-8V184h32a16,16,0,0,0,16-16V104A16,16,0,0,0,216,88ZM72,48H184V88H72ZM184,208H72V160H184Zm32-40H184V152a8,8,0,0,0-8-8H80a8,8,0,0,0-8,8v16H40V104H216v64Z" />
    </svg>
  );
}