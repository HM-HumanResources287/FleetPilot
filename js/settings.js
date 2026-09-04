// ============================================================
// ======== دوال الإعدادات والأمان ========
// ============================================================

let pinLock = localStorage.getItem('appPin') || null;
let isPinEnabled = localStorage.getItem('pinEnabled') === 'true';
let isBiometricEnabled = localStorage.getItem('biometricEnabled') === 'true';
let pinAttempts = 0;
const MAX_PIN_ATTEMPTS = 3;

function loadSecuritySettings() {
  const pinToggle = document.getElementById('pinToggle');
  if (pinToggle) {
    pinToggle.checked = isPinEnabled;
    const changeSection = document.getElementById('changePinSection');
    if (changeSection) changeSection.style.display = isPinEnabled ? 'block' : 'none';
  }
  
  const bioToggle = document.getElementById('biometricToggle');
  if (bioToggle) bioToggle.checked = isBiometricEnabled;
  
  const bioBtn = document.getElementById('pinBiometricBtn');
  if (bioBtn) bioBtn.style.display = isBiometricEnabled ? 'block' : 'none';
}

function togglePinSetting() {
  const enabled = document.getElementById('pinToggle').checked;
  if (enabled) {
    const newPin = prompt('🔒 أدخل PIN الجديد (4 أرقام):');
    if (newPin && newPin.length === 4 && !isNaN(newPin)) {
      localStorage.setItem('appPin', newPin);
      localStorage.setItem('pinEnabled', 'true');
      pinLock = newPin;
      isPinEnabled = true;
      const changeSection = document.getElementById('changePinSection');
      if (changeSection) changeSection.style.display = 'block';
      showToast('✅ تم تفعيل PIN بنجاح');
    } else {
      showToast('⚠️ PIN يجب أن يكون 4 أرقام');
      document.getElementById('pinToggle').checked = false;
    }
  } else {
    if (confirm('⚠️ هل أنت متأكد من تعطيل قفل PIN؟')) {
      localStorage.removeItem('appPin');
      localStorage.setItem('pinEnabled', 'false');
      pinLock = null;
      isPinEnabled = false;
      const changeSection = document.getElementById('changePinSection');
      if (changeSection) changeSection.style.display = 'none';
      showToast('❌ تم تعطيل PIN');
    } else {
      document.getElementById('pinToggle').checked = true;
    }
  }
}

function toggleBiometricSetting() {
  const enabled = document.getElementById('biometricToggle').checked;
  
  if (enabled) {
    if (!('PublicKeyCredential' in window)) {
      showToast('⚠️ جهازك لا يدعم البصمة');
      document.getElementById('biometricToggle').checked = false;
      return;
    }
    localStorage.setItem('biometricEnabled', 'true');
    isBiometricEnabled = true;
    const bioBtn = document.getElementById('pinBiometricBtn');
    if (bioBtn) bioBtn.style.display = 'block';
    showToast('✅ تم تفعيل البصمة');
  } else {
    localStorage.setItem('biometricEnabled', 'false');
    isBiometricEnabled = false;
    const bioBtn = document.getElementById('pinBiometricBtn');
    if (bioBtn) bioBtn.style.display = 'none';
    showToast('❌ تم تعطيل البصمة');
  }
}

function changePin() {
  if (!pinLock) {
    showToast('⚠️ PIN غير مفعل');
    return;
  }
  const oldPin = prompt('🔒 أدخل PIN الحالي:');
  if (oldPin !== pinLock) {
    showToast('⚠️ PIN الحالي غير صحيح');
    return;
  }
  const newPin = prompt('🔒 أدخل PIN الجديد (4 أرقام):');
  if (newPin && newPin.length === 4 && !isNaN(newPin)) {
    localStorage.setItem('appPin', newPin);
    pinLock = newPin;
    showToast('✅ تم تغيير PIN بنجاح');
  } else {
    showToast('⚠️ PIN يجب أن يكون 4 أرقام');
  }
}

function checkPinOnStart() {
  if (!isPinEnabled || !pinLock) {
    enterApp();
    return;
  }
  showPinEntry();
}

function showPinEntry() {
  const overlay = document.getElementById('pinOverlay');
  if (overlay) overlay.classList.add('show');
  
  const input = document.getElementById('pinInputPopup');
  if (input) {
    input.value = '';
    input.focus();
  }
  
  const error = document.getElementById('pinError');
  if (error) error.textContent = '';
  
  const attempts = document.getElementById('pinAttemptsPopup');
  if (attempts) attempts.textContent = `محاولات متبقية: ${MAX_PIN_ATTEMPTS - pinAttempts}`;
  
  const bioBtn = document.getElementById('pinBiometricBtn');
  if (bioBtn) bioBtn.style.display = isBiometricEnabled ? 'block' : 'none';
}

