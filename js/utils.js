function showToast(msg) {
  const old = document.querySelector('.toast-msg');
  if (old) old.remove();
  
  const div = document.createElement('div');
  div.className = 'toast-msg';
  div.textContent = msg;
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = '0.5s';
    setTimeout(() => div.remove(), 300);
  }, 4000);
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const icon = document.getElementById('themeToggle');
  if (icon) {
    icon.className = document.body.classList.contains('light-mode') ? 'fas fa-sun' : 'fas fa-moon';
  }
  const settings = getSettings();
  settings.theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('fleetSettings', JSON.stringify(settings));
}

function loadTheme() {
  const settings = getSettings();
  if (settings.theme === 'light') {
    document.body.classList.add('light-mode');
    const icon = document.getElementById('themeToggle');
    if (icon) icon.className = 'fas fa-sun';
  }
}

function getSettings() {
  const defaults = {
    depreciationPercent: 5,
    oilPrice: 245,
    oilDays: 10,
    rearTirePrice: 1200,
    frontTirePrice: 800,
    tireLifespan: 10000,
    monthlyBudget: 5000,
    creditLimit: 1000,
    savingRate: 0,
    lastOilChange: null,
    oilChangeDate: null
  };
  
  try {
    const data = localStorage.getItem('fleetSettings');
    if (!data) return defaults;
    const parsed = JSON.parse(data);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function getOilCostPerDay() {
  const s = getSettings();
  return s.oilPrice / s.oilDays;
}

function getDepreciationAmount(revenue) {
  const s = getSettings();
  return revenue * (s.depreciationPercent / 100);
}

function setDefaultDateTime() {
  const now = new Date();
  const dateEl = document.getElementById('shiftDate');
  if (dateEl) dateEl.value = now.toISOString().split('T')[0];
  const timeEl = document.getElementById('shiftTime');
  if (timeEl) timeEl.value = now.toTimeString().slice(0, 5);
}

function clearShiftForm() {
  document.querySelectorAll('#tab-shift input, #tab-shift textarea').forEach(el => {
    if (el.type !== 'date' && el.type !== 'time' && el.id !== 'editShiftId') {
      el.value = '';
    }
  });
  const editId = document.getElementById('editShiftId');
  if (editId) editId.value = '';
  setDefaultDateTime();
  const profitKm = document.getElementById('shiftProfitKm');
  if (profitKm) profitKm.textContent = '٠ كم';
  const emptyPercent = document.getElementById('shiftEmptyPercent');
  if (emptyPercent) emptyPercent.textContent = '٠٪';
}

function updateShiftPreview() {
  const total = parseFloat(document.getElementById('shiftTotalKm').value) || 0;
  const empty = parseFloat(document.getElementById('shiftEmptyKm').value) || 0;
  const profit = total - empty;
  const percent = total > 0 ? (empty / total) * 100 : 0;
  const profitKm = document.getElementById('shiftProfitKm');
  if (profitKm) profitKm.textContent = profit.toFixed(0) + ' كم';
  const emptyPercent = document.getElementById('shiftEmptyPercent');
  if (emptyPercent) emptyPercent.textContent = percent.toFixed(0) + '%';
}

function backupData() {
  const data = {
    shifts: userShifts,
    expenses: userExpenses,
    debts: userDebts,
    savings: userSavings,
    faults: userFaults,
    extraIncome: userExtraIncome,
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fleetpilot_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ تم تحميل النسخة الاحتياطية');
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result);
        if (data.shifts) userShifts = data.shifts;
        if (data.expenses) userExpenses = data.expenses;
        if (data.debts) userDebts = data.debts;
        if (data.savings) userSavings = data.savings;
        if (data.faults) userFaults = data.faults;
        if (data.extraIncome) userExtraIncome = data.extraIncome;
        if (data.settings) localStorage.setItem('fleetSettings', JSON.stringify(data.settings));
        showToast('✅ تم استعادة البيانات بنجاح');
        location.reload();
      } catch (error) {
        showToast('❌ الملف غير صالح');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}