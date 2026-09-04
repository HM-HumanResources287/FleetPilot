// ============================================================
// ======== إدارة اللغات (i18n) ========
// ============================================================

let currentLang = localStorage.getItem('fleetLang') || 'ar';
let translations = {};

// تحميل ملف الترجمة
async function loadLanguage(lang) {
  try {
    const response = await fetch(`locales/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem('fleetLang', lang);
    applyTranslations();
    updateLangToggle();
    return true;
  } catch (error) {
    console.error('❌ Failed to load language:', error);
    return false;
  }
}

// تطبيق الترجمة على كل حاجة
function applyTranslations() {
  console.log('🔄 تطبيق الترجمة...', currentLang);

  // ===== 1. ترجمة التبويبات =====
  const tabMap = {
    'tab-dashboard': 'dashboard',
    'tab-shift': 'shifts',
    'tab-personal': 'expenses',
    'tab-debts': 'debts',
    'tab-savings': 'savings',
    'tab-faults': 'faults',
    'tab-reports': 'reports',
    'tab-maintenance': 'maintenance',
    'tab-settings': 'settings',
    'tab-admin': 'admin'
  };

  document.querySelectorAll('.bottom-tabs .tab-btn').forEach(btn => {
    const span = btn.querySelector('span');
    if (!span) return;
    const tabId = btn.getAttribute('data-tab');
    const key = tabMap[tabId];
    if (key && translations[key]) {
      span.textContent = translations[key];
      console.log('✅ ترجمة التبويب:', key, '→', translations[key]);
    }
  });

  // ===== 2. ترجمة عناصر data-i18n =====
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });

  // ===== 3. ترجمة عناوين البطاقات =====
  document.querySelectorAll('.card-title').forEach(title => {
    const text = title.textContent.trim();
    if (translations[text]) {
      const icon = title.querySelector('i');
      title.innerHTML = '';
      if (icon) title.appendChild(icon);
      title.appendChild(document.createTextNode(' ' + translations[text]));
    }
  });

  // ===== 4. اتجاه الصفحة =====
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;

  console.log('✅ انتهت الترجمة');
}

// ===== ترجمة كل النصوص الثابتة =====
function translateAllTexts() {
  const t = translations;
  if (!t) return;

  // شاشة تسجيل الدخول
  const loginTitle = document.querySelector('#loginScreen h2');
  if (loginTitle && t.welcome) loginTitle.textContent = t.welcome;

  const loginBtn = document.querySelector('#loginScreen .btn-primary span');
  if (loginBtn && t.login) loginBtn.textContent = t.login;

  const forgotLink = document.querySelector('#loginScreen .forgot-password');
  if (forgotLink && t.forgot_password) forgotLink.textContent = t.forgot_password;

  // شاشة نسيت كلمة المرور
  const resetBtn = document.querySelector('#forgotPasswordScreen .btn-primary span');
  if (resetBtn && t.reset_password) resetBtn.textContent = t.reset_password;

  const backLink = document.querySelector('#forgotPasswordScreen .back-to-login');
  if (backLink && t.back_to_login) backLink.textContent = t.back_to_login;

  // كل العناصر التانية
  document.querySelectorAll('.card-title, .btn, .input-group label, .app-label, .oil-status-text, .tip-text, .quick-summary .qs-item, .debt-info, .saving-info, .fault-info, .income-info, .expense-info, .shift-info, .admin-user-item .user-info, .comparison-table td, .comparison-table th, .setting-label span, .ds-item .ds-label, .ds-item .ds-value, .ss-item .ss-label, .ss-item .ss-value, .pin-box h3, .pin-box .pin-sub, .pin-box .pin-error, .pin-box .pin-attempts, .pin-box .pin-biometric, .auth-box .forgot-password, .auth-box .back-to-login, .auth-box .input-group label, .auth-box .btn span').forEach(el => {
    const text = el.textContent.trim();
    if (text && t[text]) {
      el.textContent = t[text];
    }
  });
}

// تحديث أزرار اللغة
function updateLangToggle() {
  const text = currentLang === 'ar' ? '🇬🇧 English' : '🇸🇦 عربي';
  document.querySelectorAll('#langToggle, #langToggle2').forEach(el => {
    if (el) {
      const span = el.querySelector('span');
      if (span) span.textContent = text;
    }
  });
}

// تبديل اللغة
function toggleLanguage() {
  const nextLang = currentLang === 'ar' ? 'en' : 'ar';
  loadLanguage(nextLang);
}

// تهيئة اللغة
async function initLanguage() {
  const savedLang = localStorage.getItem('fleetLang') || 'ar';
  await loadLanguage(savedLang);
}

// دالة مساعدة للترجمة
function t(key, params = {}) {
  let text = translations[key] || key;
  Object.keys(params).forEach(k => {
    text = text.replace(`{${k}}`, params[k]);
  });
  return text;
}
// ===== ترجمة كل التبويبات =====
document.querySelectorAll('.bottom-tabs .tab-btn span[data-i18n]').forEach(span => {
  const key = span.getAttribute('data-i18n');
  if (translations[key]) {
    span.textContent = translations[key];
  }
});