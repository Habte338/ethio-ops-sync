import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/App';
import type { Role } from '@/types';
import {
  ShoppingCart, ChartBar, Package, Users, Gear, SignOut,
  Sun, Moon, Translate, SquaresFour, Bell, Clock, HandCoins, Storefront,
} from '@phosphor-icons/react';

export interface NavItem {
  id: string;
  icon: typeof ShoppingCart;
  labelKey: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', icon: ShoppingCart, labelKey: 'pos', roles: ['cashier', 'manager', 'owner'] },
  { id: 'inventory', icon: Package, labelKey: 'inventory', roles: ['manager', 'owner'] },
  { id: 'customers', icon: Users, labelKey: 'customers', roles: ['manager', 'owner'] },
  { id: 'dashboard', icon: ChartBar, labelKey: 'dashboard', roles: ['owner'] },
  { id: 'dailyClosing', icon: Clock, labelKey: 'dailyClosing', roles: ['manager', 'owner'] },
  { id: 'settings', icon: Gear, labelKey: 'settings', roles: ['owner'] },
];

interface NavigationProps {
  activeView: string;
  setActiveView: (v: string) => void;
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
  isOnline: boolean;
  pendingCount: number;
  lang: 'en' | 'am';
  setLang: (l: 'en' | 'am') => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  currentUser: string;
  onLogout: () => void;
}

export default function Navigation({
  activeView, setActiveView, currentRole, setCurrentRole,
  isOnline, pendingCount, lang, setLang, isDark, setIsDark,
  currentUser, onLogout,
}: NavigationProps) {
  const [showMenu, setShowMenu] = useState(false);
  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      en: { owner: 'Owner', manager: 'Manager', cashier: 'Cashier', online: 'Online', offline: 'Offline', syncing: 'Syncing...', language: 'Language', theme: 'Theme', logout: 'Logout', openMenu: 'Menu' },
      am: { owner: 'ባለቤት', manager: 'ማኔጀር', cashier: 'ካሽሪ', online: 'በመስመር ላይ', offline: 'ከመስመር ውጭ', syncing: 'በማመሳሰል ላይ...', language: 'ቋንቋ', theme: 'ገጽታ', logout: 'ውጣ', openMenu: 'ሜኑ' },
    };
    return dict[lang]?.[key] || key;
  };

  const roleLabel = (r: Role) => {
    const labels: Record<Role, string> = { owner: t('owner'), manager: t('manager'), cashier: t('cashier') };
    return labels[r];
  };

  const canAccess = (item: NavItem) => item.roles.includes(currentRole);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 z-30">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
            HC
          </div>
          <div>
            <div className="font-semibold text-sm">Habesha Café</div>
            <div className="text-xs text-muted-foreground">POS & Inventory</div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex rounded-lg bg-muted p-0.5">
            {(['owner', 'manager', 'cashier'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  currentRole === role
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {roleLabel(role)}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter(canAccess).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Connection Status */}
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline ? t('online') : t('offline')}
            {pendingCount > 0 && (
              <span className="ml-auto bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                {pendingCount}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-3 border-t border-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{currentUser}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Translate size={14} />
              {lang === 'en' ? 'አማ' : 'EN'}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={onLogout} className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <SignOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {NAV_ITEMS.filter(canAccess).slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-all ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[10px] font-medium truncate max-w-full">{t(item.labelKey)}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-all ${
              showMenu ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            }`}
          >
            <SquaresFour size={20} />
            <span className="text-[10px] font-medium">{t('openMenu')}</span>
          </button>
        </div>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-2 right-2 mb-2 bg-card border border-border rounded-xl shadow-xl p-3"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <div className="flex rounded-lg bg-muted p-0.5 flex-1">
                  {(['owner', 'manager', 'cashier'] as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setCurrentRole(role)}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                        currentRole === role
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {roleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {NAV_ITEMS.filter(canAccess).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveView(item.id); setShowMenu(false); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                <button onClick={() => setLang(lang === 'en' ? 'am' : 'en')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent">
                  <Translate size={14} /> {lang === 'en' ? 'አማርኛ' : 'English'}
                </button>
                <button onClick={() => setIsDark(!isDark)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent">
                  {isDark ? <Sun size={14} /> : <Moon size={14} />} {t('theme')}
                </button>
                <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto">
                  <SignOut size={14} /> {t('logout')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}