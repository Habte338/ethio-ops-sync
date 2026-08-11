export function formatETB(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
];

// Approximate Ethiopian date calculation (based on known offset)
// Gregorian Sep 11 = Ethiopian Meskerem 1 (Sep 12 in leap year)
export function toEthiopianDate(gregorianDate: Date): { day: number; month: string; monthIndex: number; year: number } {
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1;
  const gDay = gregorianDate.getDate();

  const isLeap = (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0;
  const offset = isLeap ? 11 : 10;

  // Calculate julian day and convert to Ethiopian
  // Simple approach: Ethiopian year = Gregorian year - 8 (Sep-Apr) or -7 (May-Aug)
  let eYear = gMonth >= 9 && gDay >= offset ? gYear - 7 : gYear - 8;
  let eMonth: number;
  let eDay: number;

  // Convert Gregorian date to approximate Ethiopian date
  const startOfEthiopianYear = new Date(gYear, 8, offset); // Sep 11 or 12
  const diffDays = Math.floor((gregorianDate.getTime() - startOfEthiopianYear.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    eMonth = Math.floor(diffDays / 30);
    eDay = (diffDays % 30) + 1;
    if (eMonth >= 13) {
      eMonth = 12;
      eDay = diffDays - 360 + 1;
    }
  } else {
    // Previous Ethiopian year
    eYear = gYear - 8;
    const prevYearStart = new Date(gYear - 1, 8, 11);
    const prevDiff = Math.floor((gregorianDate.getTime() - prevYearStart.getTime()) / (1000 * 60 * 60 * 24));
    if (prevDiff < 0) {
      eYear = gYear - 9;
      const prevPrevStart = new Date(gYear - 2, 8, 11);
      const prevPrevDiff = Math.floor((gregorianDate.getTime() - prevPrevStart.getTime()) / (1000 * 60 * 60 * 24));
      eMonth = Math.floor(prevPrevDiff / 30);
      eDay = (prevPrevDiff % 30) + 1;
      if (eMonth >= 13) { eMonth = 12; eDay = prevPrevDiff - 360 + 1; }
    } else {
      eMonth = Math.floor(prevDiff / 30);
      eDay = (prevDiff % 30) + 1;
      if (eMonth >= 13) { eMonth = 12; eDay = prevDiff - 360 + 1; }
    }
  }

  if (eMonth < 0) eMonth = 0;
  if (eMonth > 12) eMonth = 12;
  if (eDay < 1) eDay = 1;
  if (eDay > 30) eDay = 30;

  return { day: eDay, month: ETHIOPIAN_MONTHS[eMonth], monthIndex: eMonth, year: eYear };
}

export function formatEthiopianDate(dateStr: string): string {
  const d = toEthiopianDate(new Date(dateStr));
  return `${d.day} ${d.month} ${d.year}`;
}

export function getCurrentEthiopianDate(): string {
  const d = toEthiopianDate(new Date());
  return `${d.day} ${d.month} ${d.year}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getTodayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function getStockStatus(stock: number, minStock: number): 'ok' | 'warning' | 'low' {
  if (stock <= 0) return 'low';
  if (stock <= minStock * 0.5) return 'low';
  if (stock <= minStock) return 'warning';
  return 'ok';
}

export function getStockStatusLabel(status: 'ok' | 'warning' | 'low'): string {
  switch (status) {
    case 'ok': return 'Good';
    case 'warning': return 'Low';
    case 'low': return 'Critical';
  }
}

export function getStockStatusColor(status: 'ok' | 'warning' | 'low'): string {
  switch (status) {
    case 'ok': return 'bg-emerald-500';
    case 'warning': return 'bg-amber-500';
    case 'low': return 'bg-red-500';
  }
}

export function calculateFoodCost(recipe: { ingredientId: string; quantity: number }[], ingredients: { id: string; costPerUnit: number }[]): number {
  return recipe.reduce((total, ri) => {
    const ing = ingredients.find(i => i.id === ri.ingredientId);
    return total + (ing ? ri.quantity * ing.costPerUnit : 0);
  }, 0);
}

export function calculateFoodCostPercentage(recipe: { ingredientId: string; quantity: number }[], ingredients: { id: string; costPerUnit: number }[], price: number): number {
  if (price <= 0) return 0;
  const cost = calculateFoodCost(recipe, ingredients);
  return (cost / price) * 100;
}

// IndexedDB offline queue simulation via localStorage
export function addToPendingQueue(sale: any) {
  const pending = JSON.parse(localStorage.getItem('habesha_pos_pending_sales') || '[]');
  pending.push({ ...sale, synced: 'pending', clientGeneratedId: generateId() });
  localStorage.setItem('habesha_pos_pending_sales', JSON.stringify(pending));
}

export function getPendingCount(): number {
  const pending = JSON.parse(localStorage.getItem('habesha_pos_pending_sales') || '[]');
  return pending.length;
}

export function syncPendingSales(): { synced: number; failed: number } {
  const pending = JSON.parse(localStorage.getItem('habesha_pos_pending_sales') || '[]');
  if (pending.length === 0) return { synced: 0, failed: 0 };

  // Simulate sync: move to main sales store
  const sales = JSON.parse(localStorage.getItem('habesha_pos_sales') || '[]');
  let synced = 0;
  const remaining = pending.filter((s: any) => {
    if (Math.random() > 0.1) { // 90% success rate simulation
      sales.push({ ...s, synced: 'synced' });
      synced++;
      return false;
    }
    return true;
  });

  localStorage.setItem('habesha_pos_sales', JSON.stringify(sales));
  localStorage.setItem('habesha_pos_pending_sales', JSON.stringify(remaining));
  return { synced, failed: remaining.length };
}

export function printReceipt(sale: any, customerName: string | null, lang: 'en' | 'am') {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        receipt: 'RECEIPT', date: 'Date', time: 'Time', cashier: 'Cashier',
        customer: 'Customer', item: 'Item', qty: 'Qty', price: 'Price',
        subtotal: 'Subtotal', tax: 'VAT (15%)', total: 'Total',
        payment: 'Payment', ref: 'Ref', thankYou: 'Thank you for dining with us!',
      },
      am: {
        receipt: 'ደረሰኝ', date: 'ቀን', time: 'ሰዓት', cashier: 'ካሽሪ',
        customer: 'ደንበኛ', item: 'እቃ', qty: 'ብዛት', price: 'ዋጋ',
        subtotal: 'ንዑስ ድምር', tax: 'ቫት (15%)', total: 'ጠቅላላ',
        payment: 'ክፍያ', ref: 'ማጣቀሻ', thankYou: 'እንደገና እንዲመጡ እንኳን ደህና መጡ!',
      },
    };
    return translations[lang]?.[key] || key;
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Cash', credit: 'Credit (Wollo)', telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr', catering: 'Catering',
  };

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const itemsHtml = sale.items.map((item: any) =>
    `<tr><td>${item.nameEn}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatETB(item.unitPrice)}</td><td style="text-align:right">${formatETB(item.total)}</td></tr>`
  ).join('');

  printWindow.document.write(`
    <html><head><title>${t('receipt')}</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px; }
      h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
      .header { text-align: center; margin-bottom: 10px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      th { border-bottom: 1px dashed #000; text-align: left; font-size: 11px; }
      td { font-size: 11px; padding: 2px 0; }
      .total-row td { border-top: 1px dashed #000; font-weight: bold; }
      .footer { text-align: center; margin-top: 15px; font-size: 11px; }
      .divider { border-top: 1px dashed #000; margin: 10px 0; }
    </style></head><body>
    <h2>☕ Habesha Café</h2>
    <div class="header">
      ${t('date')}: ${formatDate(sale.createdAt)}<br>
      ${t('time')}: ${formatTime(sale.createdAt)}<br>
      ${t('cashier')}: ${sale.cashierName}<br>
      ${customerName ? `${t('customer')}: ${customerName}<br>` : ''}
    </div>
    <table>
      <tr><th>${t('item')}</th><th style="text-align:center">${t('qty')}</th><th style="text-align:right">${t('price')}</th><th style="text-align:right">${t('total')}</th></tr>
      ${itemsHtml}
      <tr><td colspan="3" style="text-align:right">${t('subtotal')}</td><td style="text-align:right">${formatETB(sale.subtotal)}</td></tr>
      <tr><td colspan="3" style="text-align:right">${t('tax')}</td><td style="text-align:right">${formatETB(sale.tax)}</td></tr>
      <tr class="total-row"><td colspan="3" style="text-align:right">${t('total')}</td><td style="text-align:right">${formatETB(sale.total)}</td></tr>
    </table>
    <div class="divider"></div>
    <div style="text-align:center">
      ${t('payment')}: ${paymentLabels[sale.paymentMethod] || sale.paymentMethod}<br>
      ${sale.paymentRef ? `${t('ref')}: ${sale.paymentRef}` : ''}
    </div>
    <div class="footer">${t('thankYou')}</div>
    <script>window.print();window.close();</script>
  </body></html>`);
  printWindow.document.close();
}

export function printDailyClosing(closing: any, lang: 'en' | 'am') {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        dailySummary: 'DAILY CLOSING SUMMARY', date: 'Date', ethiopianDate: 'Ethiopian Date',
        cashSales: 'Cash Sales', creditSales: 'Credit Sales', telebirrSales: 'Telebirr Sales',
        cbeBirrSales: 'CBE Birr Sales', cateringSales: 'Catering Sales',
        totalSales: 'Total Sales', totalTax: 'Total VAT',
        expenses: 'Expenses', totalExpenses: 'Total Expenses',
        netTotal: 'Net Total', cashInDrawer: 'Cash in Drawer',
        lowStock: 'Low Stock Items', notes: 'Notes', closedBy: 'Closed By',
      },
      am: {
        dailySummary: 'የቀን መዝጊያ ማጠቃለያ', date: 'ቀን', ethiopianDate: 'የኢትዮጵያ ቀን',
        cashSales: 'ጥሬ ገንዘብ ሽያጭ', creditSales: 'የብድር ሽያጭ', telebirrSales: 'የተለብር ሽያጭ',
        cbeBirrSales: 'የሲቢኢ ብር ሽያጭ', cateringSales: 'የዝግጅት ሽያጭ',
        totalSales: 'ጠቅላላ ሽያጭ', totalTax: 'ጠቅላላ ቫት',
        expenses: 'ወጪዎች', totalExpenses: 'ጠቅላላ ወጪ',
        netTotal: 'የተጣራ ድምር', cashInDrawer: 'በመሳቢያ ውስጥ ያለ ገንዘብ',
        lowStock: 'ዝቅተኛ ክምችት', notes: 'ማስታወሻ', closedBy: 'ያዘጋጀው',
      },
    };
    return translations[lang]?.[key] || key;
  };

  const printWindow = window.open('', '_blank', 'width=500,height=700');
  if (!printWindow) return;

  const expensesHtml = (closing.expenses || []).map((e: any) =>
    `<tr><td>${e.description}</td><td style="text-align:right">${formatETB(e.amount)}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="text-align:center">None</td></tr>';

  printWindow.document.write(`
    <html><head><title>${t('dailySummary')}</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; max-width: 400px; margin: auto; }
      h2 { text-align: center; margin: 0 0 5px; }
      .header { text-align: center; margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; }
      td { padding: 4px 0; }
      .total-row td { border-top: 1px solid #000; font-weight: bold; }
      .divider { border-top: 1px dashed #000; margin: 15px 0; }
    </style></head><body>
    <h2>☕ Habesha Café</h2>
    <div class="header">
      <h3>${t('dailySummary')}</h3>
      ${t('date')}: ${closing.date}<br>
      ${t('ethiopianDate')}: ${closing.ethiopianDate}<br>
      ${t('closedBy')}: ${closing.closedBy}
    </div>
    <div class="divider"></div>
    <table>
      <tr><td>${t('cashSales')}</td><td style="text-align:right">${formatETB(closing.cashSales)}</td></tr>
      <tr><td>${t('telebirrSales')}</td><td style="text-align:right">${formatETB(closing.telebirrSales)}</td></tr>
      <tr><td>${t('cbeBirrSales')}</td><td style="text-align:right">${formatETB(closing.cbeBirrSales)}</td></tr>
      <tr><td>${t('creditSales')}</td><td style="text-align:right">${formatETB(closing.creditSales)}</td></tr>
      <tr><td>${t('cateringSales')}</td><td style="text-align:right">${formatETB(closing.cateringSales)}</td></tr>
      <tr class="total-row"><td>${t('totalSales')}</td><td style="text-align:right">${formatETB(closing.totalSales)}</td></tr>
      <tr><td>${t('totalTax')}</td><td style="text-align:right">${formatETB(closing.totalTax)}</td></tr>
    </table>
    <div class="divider"></div>
    <h4>${t('expenses')}</h4>
    <table>${expensesHtml}</table>
    <tr class="total-row"><td>${t('totalExpenses')}</td><td style="text-align:right">${formatETB(closing.totalExpenses)}</td></tr>
    <div class="divider"></div>
    <table>
      <tr class="total-row"><td>${t('netTotal')}</td><td style="text-align:right">${formatETB(closing.totalSales - closing.totalExpenses)}</td></tr>
      <tr><td>${t('cashInDrawer')}</td><td style="text-align:right">${formatETB(closing.cashInDrawer)}</td></tr>
    </table>
    ${closing.lowStockItems?.length ? `<div class="divider"></div><h4>${t('lowStock')}</h4><p>${closing.lowStockItems.join(', ')}</p>` : ''}
    ${closing.notes ? `<div class="divider"></div><p><strong>${t('notes')}:</strong> ${closing.notes}</p>` : ''}
    <script>window.print();window.close();</script>
  </body></html>`);
  printWindow.document.close();
}