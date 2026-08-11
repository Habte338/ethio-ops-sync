import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { MenuItem, SaleItem, Customer, PaymentMethod, Ingredient, Role } from '@/types';
import { SEED_MENU_ITEMS, SEED_CATEGORIES, SEED_INGREDIENTS, SEED_CUSTOMERS, STORAGE_KEYS, TRANSLATIONS } from '@/constants/data';
import { formatETB, generateId, printReceipt, addToPendingQueue, getStockStatus } from '@/utils/formatters';
import { MagnifyingGlass, Plus, Minus, Trash, X, ShoppingCart, Coffee, User } from '@phosphor-icons/react';
import PaymentModal, { ReceiptModal } from './POSModals';

interface POSProps { lang: 'en' | 'am'; currentRole: Role; currentUser: string; }

export default function POSFastEntry({ lang, currentUser }: POSProps) {
  const [ingredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ingredients);
    return saved ? JSON.parse(saved) : SEED_INGREDIENTS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.customers);
    return saved ? JSON.parse(saved) : SEED_CUSTOMERS;
  });
  const [menuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('habesha_pos_menu_items');
    return saved ? JSON.parse(saved) : SEED_MENU_ITEMS;
  });
  const [categories] = useState(SEED_CATEGORIES);
  const [sales, setSales] = useState<any[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.sales);
    return saved ? JSON.parse(saved) : [];
  });

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReceipt, setShowReceipt] = useState<any>(null);

  const filteredItems = useMemo(() => {
    let items = menuItems.filter(m => m.active);
    if (activeCategory !== 'all') items = items.filter(m => m.categoryId === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => m.nameEn.toLowerCase().includes(q) || m.nameAm.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const cartSubtotal = cartTotal / 1.15;
  const cartTax = cartTotal - cartSubtotal;

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menuItemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice } : c));
    } else {
      setCart([...cart, { menuItemId: item.id, nameEn: item.nameEn, nameAm: item.nameAm, quantity: 1, unitPrice: item.price, total: item.price }]);
    }
  };

  const updateQty = (id: string, d: number) => {
    setCart(cart.map(c => {
      if (c.menuItemId !== id) return c;
      const nq = Math.max(0, c.quantity + d);
      return nq === 0 ? null : { ...c, quantity: nq, total: nq * c.unitPrice };
    }).filter(Boolean) as SaleItem[]);
  };

  const clearCart = () => { setCart([]); setSelectedCustomer(null); setPaymentRef(''); };

  const completeSale = () => {
    if (cart.length === 0) return;
    const sale = {
      id: generateId(), clientGeneratedId: generateId(), items: cart,
      subtotal: cartSubtotal, tax: cartTax, taxRate: 15, total: cartTotal,
      paymentMethod: selectedPayment, paymentRef: paymentRef || '',
      customerId: selectedCustomer?.id || null,
      createdAt: new Date().toISOString(), synced: 'synced', cashierName: currentUser,
    };
    const newSales = [...sales, sale];
    setSales(newSales);
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(newSales));

    if (selectedPayment === 'credit' && selectedCustomer) {
      const updated = customers.map(c => c.id === selectedCustomer.id ? { ...c, balance: c.balance + cartTotal } : c);
      setCustomers(updated);
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(updated));
    }

    toast.success(t('saleComplete'));
    setShowReceipt(sale);
    setShowPayment(false);
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setPaymentRef('');
    setShowCustomerSelect(method === 'credit');
  };

  const handleAddCustomer = () => {
    const name = prompt('Customer name:');
    if (name) {
      const newC: Customer = { id: generateId(), name, phone: '', balance: 0, createdAt: new Date().toISOString() };
      const updated = [...customers, newC];
      setCustomers(updated);
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(updated));
      setSelectedCustomer(newC);
      setShowCustomerSelect(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Menu Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative mb-3">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search') + '...'}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          <button onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {t('allCategories')}
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === cat.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {lang === 'am' ? cat.nameAm : cat.nameEn}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Coffee size={48} className="opacity-30 mb-3" />
              <p className="text-sm">{t('noItems')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredItems.map(item => (
                <motion.button key={item.id} whileTap={{ scale: 0.95 }} onClick={() => addToCart(item)}
                  className="relative flex flex-col items-center p-3 rounded-xl border border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all text-center min-h-[100px]">
                  <span className="text-lg mb-1">
                    {item.categoryId === 'cat3' ? '☕' : item.categoryId === 'cat4' ? '🧃' : item.categoryId === 'cat1' ? '🍛' : item.categoryId === 'cat2' ? '🥘' : item.categoryId === 'cat5' ? '🌅' : '🍿'}
                  </span>
                  <span className="text-xs font-medium leading-tight mb-1">{lang === 'am' ? item.nameAm : item.nameEn}</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatETB(item.price)}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="lg:w-80 xl:w-96 flex flex-col bg-card border border-border rounded-2xl lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-emerald-600" />
            <span className="font-semibold text-sm">{t('items')}</span>
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{cart.length}</span>
          </div>
          {cart.length > 0 && <button onClick={clearCart} className="text-muted-foreground hover:text-red-500"><Trash size={14} /></button>}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart size={36} className="opacity-20 mb-2" />
              <p className="text-xs">{t('noItems')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.menuItemId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{lang === 'am' ? item.nameAm : item.nameEn}</div>
                    <div className="text-xs text-muted-foreground">{formatETB(item.unitPrice)} × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-background hover:bg-accent text-muted-foreground"><Minus size={12} /></button>
                    <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-background hover:bg-accent text-muted-foreground"><Plus size={12} /></button>
                  </div>
                  <div className="text-xs font-semibold w-16 text-right">{formatETB(item.total)}</div>
                  <button onClick={() => setCart(cart.filter(c => c.menuItemId !== item.menuItemId))} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500"><X size={12} /></button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground"><span>{t('subtotal')}</span><span>{formatETB(cartSubtotal)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>{t('tax')}</span><span>{formatETB(cartTax)}</span></div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
              <span>{t('total')}</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatETB(cartTotal)}</span>
            </div>
            {selectedCustomer && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg">
                <User size={12} /><span>{selectedCustomer.name}</span>
                <button onClick={() => setSelectedCustomer(null)} className="ml-auto"><X size={12} /></button>
              </div>
            )}
            <button onClick={() => setShowPayment(true)}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all active:scale-[0.98]">
              {t('tapToPay')} — {formatETB(cartTotal)}
            </button>
          </div>
        )}
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)}
        cartTotal={cartTotal} selectedPayment={selectedPayment} onPaymentSelect={handlePaymentSelect}
        paymentRef={paymentRef} setPaymentRef={setPaymentRef}
        showCustomerSelect={showCustomerSelect} customers={customers}
        selectedCustomer={selectedCustomer} onSelectCustomer={(c) => { setSelectedCustomer(c); setShowCustomerSelect(false); }}
        onAddCustomer={handleAddCustomer} onConfirm={completeSale} lang={lang} />

      <ReceiptModal open={!!showReceipt} sale={showReceipt}
        customerName={selectedCustomer?.name || null}
        onPrint={() => printReceipt(showReceipt, selectedCustomer?.name || null, lang)}
        onClose={() => { setShowReceipt(null); clearCart(); }} lang={lang} />
    </div>
  );
}