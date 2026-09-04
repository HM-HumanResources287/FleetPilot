window.onload = function() {
  // تهيئة اللغة
  initLanguage();
  loadTheme();
  setDefaultDateTime();
  loadSettings();
  loadSecuritySettings();
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      
      this.classList.add('active');
      const target = document.getElementById(this.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
  
  auth.onAuthStateChanged((user) => {
    if (user) {
      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            
            if (userData.disabled === true) {
              showToast('⛔ حسابك معطل، يرجى التواصل مع المشرف');
              auth.signOut();
              return;
            }
            
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('forgotPasswordScreen').classList.add('hidden');
            
            currentUserData = userData;
            updateUserHeader(userData.name, userData.role);
            
            loadSecuritySettings();
            checkPinOnStart();
            
            if (userData.role === 'admin') {
              document.getElementById('adminTabBtn').style.display = 'flex';
              loadAllUsers();
            }
          } else {
            showToast('⚠️ هذا الحساب غير مسجل في النظام');
            auth.signOut();
          }
        })
        .catch((error) => {
          showToast('❌ ' + error.message);
          auth.signOut();
        });
    } else {
      const app = document.getElementById('app');
      const tabs = document.querySelector('.bottom-tabs');
      if (app) app.style.display = 'none';
      if (tabs) tabs.classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('forgotPasswordScreen').classList.add('hidden');
    }
  });
  
  const totalKm = document.getElementById('shiftTotalKm');
  if (totalKm) totalKm.addEventListener('input', updateShiftPreview);
  
  const emptyKm = document.getElementById('shiftEmptyKm');
  if (emptyKm) emptyKm.addEventListener('input', updateShiftPreview);
  
  const bell = document.getElementById('notificationBell');
  if (bell) {
    bell.addEventListener('click', function() {
      const today = new Date().toISOString().split('T')[0];
      const todayShifts = userShifts.filter(s => s.date === today);
      const totalEarnings = getTotalWorkEarnings();
      const totalExp = userExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalDebtPaid = userDebts.reduce((sum, d) => sum + d.paid, 0);
      const totalFaultCost = userFaults.reduce((sum, f) => sum + f.cost, 0);
      const totalSavings = getSavingsTotal();
      const balance = totalEarnings + getTotalExtraIncome() - totalExp - totalDebtPaid - totalFaultCost - totalSavings;
      showToast(`📊 الشفتات: ${todayShifts.length} | الرصيد: ${balance.toFixed(0)} ج`);
    });
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(function(error) {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
  
  function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }
  
  if (isPWAInstalled()) {
    console.log('📱 FleetPilot is running as PWA');
  } else {
    console.log('🌐 FleetPilot is running in browser');
  }
};
