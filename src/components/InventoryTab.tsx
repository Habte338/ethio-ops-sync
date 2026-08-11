import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Ingredient, Role } from '@/types';
import { SEED_INGREDIENTS, SEED_MENU_ITEMS, STORAGE_KEYS, TRANSLATIONS } from '@/constants/data';
import { formatETB, generateId, getStockStatus, getStockStatusColor, getStockStatusLabel, calculateFoodCost, calculateFoodCostPercentage } from '@/utils/formatters';
import { Package, Warning, Plus, MagnifyingGlass, Trash, Pencil, Check, X } from '@phosphor-icons/react';

interface Props { lang: 'en' | 'am'; currentRole: Role; }

export default function InventoryTab({ lang, currentRole }: Props) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ingredients);
    return saved ? JSON.parse(saved) : SEED_INGREDIENTS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({ nameEn: '', nameAm: '', unit: 'kg', stock: 0, minStock: 0, costPerUnit: 0 });
  const [showNewIngredient, setShowNewIngredient] = useState(false);

  const saveIngredients = (list: Ingredient[]) => {
    setIngredients(list);
    localStorage.setItem(STORAGE_KEYS.ingredients, JSON.stringify(list));
  };

  const filteredIngredients = useMemo(() => {
    let list = ingredients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.nameEn.toLowerCase().includes(q) || i.nameAm.toLowerCase().includes(q));
    }
    return list;
  }, [ingredients, searchQuery]);

  const lowStockItems = ingredients.filter((i) => getStockStatus(i.stock, i.minStock) !== 'ok');

  const foodCostData = useMemo(() => {
    return SEED_MENU_ITEMS.filter((m) => m.active).map((item) => {
      const cost = calculateFoodCost(item.recipe, ingredients);
      const pct = calculateFoodCostPercentage(item.recipe, ingredients, item.price);
      return { name: item.nameEn, cost, price: item.price, pct };
    });
  }, [ingredients]);

  const handleStockAdjust = (id: string, delta: number) => {
    saveIngredients(ingredients.map((i) => i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i));
  };

  const handleSaveIngredient = () => {
    if (!editForm.nameEn.trim()) return;
    if (editIngredient) {
      saveIngredients(ingredients.map((i) => i.id === editIngredient.id ? { ...i, ...editForm } : i));
      toast.success('Ingredient updated');
    } else {
      saveIngredients([...ingredients, { id: generateId(), ...editForm }]);
      toast.success('Ingredient added');
    }
    setEditIngredient(null);
    setShowNewIngredient(false);
  };

  const handleDeleteIngredient = (id: string) => {
    saveIngredients(ingredients.filter((i) => i.id !== id));
    toast.success('Ingredient removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search') + '...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <button onClick={() => { setShowNewIngredient(true); setEditForm({ nameEn: '', nameAm: '', unit: 'kg', stock: 0, minStock: 0, costPerUnit: 0 }); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">
          <Plus size={16} /> {t('addItem')}
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
          <Warning size={18} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{lowStockItems.length} {t('lowStock')}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">{t('itemName')}</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">{t('unitCost')}</th>
                <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground">{t('stockIn')}</th>
                <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground">{t('reorderLevel')}</th>
                <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-xs text-muted-foreground">Value</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ing) => {
                const status = getStockStatus(ing.stock, ing.minStock);
                return (
                  <tr key={ing.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">
                      <span>{lang === 'am' ? ing.nameAm : ing.nameEn}</span>
                      <span className="text-xs text-muted-foreground ml-2">({ing.unit})</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatETB(ing.costPerUnit)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleStockAdjust(ing.id, -1)}
                          className="w-6 h-6 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-xs">-</button>
                        <span className="w-10 text-center font-semibold">{ing.stock}</span>
                        <button onClick={() => handleStockAdjust(ing.id, 1)}
                          className="w-6 h-6 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-xs">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{ing.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        status === 'ok' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStockStatusColor(status)}`} />
                        {getStockStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatETB(ing.stock * ing.costPerUnit)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditIngredient(ing); setEditForm({ nameEn: ing.nameEn, nameAm: ing.nameAm, unit: ing.unit, stock: ing.stock, minStock: ing.minStock, costPerUnit: ing.costPerUnit }); }}
                          className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteIngredient(ing.id)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-muted-foreground hover:text-red-500"><Trash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="font-semibold text-sm mb-3">{t('foodCost')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {foodCostData.slice(0, 8).map((item) => {
            const color = item.pct > 40 ? 'text-red-600' : item.pct > 28 ? 'text-amber-600' : 'text-emerald-600';
            return (
              <div key={item.name} className="bg-muted/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                <div className={`text-sm font-bold ${color}`}>{item.pct.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground">{formatETB(item.cost)} / {formatETB(item.price)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {(editIngredient || showNewIngredient) && (
          <Modal onClose={() => { setEditIngredient(null); setShowNewIngredient(false); }}>
            <h3 className="font-semibold mb-4">{editIngredient ? 'Edit' : t('addItem')}</h3>
            <div className="space-y-3">
              <InputField label="English Name" value={editForm.nameEn} onChange={(v) => setEditForm({ ...editForm, nameEn: v })} />
              <InputField label="Amharic Name" value={editForm.nameAm} onChange={(v) => setEditForm({ ...editForm, nameAm: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('unitCost')}</label>
                  <input type="number" value={editForm.costPerUnit} onChange={(e) => setEditForm({ ...editForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('reorderLevel')}</label>
                  <input type="number" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit</label>
                  <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                    <option>kg</option><option>L</option><option>pcs</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('stockIn')}</label>
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveIngredient} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all">{t('save')}</button>
                <button onClick={() => { setEditIngredient(null); setShowNewIngredient(false); }} className="px-4 py-2.5 rounded-xl border border-input text-sm font-medium hover:bg-accent transition-all">{t('cancel')}</button>
              </div>
            </div>
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

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
    </div>
  );
}