function verifyPinPopup() {
  const pin = document.getElementById('pinInputPopup').value;
  const errorEl = document.getElementById('pinError');
  const attemptsEl = document.getElementById('pinAttemptsPopup');
  
  if (!pin) {
    if (errorEl) errorEl.textContent = '⚠️ من فضلك أدخل PIN';
    return;
  }
  
  if (pin === pinLock) {
    pinAttempts = 0;
    const overlay = document.getElementById('pinOverlay');
    if (overlay) overlay.classList.remove('show');
    enterApp();
  } else {
    pinAttempts++;
    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      if (errorEl) errorEl.textContent = '⛔ تم تجاوز عدد المحاولات!';
      setTimeout(() => {
        const overlay = document.getElementById('pinOverlay');
        if (overlay) overlay.classList.remove('show');
        showToast('⛔ تم إغلاق التطبيق بسبب المحاولات الفاشلة');
        location.reload();
      }, 1500);
      return;
    }
    if (errorEl) errorEl.textContent = `⚠️ PIN غير صحيح، تبقى ${MAX_PIN_ATTEMPTS - pinAttempts} محاولات`;
    if (attemptsEl) attemptsEl.textContent = `محاولات متبقية: ${MAX_PIN_ATTEMPTS - pinAttempts}`;
    const input = document.getElementById('pinInputPopup');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function tryBiometricPopup() {
  if (!isBiometricEnabled) return;
  if ('PublicKeyCredential' in window) {
    if (confirm('🔐 هل تريد استخدام البصمة؟')) {
      const overlay = document.getElementById('pinOverlay');
      if (overlay) overlay.classList.remove('show');
      enterApp();
    }
  }
}

function loadSettings() {
  const s = getSettings();
  const elIds = [
    'settingDepreciation',
    'settingOilPrice',
    'settingOilDays',
    'settingRearTire',
    'settingFrontTire',
    'settingTireLifespan',
    'settingMonthlyBudget',
    'settingCreditLimit',
    'settingSavingRate'
  ];
  const values = [
    s.depreciationPercent,
    s.oilPrice,
    s.oilDays,
    s.rearTirePrice,
    s.frontTirePrice,
    s.tireLifespan,
    s.monthlyBudget,
    s.creditLimit,
    s.savingRate
  ];
  
  elIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.value = values[i];
  });
  
  if (s.oilChangeDate) {
    const oilDate = document.getElementById('oilChangeDate');
    if (oilDate) oilDate.value = s.oilChangeDate;
  }
  
  updateOilStatus();
}

function saveSettings() {
  const settings = {
    depreciationPercent: parseFloat(document.getElementById('settingDepreciation').value) || 5,
    oilPrice: parseFloat(document.getElementById('settingOilPrice').value) || 245,
    oilDays: parseFloat(document.getElementById('settingOilDays').value) || 10,
    rearTirePrice: parseFloat(document.getElementById('settingRearTire').value) || 1200,
    frontTirePrice: parseFloat(document.getElementById('settingFrontTire').value) || 800,
    tireLifespan: parseFloat(document.getElementById('settingTireLifespan').value) || 10000,
    monthlyBudget: parseFloat(document.getElementById('settingMonthlyBudget').value) || 5000,
    creditLimit: parseFloat(document.getElementById('settingCreditLimit').value) || 1000,
    savingRate: parseFloat(document.getElementById('settingSavingRate').value) || 0,
    lastOilChange: getSettings().lastOilChange || null,
    oilChangeDate: getSettings().oilChangeDate || null
  };
  
  localStorage.setItem('fleetSettings', JSON.stringify(settings));
  updateOilStatus();
  updateAll();
  showToast('✅ تم حفظ الإعدادات');
}

