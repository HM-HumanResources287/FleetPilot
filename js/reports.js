// ============================================================
// ======== دوال التقارير ========
// ============================================================

function getWeeklyShiftCount() {
  const weekShifts = getLast7DaysShifts();
  return weekShifts.length;
}

function getWeeklyProfit() {
  const weekShifts = getLast7DaysShifts();
  let total = 0;
  weekShifts.forEach(sh => {
    total += getShiftNetProfit(sh);
  });
  return total;
}

function getBestDay() {
  const weekShifts = getLast7DaysShifts();
  const dayMap = {};
  weekShifts.forEach(sh => {
    const net = getShiftNetProfit(sh);
    if (dayMap[sh.date]) {
      dayMap[sh.date] += net;
    } else {
      dayMap[sh.date] = net;
    }
  });
  const sorted = Object.keys(dayMap).sort((a, b) => dayMap[b] - dayMap[a]);
  return sorted.length > 0 ? sorted[0] : '—';
}

function getWorstDay() {
  const weekShifts = getLast7DaysShifts();
  const dayMap = {};
  weekShifts.forEach(sh => {
    const net = getShiftNetProfit(sh);
    if (dayMap[sh.date]) {
      dayMap[sh.date] += net;
    } else {
      dayMap[sh.date] = net;
    }
  });
  const sorted = Object.keys(dayMap).sort((a, b) => dayMap[a] - dayMap[b]);
  return sorted.length > 0 ? sorted[0] : '—';
}

function getAverageDailyProfit() {
  const weekShifts = getLast7DaysShifts();
  if (weekShifts.length === 0) return 0;
  const total = getWeeklyProfit();
  const days = new Set(weekShifts.map(s => s.date)).size;
  return days > 0 ? total / days : 0;
}

function getExpenseDistribution() {
  const weekShifts = getLast7DaysShifts();
  const distribution = {
    fuel: 0,
    food: 0,
    maintenance: 0,
    phone: 0,
    oil: 0,
    depreciation: 0
  };
  
  weekShifts.forEach(sh => {
    distribution.fuel += sh.fuel || 0;
    distribution.food += sh.food || 0;
    distribution.maintenance += sh.maintenance || 0;
    distribution.phone += sh.phone || 0;
  });
  
  const oilCost = new Set(weekShifts.map(s => s.date)).size * getOilCostPerDay();
  distribution.oil = oilCost;
  
  let depreciationTotal = 0;
  weekShifts.forEach(sh => {
    const t = calculateShiftTotals(sh);
    depreciationTotal += getDepreciationAmount(t.revenue);
  });
  distribution.depreciation = depreciationTotal;
  
  return distribution;
}

function getAppAnalysis() {
  const weekShifts = getLast7DaysShifts();
  const apps = { uber: 0, didi: 0, indrive: 0 };
  
  weekShifts.forEach(sh => {
    const t = calculateShiftTotals(sh);
    apps.uber += t.uberTotal;
    apps.didi += t.didiTotal;
    apps.indrive += t.indriveTotal;
  });
  
  const bestApp = Object.keys(apps).reduce((a, b) => apps[a] > apps[b] ? a : b, 'uber');
  const appNames = { uber: '🟣 أوبر', didi: '🟠 ديدي', indrive: '🟢 إندرايف' };
  
  return {
    uber: apps.uber,
    didi: apps.didi,
    indrive: apps.indrive,
    best: weekShifts.length > 0 ? appNames[bestApp] : '—'
  };
}