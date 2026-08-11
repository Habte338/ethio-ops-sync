import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Role, Ingredient, MenuItem } from '@/types';
import { SEED_INGREDIENTS, SEED_MENU_ITEMS, TRANSLATIONS, STORAGE_KEYS } from '@/constants/data';
import { formatETB, calculateFoodCost, calculateFoodCostPercentage } from '@/utils/formatters';
import { Package, Users, ClipboardText } from '@phosphor-icons/react';
import InventoryTab from './InventoryTab';
import CustomerLedgerTab from './CustomerLedgerTab';

interface Props {
  lang: 'en' | 'am';
  currentRole: Role;
  customerTab?: boolean;
}

const TABS = [
  { id: 'inventory', icon: Package, labelKey: 'inventory' },
  { id: 'recipes', icon: ClipboardText, labelKey: 'recipes' },
  { id: 'customers', icon: Users, labelKey: 'customers' },
] as const;

export default function InventoryManager({ lang, currentRole, customerTab }: Props) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;
  const [activeTab, setActiveTab] = useState(customerTab ? 'customers' : 'inventory');

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('inventory')}</h1>
      </div>

      <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'inventory' && <InventoryTab lang={lang} currentRole={currentRole} />}
          {activeTab === 'recipes' && <RecipeCostView lang={lang} />}
          {activeTab === 'customers' && <CustomerLedgerTab lang={lang} currentRole={currentRole} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RecipeCostView({ lang }: { lang: 'en' | 'am' }) {
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  const [ingredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ingredients);
    return saved ? JSON.parse(saved) : SEED_INGREDIENTS;
  });

  const [menuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('habesha_pos_menu_items');
    return saved ? JSON.parse(saved) : SEED_MENU_ITEMS;
  });

  const ingredientMap = useMemo(() => {
    return new Map(ingredients.map((i) => [i.id, i]));
  }, [ingredients]);

  const activeItems = menuItems.filter((m) => m.active);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-sm mb-4">{t('recipes')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeItems.map((item) => {
          const totalCost = calculateFoodCost(item.recipe, ingredients);
          const pct = calculateFoodCostPercentage(item.recipe, ingredients, item.price);
          const color = pct > 40 ? 'text-red-500' : pct > 28 ? 'text-amber-500' : 'text-emerald-500';
          return (
            <div key={item.id} className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{lang === 'am' ? item.nameAm : item.nameEn}</span>
                <span className={`text-sm font-bold ${color}`}>{pct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('foodCost')}: {formatETB(totalCost)}</span>
                <span>{t('price')}: {formatETB(item.price)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct > 40 ? 'bg-red-500' : pct > 28 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                {item.recipe.map((ri) => {
                  const ing = ingredientMap.get(ri.ingredientId);
                  return ing ? (
                    <div key={ri.ingredientId} className="flex justify-between">
                      <span>{lang === 'am' ? ing.nameAm : ing.nameEn}</span>
                      <span>{ri.quantity} {ing.unit} &times; {formatETB(ing.costPerUnit)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
        {activeItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
            {t('noItems')}
          </div>
        )}
      </div>
    </div>
  );
}