function changePassword() {
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  
  if (!current || !newPass || !confirm) {
    showToast('⚠️ من فضلك املأ كل الحقول');
    return;
  }
  if (newPass !== confirm) {
    showToast('⚠️ كلمة المرور الجديدة غير متطابقة');
    return;
  }
  if (newPass.length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون ٦ أحرف على الأقل');
    return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ لم يتم تسجيل الدخول');
    return;
  }
  
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, current);
  user.reauthenticateWithCredential(credential)
    .then(() => user.updatePassword(newPass))
    .then(() => {
      showToast('✅ تم تغيير كلمة المرور بنجاح');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function clearAllData() {
  if (confirm('⚠️ هل أنت متأكد من مسح كل البيانات المحلية؟ هذا لا يؤثر على Firebase')) {
    localStorage.removeItem('fleetSettings');
    localStorage.removeItem('appPin');
    localStorage.removeItem('biometricEnabled');
    loadSettings();
    updateAll();
    showToast('🗑️ تم مسح الإعدادات المحلية');
    location.reload();
  }
}

function saveOilChange() {
  const date = document.getElementById('oilChangeDate').value;
  if (!date) {
    showToast('⚠️ من فضلك اختر تاريخ تغيير الزيت');
    return;
  }
  const settings = getSettings();
  settings.lastOilChange = new Date(date).getTime();
  settings.oilChangeDate = date;
  localStorage.setItem('fleetSettings', JSON.stringify(settings));
  updateOilStatus();
  updateAll();
  showToast('🛢️ تم تسجيل تغيير الزيت بتاريخ ' + new Date(date).toLocaleDateString('ar-EG'));
}

function updateOilStatus() {
  const settings = getSettings();
  const lastOilDate = settings.lastOilChange;
  const oilDays = settings.oilDays || 10;
  
  const lastOilEl = document.getElementById('lastOilChange');
  const daysLeftEl = document.getElementById('oilDaysLeft');
  const progressBar = document.getElementById('oilProgressBar');
  const statusDisplay = document.getElementById('oilStatusDisplay');
  
  if (!lastOilDate) {
    if (lastOilEl) lastOilEl.textContent = 'لم يسجل بعد';
    if (daysLeftEl) daysLeftEl.textContent = '—';
    if (progressBar) progressBar.style.width = '0%';
    if (statusDisplay) {
      statusDisplay.className = 'oil-status warning';
      statusDisplay.innerHTML = '<i class="fas fa-exclamation-triangle oil-status-icon" style="color: var(--primary);"></i><span class="oil-status-text">لم يتم تسجيل تغيير الزيت بعد</span>';
    }
    return;
  }
  
  const now = Date.now();
  const diffDays = Math.floor((now - lastOilDate) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, oilDays - diffDays);
  const progress = Math.min(100, (diffDays / oilDays) * 100);
  
  if (lastOilEl) lastOilEl.textContent = new Date(lastOilDate).toLocaleDateString('ar-EG');
  if (daysLeftEl) {
    daysLeftEl.textContent = remaining > 0 ? `${remaining} يوم` : 'انتهى الوقت!';
    daysLeftEl.style.color = remaining > 3 ? '#51CF66' : remaining > 0 ? 'var(--primary)' : '#FF6B6B';
  }
  if (progressBar) {
    progressBar.style.width = Math.min(100, progress) + '%';
    progressBar.style.background = progress > 80 ? 'linear-gradient(90deg, var(--primary), #FF6B6B)' : 'linear-gradient(90deg, var(--primary), var(--primary-dark))';
  }
  
  if (statusDisplay) {
    if (remaining <= 0) {
      statusDisplay.className = 'oil-status danger';
      statusDisplay.innerHTML = `<i class="fas fa-times-circle oil-status-icon" style="color: #FF6B6B;"></i><span class="oil-status-text"><strong>⚠️ متأخر!</strong> تجاوزت موعد تغيير الزيت بـ ${Math.abs(remaining)} يوم</span>`;
    } else if (remaining <= 3) {
      statusDisplay.className = 'oil-status warning';
      statusDisplay.innerHTML = `<i class="fas fa-exclamation-triangle oil-status-icon" style="color: var(--primary);"></i><span class="oil-status-text"><strong>تنبيه!</strong> تبقى ${remaining} يوم على تغيير الزيت</span>`;
    } else {
      statusDisplay.className = 'oil-status good';
      statusDisplay.innerHTML = `<i class="fas fa-check-circle oil-status-icon" style="color: #51CF66;"></i><span class="oil-status-text">حالة الزيت جيدة · تبقى ${remaining} يوم</span>`;
    }
  }
  
  const tipEl = document.getElementById('maintenanceTip');
  if (tipEl) {
    if (remaining <= 0) {
      tipEl.innerHTML = '<strong>⚠️ تنبيه عاجل!</strong> أنت متأخر في تغيير الزيت، قم بتغييره فوراً';
    } else if (remaining <= 3) {
      tipEl.innerHTML = `<strong>📢 تذكير!</strong> تبقى <strong>${remaining}</strong> يوم على تغيير الزيت، استعد للتغيير`;
    } else {
      tipEl.innerHTML = '<strong>✅ حالة الزيت ممتازة</strong> استمر في التوفير للصيانة الدورية';
    }
  }
}