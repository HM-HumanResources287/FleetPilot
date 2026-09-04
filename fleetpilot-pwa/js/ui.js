// ============================================================
// ======== دوال الواجهة والتحديث ========
// ============================================================

let currentUserData = null;

let visibility = {
  dashboard: true,
  personal: true,
  debts: true,
  savings: true
};

function updateUserHeader(name, role) {
  const nameEl = document.getElementById('userNameDisplay');
  if (nameEl) nameEl.textContent = name || 'مستخدم';
  
  const roleEl = document.getElementById('userRoleDisplay');
  if (roleEl) {
    const isAdmin = role === 'admin';
    roleEl.textContent = isAdmin ? '👑 مشرف' : '🚗 سائق';
    roleEl.className = 'user-role ' + (isAdmin ? 'admin' : 'driver');
  }
}

function toggleVisibility(tab) {
  visibility[tab] = !visibility[tab];
  const icon = document.getElementById(tab + 'VisibilityIcon');
  if (icon) {
    icon.className = visibility[tab] ? 'fas fa-eye' : 'fas fa-eye-slash';
  }
  updateVisibility();
}

function updateVisibility() {
  // Dashboard
  const dashValues = ['dashNetProfit', 'dashMaintenanceFund', 'dashAvailableBalance', 'dashSavings'];
  dashValues.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (visibility.dashboard) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
  
  // Personal
  const personalValues = [
    'availableBalance',
    'totalWorkEarnings',
    'totalExtraIncome',
    'totalPersonalExpenses',
    'totalDebtPaidDisplay',
    'totalSavingsDisplay'
  ];
  personalValues.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (visibility.personal) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
  
  // Debts
  const debtValues = ['totalDebts', 'totalDebtPaid', 'totalDebtRemaining'];
  debtValues.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (visibility.debts) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
  
  // Savings
  const savingValues = ['totalSavings', 'totalSavingsDeposited', 'totalSavingsWithdrawn'];
  savingValues.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (visibility.savings) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

function calculateShiftTotals(shift) {
  const uberTotal = (shift.uberCash || 0) + (shift.uberWallet || 0);
  const didiTotal = (shift.didiCash || 0) + (shift.didiWallet || 0);
  const indriveTotal = (shift.indriveCash || 0) + (shift.indriveWallet || 0);
  const revenue = uberTotal + didiTotal + indriveTotal;
  const expenses = (shift.fuel || 0) + (shift.food || 0) + (shift.maintenance || 0) + (shift.phone || 0);
  return { revenue, expenses, uberTotal, didiTotal, indriveTotal };
}

function getShiftNetProfit(shift) {
  const t = calculateShiftTotals(shift);
  const oilCost = getOilCostPerDay();
  const depreciation = getDepreciationAmount(t.revenue);
  return t.revenue - t.expenses - oilCost - depreciation;
}

function getTotalWorkEarnings() {
  return userShifts.reduce((sum, sh) => sum + getShiftNetProfit(sh), 0);
}

function getMaintenanceFund() {
  const s = getSettings();
  const totalDays = userShifts.length > 0 ? new Set(userShifts.map(sh => sh.date)).size : 0;
  const oilFund = totalDays * (s.oilPrice / s.oilDays);
  let depreciationFund = 0;
  userShifts.forEach(sh => {
    const t = calculateShiftTotals(sh);
    depreciationFund += getDepreciationAmount(t.revenue);
  });
  return oilFund + depreciationFund;
}

function getTotalExtraIncome() {
  return userExtraIncome.reduce((sum, i) => sum + i.amount, 0);
}

function getSavingsTotal() {
  return userSavings.reduce((sum, s) => {
    if (s.type === 'deposit') return sum + s.amount;
    if (s.type === 'withdraw') return sum - s.amount;
    return sum;
  }, 0);
}

function getSavingsDeposited() {
  return userSavings.filter(s => s.type === 'deposit').reduce((sum, s) => sum + s.amount, 0);
}

function getSavingsWithdrawn() {
  return userSavings.filter(s => s.type === 'withdraw').reduce((sum, s) => sum + s.amount, 0);
}

function getTodayShifts() {
  const today = new Date().toISOString().split('T')[0];
  return userShifts.filter(s => s.date === today);
}

function getLast7DaysShifts() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  return userShifts.filter(s => s.date >= weekAgoStr && s.date <= today.toISOString().split('T')[0]);
}

