// ============================================================
// ======== دوال المشرف ========
// ============================================================

let allUsers = [];

function adminAddUser() {
  const name = document.getElementById('adminNewUserName').value.trim();
  const email = document.getElementById('adminNewUserEmail').value.trim();
  const password = document.getElementById('adminNewUserPassword').value;
  
  if (!name || !email || !password) {
    showToast('⚠️ من فضلك املأ كل الحقول');
    return;
  }
  if (password.length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون ٦ أحرف على الأقل');
    return;
  }
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        role: 'سائق',
        disabled: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
        totalShifts: 0
      });
    })
    .then(() => {
      showToast('✅ تم إنشاء الحساب بنجاح');
      document.getElementById('adminNewUserName').value = '';
      document.getElementById('adminNewUserEmail').value = '';
      document.getElementById('adminNewUserPassword').value = '';
      loadAllUsers();
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function makeAdmin(userId) {
  if (currentUserData?.role !== 'admin') {
    showToast('⚠️ ليس لديك صلاحية لترقية المستخدمين');
    return;
  }
  if (!confirm('هل أنت متأكد من ترقية هذا المستخدم إلى مشرف؟')) return;
  
  db.collection('users').doc(userId).update({ role: 'admin' })
    .then(() => {
      showToast('✅ تمت الترقية إلى مشرف');
      loadAllUsers();
    })
    .catch((error) => showToast('❌ ' + error.message));
}

function disableUser(userId) {
  if (currentUserData?.role !== 'admin') {
    showToast('⚠️ ليس لديك صلاحية لتعطيل المستخدمين');
    return;
  }
  if (!confirm('هل أنت متأكد من تعطيل هذا المستخدم؟')) return;
  
  db.collection('users').doc(userId).update({ disabled: true })
    .then(() => {
      showToast('⛔ تم تعطيل المستخدم');
      loadAllUsers();
    })
    .catch((error) => showToast('❌ ' + error.message));
}

function enableUser(userId) {
  if (currentUserData?.role !== 'admin') {
    showToast('⚠️ ليس لديك صلاحية لتفعيل المستخدمين');
    return;
  }
  
  db.collection('users').doc(userId).update({ disabled: false })
    .then(() => {
      showToast('✅ تم تفعيل المستخدم');
      loadAllUsers();
    })
    .catch((error) => showToast('❌ ' + error.message));
}

function deleteUser(userId) {
  if (currentUserData?.role !== 'admin') {
    showToast('⚠️ ليس لديك صلاحية لحذف المستخدمين');
    return;
  }
  if (!confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
  
  const collections = ['shifts', 'personalExpenses', 'debts', 'savings', 'faults', 'extraIncome'];
  const promises = collections.map(col => {
    return db.collection(col).where('userId', '==', userId).get().then((snapshot) => {
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      return batch.commit();
    });
  });
  
  Promise.all(promises)
    .then(() => db.collection('users').doc(userId).delete())
    .then(() => {
      showToast('🗑️ تم حذف المستخدم من النظام');
      loadAllUsers();
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function viewUserReport(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) {
    showToast('⚠️ المستخدم غير موجود');
    return;
  }
  
  let shifts = [], expenses = [], debts = [], savings = [], faults = [], income = [];
  
  const loadPromises = [
    db.collection('shifts').where('userId', '==', userId).orderBy('date', 'desc').get().then((snap) => {
      shifts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }),
    db.collection('personalExpenses').where('userId', '==', userId).get().then((snap) => {
      expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }),
    db.collection('debts').where('userId', '==', userId).get().then((snap) => {
      debts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }),
    db.collection('savings').where('userId', '==', userId).get().then((snap) => {
      savings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }),
    db.collection('faults').where('userId', '==', userId).get().then((snap) => {
      faults = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }),
    db.collection('extraIncome').where('userId', '==', userId).get().then((snap) => {
      income = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    })
  ];
  
  Promise.all(loadPromises).then(() => {
    const totalShifts = shifts.length;
    const totalRevenue = shifts.reduce((sum, s) => sum + calculateShiftTotals(s).revenue, 0);
    const totalExpenses = shifts.reduce((sum, s) => sum + calculateShiftTotals(s).expenses, 0);
    const totalDebts = debts.reduce((sum, d) => sum + d.total, 0);
    const totalDebtPaid = debts.reduce((sum, d) => sum + d.paid, 0);
    const totalSavings = savings.reduce((sum, s) => {
      if (s.type === 'deposit') return sum + s.amount;
      if (s.type === 'withdraw') return sum - s.amount;
      return sum;
    }, 0);
    const totalFaultCost = faults.reduce((sum, f) => sum + f.cost, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const msg = `📊 تقرير ${user.name || user.email}\n──────────────────\n🧾 الشفتات: ${totalShifts}\n💰 إجمالي الإيرادات: ${totalRevenue.toFixed(0)} ج\n💸 إجمالي المصاريف: ${totalExpenses.toFixed(0)} ج\n📈 صافي الربح: ${netProfit.toFixed(0)} ج\n💳 الديون المتبقية: ${(totalDebts - totalDebtPaid).toFixed(0)} ج\n🐷 التوفير: ${totalSavings.toFixed(0)} ج\n🔧 تكلفة الأعطال: ${totalFaultCost.toFixed(0)} ج\n💵 دخل إضافي: ${totalIncome.toFixed(0)} ج`;
    showToast(msg.replace(/\n/g, ' · '));
  }).catch((error) => {
    showToast('❌ ' + error.message);
  });
}

function loadAllUsers() {
  db.collection('users').get()
    .then((snapshot) => {
      allUsers = [];
      snapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() });
      });
      renderAdminUserList();
      updateAdminStats();
      updateAdminReportSelect();
    });
}

function renderAdminUserList() {
  const container = document.getElementById('adminUserList');
  if (!container) return;
  
  if (allUsers.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0;">لا يوجد مستخدمين</div>';
    return;
  }
  
  const isAdmin = currentUserData?.role === 'admin';
  
  container.innerHTML = allUsers.map(u => {
    const isUserAdmin = u.role === 'admin';
    const isDisabled = u.disabled === true;
    const statusClass = isDisabled ? 'disabled' : (isUserAdmin ? 'admin' : 'active');
    const statusText = isDisabled ? '⛔ معطل' : (isUserAdmin ? '👑 مشرف' : '✅ نشط');
    
    return `<div class="admin-user-item" style="border-right-color: ${isUserAdmin ? 'var(--primary)' : '#6C5CE7'};">
      <div class="user-info">
        <strong>${u.name || 'بدون اسم'}</strong> · ${u.email}
        <span class="user-status ${statusClass}">${statusText}</span>
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">
          آخر تسجيل دخول: ${u.lastLogin ? new Date(u.lastLogin.seconds * 1000).toLocaleDateString('ar-EG') : 'غير معروف'} · شفتات: ${u.totalShifts || 0}
        </span>
      </div>
      <div class="user-actions" style="display: flex; gap: 6px;">
        ${isAdmin && !isUserAdmin ? `<i class="fas fa-crown" onclick="makeAdmin('${u.id}')" title="ترقية إلى مشرف" style="color: #FF6B00; cursor: pointer; font-size: 16px;"></i>` : ''}
        ${isAdmin ? (isDisabled ? `<i class="fas fa-check-circle" onclick="enableUser('${u.id}')" title="تفعيل" style="color: #51CF66; cursor: pointer; font-size: 16px;"></i>` : `<i class="fas fa-ban" onclick="disableUser('${u.id}')" title="تعطيل" style="color: #FF6B6B; cursor: pointer; font-size: 16px;"></i>`) : ''}
        ${isAdmin ? `<i class="fas fa-chart-simple" onclick="viewUserReport('${u.id}')" title="عرض التقرير" style="color: var(--secondary); cursor: pointer; font-size: 16px;"></i>` : ''}
        ${isAdmin ? `<i class="fas fa-trash-can" onclick="deleteUser('${u.id}')" title="حذف المستخدم" style="color: var(--text-secondary); cursor: pointer; font-size: 16px;"></i>` : ''}
      </div>
    </div>`;
  }).join('');
}

function updateAdminStats() {
  const container = document.getElementById('adminStats');
  if (!container) return;
  
  const totalUsers = allUsers.length;
  const admins = allUsers.filter(u => u.role === 'admin').length;
  const drivers = allUsers.filter(u => u.role !== 'admin').length;
  const activeDrivers = allUsers.filter(u => u.role !== 'admin' && u.disabled !== true).length;
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div class="summary-item"><div class="label">إجمالي المستخدمين</div><div class="value gold">${totalUsers}</div></div>
      <div class="summary-item"><div class="label">المشرفين</div><div class="value green">${admins}</div></div>
      <div class="summary-item"><div class="label">السائقين النشطين</div><div class="value cyan">${activeDrivers}</div></div>
      <div class="summary-item"><div class="label">إجمالي السائقين</div><div class="value purple">${drivers}</div></div>
    </div>
  `;
}

function updateAdminReportSelect() {
  const select = document.getElementById('adminReportUserSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">اختر سائق</option>';
  allUsers.filter(u => u.role !== 'admin').forEach(u => {
    select.innerHTML += `<option value="${u.id}">${u.name || u.email}</option>`;
  });
}

function generateUserReport() {
  const userId = document.getElementById('adminReportUserSelect').value;
  if (!userId) {
    showToast('⚠️ من فضلك اختر سائق');
    return;
  }
  
  const user = allUsers.find(u => u.id === userId);
  if (!user) {
    showToast('⚠️ المستخدم غير موجود');
    return;
  }
  
  db.collection('shifts').where('userId', '==', userId).orderBy('date', 'desc').get()
    .then((snapshot) => {
      const shifts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let htmlContent = `
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: #0D0D0D;
              color: #E8E8E8;
            }
            h1 {
              color: #FF6B00;
              text-align: center;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #FF6B00;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th {
              background: #FF6B00;
              color: #0D0D0D;
              padding: 8px;
              text-align: center;
            }
            td {
              padding: 8px;
              border: 1px solid #333;
              text-align: center;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              flex-wrap: wrap;
              gap: 10px;
            }
            .summary-item {
              background: #1A1A1A;
              padding: 10px 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #333;
            }
            .summary-item .value {
              font-size: 18px;
              font-weight: bold;
              color: #FF6B00;
            }
            .footer {
              text-align: center;
              color: #888;
              margin-top: 20px;
              font-size: 12px;
              border-top: 1px solid #333;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 FleetPilot</h1>
            <h2>تقرير ${user.name || user.email}</h2>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <div class="label">عدد الشفتات</div>
              <div class="value">${shifts.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">إجمالي الإيرادات</div>
              <div class="value">${shifts.reduce((s, sh) => s + calculateShiftTotals(sh).revenue, 0).toFixed(0)} ج</div>
            </div>
            <div class="summary-item">
              <div class="label">إجمالي المصاريف</div>
              <div class="value">${shifts.reduce((s, sh) => s + calculateShiftTotals(sh).expenses, 0).toFixed(0)} ج</div>
            </div>
          </div>
          <h3>تفاصيل الشفتات</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>المسافة (كم)</th>
                <th>الإيرادات</th>
                <th>المصاريف</th>
                <th>صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              ${shifts.map((sh, i) => {
                const t = calculateShiftTotals(sh);
                const net = t.revenue - t.expenses;
                return `<tr>
                  <td>${i+1}</td>
                  <td>${sh.date}</td>
                  <td>${(sh.totalKm||0).toFixed(0)}</td>
                  <td>${t.revenue.toFixed(0)}</td>
                  <td>${t.expenses.toFixed(0)}</td>
                  <td style="color: ${net>=0?'#51CF66':'#FF6B6B'};">${net.toFixed(0)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">تم إنشاء هذا التقرير بواسطة FleetPilot</div>
        </body>
        </html>
      `;
      
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);
      
      html2pdf().set({
        margin: 10,
        filename: `تقرير_${user.name || user.email}_${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save().then(() => {
        element.remove();
        showToast('✅ تم تحميل التقرير');
      });
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function sendAdminNotification() {
  const text = document.getElementById('adminNotificationText').value.trim();
  if (!text) {
    showToast('⚠️ من فضلك اكتب نص الإشعار');
    return;
  }
  
  db.collection('notifications').add({
    text: text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    from: 'admin',
    read: false
  }).then(() => {
    showToast('✅ تم إرسال الإشعار');
    document.getElementById('adminNotificationText').value = '';
  }).catch((error) => {
    showToast('❌ ' + error.message);
  });
}

function loadDriverComparison() {
  if (currentUserData?.role !== 'admin') {
    showToast('⚠️ هذه الميزة للمشرفين فقط');
    return;
  }
  
  showToast('⏳ جاري تحميل بيانات السائقين...');
  
  db.collection('users').where('role', '==', 'سائق').get()
    .then((snapshot) => {
      const drivers = [];
      snapshot.forEach((doc) => {
        drivers.push({ id: doc.id, ...doc.data() });
      });
      
      if (drivers.length === 0) {
        document.getElementById('adminComparison').innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">لا يوجد سائقين مسجلين</div>';
        showToast('ℹ️ لا يوجد سائقين');
        return;
      }
      
      const promises = drivers.map(driver => {
        return db.collection('shifts').where('userId', '==', driver.id).get()
          .then((shiftsSnap) => {
            const shifts = shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const totalShifts = shifts.length;
            let totalRevenue = 0;
            let totalExpenses = 0;
            shifts.forEach(s => {
              const t = calculateShiftTotals(s);
              totalRevenue += t.revenue;
              totalExpenses += t.expenses;
            });
            const netProfit = totalRevenue - totalExpenses;
            return {
              ...driver,
              totalShifts,
              totalRevenue,
              totalExpenses,
              netProfit
            };
          });
      });
      
      Promise.all(promises)
        .then((results) => {
          results.sort((a, b) => b.netProfit - a.netProfit);
          showComparisonTable(results);
          showToast('✅ تم تحميل البيانات');
        });
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function showComparisonTable(drivers) {
  const container = document.getElementById('adminComparison');
  if (!container) return;
  
  if (drivers.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">لا يوجد بيانات لعرضها</div>';
    return;
  }
  
  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>#</th>
            <th>السائق</th>
            <th>الشفتات</th>
            <th>الإيرادات</th>
            <th>صافي الربح</th>
            <th>متوسط الشفت</th>
          </tr>
        </thead>
        <tbody>
          ${drivers.map((d, i) => `
            <tr>
              <td class="${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">
                ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </td>
              <td style="font-weight: ${i === 0 ? '600' : '400'};">
                ${d.name || d.email || 'بدون اسم'}
              </td>
              <td>${d.totalShifts || 0}</td>
              <td style="color: var(--primary);">${(d.totalRevenue || 0).toFixed(0)} ج</td>
              <td style="color: ${d.netProfit >= 0 ? '#51CF66' : '#FF6B6B'}; font-weight: ${d.netProfit >= 0 ? '600' : '400'};">
                ${(d.netProfit || 0).toFixed(0)} ج
              </td>
              <td style="color: ${d.netProfit >= 0 ? '#51CF66' : '#FF6B6B'};">
                ${d.totalShifts > 0 ? (d.netProfit / d.totalShifts).toFixed(0) : 0} ج
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="font-size: 10px; color: var(--text-secondary); text-align: center; margin-top: 8px;">
      🏆 تم الترتيب حسب صافي الربح
    </div>
  `;
}