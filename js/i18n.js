// ============================================================
// ======== إدارة اللغات (i18n) - النسخة النهائية ========
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

// ===== الترجمة الشاملة =====
function applyTranslations() {
  // 1. ترجمة العناصر اللي عليها data-i18n
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

  // 2. ترجمة كل النصوص الثابتة (حتى لو مش عليها data-i18n)
  translateAllTexts();

  // 3. تحديث اتجاه الصفحة
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;
}

// ===== ترجمة كل النصوص في الصفحة =====
function translateAllTexts() {
  const t = translations;
  if (!t) return;

  // ===== كل النصوص في الصفحة =====
  const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, label, button, a, li, td, th, strong, b, i, em, small, .card-title, .btn, .tab-btn, .summary-item .label, .summary-item .value, .input-group label, .app-label, .oil-status-text, .tip-text, .quick-summary .qs-item, .debt-info, .saving-info, .fault-info, .income-info, .expense-info, .shift-info, .admin-user-item .user-info, .comparison-table td, .comparison-table th, .setting-label span, .ds-item .ds-label, .ds-item .ds-value, .ss-item .ss-label, .ss-item .ss-value, .pin-box h3, .pin-box .pin-sub, .pin-box .pin-error, .pin-box .pin-attempts, .pin-box .pin-biometric, .auth-box .forgot-password, .auth-box .back-to-login, .auth-box .input-group label, .auth-box .btn span');

  allElements.forEach(el => {
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