function getLast30DaysShifts() {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split('T')[0];
  return userShifts.filter(s => s.date >= monthAgoStr && s.date <= today.toISOString().split('T')[0]);
}

function getPreviousMonthShifts() {
  const today = new Date();
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const startStr = firstDayLastMonth.toISOString().split('T')[0];
  const endStr = lastDayLastMonth.toISOString().split('T')[0];
  return userShifts.filter(s => s.date >= startStr && s.date <= endStr);
}

function updateAll() {
  try {
    const todayShifts = getTodayShifts();
    const weekShifts = getLast7DaysShifts();
    const monthShifts = getLast30DaysShifts();
    const prevMonthShifts = getPreviousMonthShifts();
    
    const totalWorkEarnings = getTotalWorkEarnings();
    const totalExtraIncome = getTotalExtraIncome();
    const totalPersonalExpenses = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDebts = userDebts.reduce((sum, d) => sum + d.total, 0);
    const totalDebtPaid = userDebts.reduce((sum, d) => sum + d.paid, 0);
    const totalDebtRemaining = totalDebts - totalDebtPaid;
    const totalFaultCost = userFaults.reduce((sum, f) => sum + f.cost, 0);
    const totalSavings = getSavingsTotal();
    const totalSavingsDeposited = getSavingsDeposited();
    const totalSavingsWithdrawn = getSavingsWithdrawn();
    
    const availableBalance = totalWorkEarnings + totalExtraIncome - totalPersonalExpenses - totalDebtPaid - totalFaultCost - totalSavings;
    
    window._availableBalance = availableBalance;
    window._totalSavings = totalSavings;
    window._maintenanceFund = getMaintenanceFund();
    window._totalDebtRemaining = totalDebtRemaining;
    
    let totalRevenue = 0, totalExpenses = 0, totalKm = 0, totalEmpty = 0, totalHours = 0;
    let appTotals = { uber: 0, didi: 0, indrive: 0 };
    
    todayShifts.forEach(sh => {
      const t = calculateShiftTotals(sh);
      totalRevenue += t.revenue;
      totalExpenses += t.expenses;
      totalKm += sh.totalKm || 0;
      totalEmpty += sh.emptyKm || 0;
      totalHours += sh.hours || 0;
      appTotals.uber += t.uberTotal;
      appTotals.didi += t.didiTotal;
      appTotals.indrive += t.indriveTotal;
    });
    
    const todayNetProfit = todayShifts.reduce((sum, sh) => sum + getShiftNetProfit(sh), 0);
    const emptyPercent = totalKm > 0 ? (totalEmpty / totalKm) * 100 : 0;
    const profitKm = totalKm - totalEmpty;
    const profitPerHour = totalHours > 0 ? todayNetProfit / totalHours : 0;
    const profitPerKm = profitKm > 0 ? todayNetProfit / profitKm : 0;
    const totalSpending = totalPersonalExpenses + totalDebtPaid + totalFaultCost + totalSavings;
    const spendingRate = (totalWorkEarnings + totalExtraIncome) > 0 ? (totalSpending / (totalWorkEarnings + totalExtraIncome)) * 100 : 0;
    
    setElementText('dashNetProfit', todayNetProfit.toFixed(0) + ' ج');
    setElementText('dashMaintenanceFund', getMaintenanceFund().toFixed(0) + ' ج');
    setElementText('dashAvailableBalance', availableBalance.toFixed(0) + ' ج');
    setElementText('dashSavings', totalSavings.toFixed(0) + ' ج');
    setElementText('dashPerHour', profitPerHour.toFixed(2) + ' ج');
    setElementText('dashPerKm', profitPerKm.toFixed(2) + ' ج');
    setElementText('dashShiftCount', todayShifts.length);
    setElementText('dashSpendingRate', spendingRate.toFixed(0) + '%');
    
    const rateEl = document.getElementById('dashSpendingRate');
    if (rateEl) rateEl.style.color = spendingRate > 50 ? '#FF6B6B' : '#51CF66';
    
    const predictionEl = document.getElementById('profitPrediction');
    const predictionNote = document.getElementById('predictionNote');
    if (weekShifts.length >= 3) {
      const weekProfits = weekShifts.map(sh => getShiftNetProfit(sh));
      const avgProfit = weekProfits.reduce((a, b) => a + b, 0) / weekProfits.length;
      const today = new Date();
      const dayOfWeek = today.getDay();
      const sameDayShifts = weekShifts.filter(sh => { 
        const d = new Date(sh.date); 
        return d.getDay() === dayOfWeek; 
      });
      let prediction = avgProfit;
      if (sameDayShifts.length > 0) {
        const sameDayAvg = sameDayShifts.reduce((a, b) => a + getShiftNetProfit(b), 0) / sameDayShifts.length;
        prediction = (avgProfit * 0.6 + sameDayAvg * 0.4);
      }
      predictionEl.textContent = prediction.toFixed(0) + ' ج';
      predictionNote.textContent = `متوسط الربح اليومي ${avgProfit.toFixed(0)} ج`;
    } else {
      predictionEl.textContent = '—';
      predictionNote.textContent = 'سجل شفتات لمدة ٣ أيام على الأقل للتفعيل';
    }
    
    const lastShift = userShifts.length > 0 ? userShifts[0] : null;
    const lastShiftEl = document.getElementById('lastShiftDisplay');
    if (lastShiftEl) {
      if (lastShift) {
        const t = calculateShiftTotals(lastShift);
        lastShiftEl.innerHTML = `
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span><i class="fas fa-calendar"></i> ${lastShift.date}</span>
            <span><i class="fas fa-clock"></i> ${lastShift.time || '—'}</span>
            <span><i class="fas fa-route"></i> ${(lastShift.totalKm || 0).toFixed(0)} كم</span>
            <span><i class="fas fa-coins"></i> ${t.revenue.toFixed(0)} ج</span>
            <span style="color: var(--primary);"><i class="fas fa-wallet"></i> ${getShiftNetProfit(lastShift).toFixed(0)} ج</span>
          </div>
        `;
      } else {
        lastShiftEl.textContent = 'لا توجد شفتات مسجلة';
      }
    }
    
    const tipEl = document.getElementById('dailyTip');
    if (tipEl) {
      if (todayShifts.length === 0) {
        tipEl.innerHTML = '<strong>نصيحة اليوم:</strong> سجل أول شفت في اليوم واضغط "حفظ" عشان تبدأ التتبع.';
      } else if (emptyPercent > 30) {
        tipEl.innerHTML = '<strong>⚠️ نسبة الفاضي مرتفعة!</strong> حاول تغير منطقة العمل أو أوقات الذروة.';
      } else if (profitPerHour < 50) {
        tipEl.innerHTML = '<strong>📉 الربح لكل ساعة منخفض!</strong> فكر ترتاح أو تغير التوقيت.';
      } else if (spendingRate > 70) {
        tipEl.innerHTML = '<strong>💰 نسبة الصرف مرتفعة!</strong> راجع مصاريفك وديونك.';
      } else {
        tipEl.innerHTML = '<strong>🔥 أداء ممتاز!</strong> استمر على نفس المستوى.';
      }
    }
    
    setElementText('availableBalance', availableBalance.toFixed(0) + ' ج');
    setElementText('totalWorkEarnings', totalWorkEarnings.toFixed(0) + ' ج');
    setElementText('totalExtraIncome', totalExtraIncome.toFixed(0) + ' ج');
    setElementText('totalPersonalExpenses', totalPersonalExpenses.toFixed(0) + ' ج');
    setElementText('totalDebtPaidDisplay', totalDebtPaid.toFixed(0) + ' ج');
    setElementText('totalSavingsDisplay', totalSavings.toFixed(0) + ' ج');
    
    setElementText('totalDebts', totalDebts.toFixed(0) + ' ج');
    setElementText('totalDebtPaid', totalDebtPaid.toFixed(0) + ' ج');
    setElementText('totalDebtRemaining', totalDebtRemaining.toFixed(0) + ' ج');
    
    setElementText('totalSavings', totalSavings.toFixed(0) + ' ج');
    setElementText('totalSavingsDeposited', totalSavingsDeposited.toFixed(0) + ' ج');
    setElementText('totalSavingsWithdrawn', totalSavingsWithdrawn.toFixed(0) + ' ج');
    
    let weekProfit = 0;
    let weekAppTotals = { uber: 0, didi: 0, indrive: 0 };
    let weekExpTotals = { fuel: 0, food: 0, maintenance: 0, phone: 0, oil: 0, depreciation: 0 };
    let dayMap = {};
    
    weekShifts.forEach(sh => {
      const t = calculateShiftTotals(sh);
      const net = getShiftNetProfit(sh);
      weekProfit += net;
      weekAppTotals.uber += t.uberTotal;
      weekAppTotals.didi += t.didiTotal;
      weekAppTotals.indrive += t.indriveTotal;
      weekExpTotals.fuel += sh.fuel || 0;
      weekExpTotals.food += sh.food || 0;
      weekExpTotals.maintenance += sh.maintenance || 0;
      weekExpTotals.phone += sh.phone || 0;
      if (dayMap[sh.date]) {
        dayMap[sh.date] += net;
      } else {
        dayMap[sh.date] = net;
      }
    });
    
    const weekOilCost = new Set(weekShifts.map(s => s.date)).size * getOilCostPerDay();
    const weekDepreciation = weekShifts.reduce((sum, sh) => sum + getDepreciationAmount(calculateShiftTotals(sh).revenue), 0);
    weekExpTotals.oil = weekOilCost;
    weekExpTotals.depreciation = weekDepreciation;
    
    setElementText('weeklyProfit', weekProfit.toFixed(0) + ' ج');
    const avg = weekShifts.length > 0 ? weekProfit / new Set(weekShifts.map(s => s.date)).size : 0;
    setElementText('weeklyAvg', avg.toFixed(0) + ' ج');
    setElementText('weeklyShiftCount', weekShifts.length);
    
    const sortedDays = Object.keys(dayMap).sort((a, b) => dayMap[b] - dayMap[a]);
    setElementText('weeklyBestDay', sortedDays.length > 0 ? sortedDays[0] : '—');
    setElementText('weeklyWorstDay', sortedDays.length > 1 ? sortedDays[sortedDays.length - 1] : '—');
    
    const appNames = { uber: '🟣 أوبر', didi: '🟠 ديدي', indrive: '🟢 إندرايف' };
    setElementText('appUberTotal', weekAppTotals.uber.toFixed(0) + ' ج');
    setElementText('appDidiTotal', weekAppTotals.didi.toFixed(0) + ' ج');
    setElementText('appIndriveTotal', weekAppTotals.indrive.toFixed(0) + ' ج');
    const bestAppWeek = Object.keys(weekAppTotals).reduce((a, b) => weekAppTotals[a] > weekAppTotals[b] ? a : b, 'uber');
    setElementText('appBest', weekShifts.length > 0 ? appNames[bestAppWeek] : '—');
    
    setElementText('expFuel', weekExpTotals.fuel.toFixed(0) + ' ج');
    setElementText('expFood', weekExpTotals.food.toFixed(0) + ' ج');
    setElementText('expMaintenance', weekExpTotals.maintenance.toFixed(0) + ' ج');
    setElementText('expPhone', weekExpTotals.phone.toFixed(0) + ' ج');
    setElementText('expOil', weekExpTotals.oil.toFixed(0) + ' ج');
    setElementText('expDepreciation', weekExpTotals.depreciation.toFixed(0) + ' ج');
    setElementText('expPersonal', totalPersonalExpenses.toFixed(0) + ' ج');
    setElementText('expDebt', totalDebtPaid.toFixed(0) + ' ج');
    setElementText('expFaults', totalFaultCost.toFixed(0) + ' ج');
    setElementText('expSavings', totalSavings.toFixed(0) + ' ج');
    
    const currentMonthTotal = monthShifts.reduce((sum, sh) => sum + (sh.fuel || 0) + (sh.food || 0) + (sh.maintenance || 0) + (sh.phone || 0), 0);
    const lastMonthTotal = prevMonthShifts.reduce((sum, sh) => sum + (sh.fuel || 0) + (sh.food || 0) + (sh.maintenance || 0) + (sh.phone || 0), 0);
    
    setElementText('currentMonthExpenses', currentMonthTotal.toFixed(0) + ' ج');
    setElementText('lastMonthExpenses', lastMonthTotal.toFixed(0) + ' ج');
    const changePercent = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const changeEl = document.getElementById('expenseChange');
    if (changeEl) {
      changeEl.textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(0) + '%';
      changeEl.style.color = changePercent > 0 ? '#FF6B6B' : '#51CF66';
    }
    
    const settings = getSettings();
    const monthlyBudget = settings.monthlyBudget || 5000;
    const monthlySpent = currentMonthTotal + totalPersonalExpenses + totalDebtPaid + totalFaultCost;
    setElementText('monthlyBudget', monthlyBudget.toFixed(0) + ' ج');
    setElementText('monthlySpent', monthlySpent.toFixed(0) + ' ج');
    
    const budgetProgress = Math.min(100, (monthlySpent / monthlyBudget) * 100);
    const budgetBar = document.getElementById('budgetProgressBar');
    if (budgetBar) budgetBar.style.width = budgetProgress + '%';
    
    const budgetStatus = document.getElementById('budgetStatus');
    if (budgetStatus) {
      if (budgetProgress > 100) {
        budgetStatus.textContent = '⚠️ تجاوزت الميزانية!';
        budgetStatus.style.color = '#FF6B6B';
      } else if (budgetProgress > 80) {
        budgetStatus.textContent = `⚠️ متبقي ${(monthlyBudget - monthlySpent).toFixed(0)} ج فقط`;
        budgetStatus.style.color = 'var(--primary)';
      } else {
        budgetStatus.textContent = `✅ متبقي ${(monthlyBudget - monthlySpent).toFixed(0)} ج`;
        budgetStatus.style.color = '#51CF66';
      }
    }
    
    updateOilStatus();
    setElementText('maintenanceFund', getMaintenanceFund().toFixed(0) + ' ج');
    setElementText('dailyOilCost', getOilCostPerDay().toFixed(1) + ' ج');
    
    const totalDep = userShifts.reduce((sum, sh) => sum + getDepreciationAmount(calculateShiftTotals(sh).revenue), 0);
    setElementText('totalDepreciation', totalDep.toFixed(0) + ' ج');
    
    const rearCost = settings.rearTirePrice / (settings.tireLifespan / 30);
    const frontCost = settings.frontTirePrice / (settings.tireLifespan / 30);
    setElementText('dailyTireCost', (rearCost + frontCost).toFixed(2) + ' ج');
    
    renderShiftList();
    renderIncomeList();
    renderExpenseList();
    renderDebtList();
    renderSavingList();
    renderFaultList();
    updateVisibility();
    
    setTimeout(updateCharts, 300);
    
  } catch (e) {
    console.error('خطأ في التحديث:', e);
  }
}

