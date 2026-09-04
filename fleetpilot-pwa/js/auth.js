function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('forgotPasswordScreen').classList.add('hidden');
  document.getElementById('loginError').classList.add('hidden');
}

function showForgotPassword() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('forgotPasswordScreen').classList.remove('hidden');
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  
  if (!email || !password) {
    if (errorEl) {
      errorEl.textContent = '⚠️ من فضلك أدخل البريد وكلمة المرور';
      errorEl.classList.remove('hidden');
    }
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      if (errorEl) errorEl.classList.add('hidden');
      showToast('✅ تم تسجيل الدخول بنجاح');
    })
    .catch((error) => {
      let msg = '❌ ' + error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = '⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
      }
    });
}

function resetPassword() {
  const email = document.getElementById('resetEmail').value;
  if (!email) {
    showToast('⚠️ من فضلك أدخل البريد الإلكتروني');
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      showToast('✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
      showLogin();
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function logout() {
  auth.signOut().then(() => {
    const app = document.getElementById('app');
    const tabs = document.querySelector('.bottom-tabs');
    if (app) app.style.display = 'none';
    if (tabs) tabs.classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    showToast('👋 تم تسجيل الخروج');
  });
}

function enterApp() {
  const app = document.getElementById('app');
  const tabs = document.querySelector('.bottom-tabs');
  if (app) app.style.display = 'block';
  if (tabs) tabs.classList.remove('hidden');
  loadUserData();
}