let dailyChart = null;
let expenseChart = null;

function updateCharts() {
  const weekShifts = getLast7DaysShifts();
  const days = [];
  const profits = [];
  const expenses = [];
  
  const sortedShifts = [...weekShifts].sort((a, b) => a.date.localeCompare(b.date));
  const dateMap = {};
  
  sortedShifts.forEach(sh => {
    if (!dateMap[sh.date]) {
      dateMap[sh.date] = { profit: 0, expense: 0, shifts: [] };
    }
    const t = calculateShiftTotals(sh);
    dateMap[sh.date].profit += getShiftNetProfit(sh);
    dateMap[sh.date].expense += t.expenses;
    dateMap[sh.date].shifts.push(sh);
  });
  
  Object.keys(dateMap).forEach(date => {
    days.push(date);
    profits.push(dateMap[date].profit);
    expenses.push(dateMap[date].expense);
  });
  
  const dailyCtx = document.getElementById('dailyProfitChart');
  if (dailyCtx) {
    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(dailyCtx, {
      type: 'bar',
      data: {
        labels: days.length > 0 ? days : ['لا توجد بيانات'],
        datasets: [{
          label: 'صافي الربح',
          data: days.length > 0 ? profits : [0],
          backgroundColor: 'rgba(255, 107, 0, 0.6)',
          borderColor: '#FF6B00',
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const date = days[index];
            const dayData = dateMap[date];
            if (dayData) {
              showToast(`📊 يوم ${date}: ربح ${dayData.profit.toFixed(0)} ج · ${dayData.shifts.length} شفتات`);
            }
          }
        },
        plugins: {
          legend: { labels: { color: '#888', font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `الربح: ${context.raw.toFixed(0)} ج`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#888', font: { size: 10 } } },
          x: { ticks: { color: '#888', font: { size: 9 } } }
        }
      }
    });
  }
  
  const expenseCtx = document.getElementById('expenseChart');
  if (expenseCtx) {
    if (expenseChart) expenseChart.destroy();
    const data = [
      sortedShifts.reduce((s, sh) => s + (sh.fuel || 0), 0),
      sortedShifts.reduce((s, sh) => s + (sh.food || 0), 0),
      sortedShifts.reduce((s, sh) => s + (sh.maintenance || 0), 0),
      sortedShifts.reduce((s, sh) => s + (sh.phone || 0), 0),
      new Set(sortedShifts.map(s => s.date)).size * getOilCostPerDay(),
      sortedShifts.reduce((s, sh) => s + getDepreciationAmount(calculateShiftTotals(sh).revenue), 0)
    ];
    const labels = ['بنزين', 'أكل/شرب', 'صيانة', 'شحن', 'زيت', 'إهلاك'];
    const colors = ['#FF6B00', '#FF6B6B', '#6C5CE7', '#00D4FF', '#51CF66', '#FDCB6E'];
    
    expenseChart = new Chart(expenseCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: 'rgba(255,255,255,0.05)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = labels[index];
            const value = data[index];
            showToast(`💸 ${label}: ${value.toFixed(0)} ج`);
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#888',
              font: { size: 9 },
              padding: 8
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (context.raw / total * 100).toFixed(1) : 0;
                return `${context.label}: ${context.raw.toFixed(0)} ج (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }
}

function loadUserData() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ لم يتم تسجيل الدخول');
    return;
  }

  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        currentUserData = doc.data();
        updateUserHeader(currentUserData.name, currentUserData.role);
        showToast(`👋 مرحباً بك يا ${currentUserData.name || 'مستخدم'}`);
        if (currentUserData.role === 'admin') {
          document.getElementById('adminTabBtn').style.display = 'flex';
          loadAllUsers();
        }
      }
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });

  db.collection('shifts').where('userId', '==', user.uid).orderBy('date', 'desc')
    .onSnapshot((snapshot) => {
      userShifts = [];
      snapshot.forEach((doc) => {
        userShifts.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
    });

  db.collection('personalExpenses').where('userId', '==', user.uid)
    .onSnapshot((snapshot) => {
      userExpenses = [];
      snapshot.forEach((doc) => {
        userExpenses.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
    });

  db.collection('debts').where('userId', '==', user.uid)
    .onSnapshot((snapshot) => {
      userDebts = [];
      snapshot.forEach((doc) => {
        userDebts.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
      updateDebtSelect();
    });

  db.collection('savings').where('userId', '==', user.uid)
    .onSnapshot((snapshot) => {
      userSavings = [];
      snapshot.forEach((doc) => {
        userSavings.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
    });

  db.collection('faults').where('userId', '==', user.uid)
    .onSnapshot((snapshot) => {
      userFaults = [];
      snapshot.forEach((doc) => {
        userFaults.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
    });

  db.collection('extraIncome').where('userId', '==', user.uid)
    .onSnapshot((snapshot) => {
      userExtraIncome = [];
      snapshot.forEach((doc) => {
        userExtraIncome.push({ id: doc.id, ...doc.data() });
      });
      updateAll();
    });
}