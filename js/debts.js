let userDebts = [];

function addDebt() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const name = document.getElementById('debtName').value.trim();
  const total = parseFloat(document.getElementById('debtTotal').value);
  const dueDate = document.getElementById('debtDueDate').value;
  
  if (!name) {
    showToast('⚠️ من فضلك أدخل اسم الدين');
    return;
  }
  if (!total || total <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  const data = {
    userId: user.uid,
    name: name,
    total: total,
    paid: 0,
    dueDate: dueDate || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'active',
    synced: true
  };
  
  db.collection('debts').add(data)
    .then(() => {
      document.getElementById('debtName').value = '';
      document.getElementById('debtTotal').value = '';
      document.getElementById('debtDueDate').value = '';
      showToast('✅ تم إضافة الدين');
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function payDebt() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const select = document.getElementById('debtSelect');
  const debtId = select.value;
  const amount = parseFloat(document.getElementById('debtPaymentAmount').value);
  
  if (!debtId) {
    showToast('⚠️ من فضلك اختر دين');
    return;
  }
  if (!amount || amount <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  db.collection('debts').doc(debtId).get()
    .then((doc) => {
      if (!doc.exists) {
        showToast('⚠️ الدين غير موجود');
        return;
      }
      const debt = doc.data();
      const remaining = debt.total - debt.paid;
      if (amount > remaining) {
        showToast(`⚠️ المبلغ أكبر من المتبقي (المتبقي ${remaining.toFixed(0)} ج)`);
        return;
      }
      const newPaid = debt.paid + amount;
      const newStatus = newPaid >= debt.total ? 'paid' : 'active';
      return db.collection('debts').doc(debtId).update({
        paid: newPaid,
        status: newStatus
      });
    })
    .then(() => {
      document.getElementById('debtPaymentAmount').value = '';
      showToast(`✅ تم تسديد ${amount.toFixed(0)} ج`);
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function renderDebtList() {
  const container = document.getElementById('debtList');
  if (!container) return;
  
  if (userDebts.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا توجد ديون مسجلة</div>';
    return;
  }
  
  container.innerHTML = userDebts.map(d => {
    const remaining = d.total - d.paid;
    const statusText = d.status === 'paid' ? '✅ مسدد' : `⏳ متبقي ${remaining.toFixed(0)} ج`;
    return `<div class="debt-item" style="border-right-color: ${d.status === 'paid' ? '#51CF66' : '#6C5CE7'};">
      <div class="debt-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>${d.name}</strong> · ${d.total.toFixed(0)} ج
        <span style="color: ${d.status === 'paid' ? '#51CF66' : 'var(--primary)'};">${statusText}</span>
        ${d.dueDate ? ` · استحقاق: ${d.dueDate}` : ''}
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">تم التسجيل: ${d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : ''}</span>
      </div>
      <div class="debt-actions">
        <i class="fas fa-trash-can" onclick="deleteDebt('${d.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>`;
  }).join('');
}

function updateDebtSelect() {
  const select = document.getElementById('debtSelect');
  if (!select) return;
  
  const activeDebts = userDebts.filter(d => d.status === 'active');
  select.innerHTML = '<option value="">اختر دين</option>';
  activeDebts.forEach(d => {
    const remaining = d.total - d.paid;
    select.innerHTML += `<option value="${d.id}">${d.name} - متبقي ${remaining.toFixed(0)} ج</option>`;
  });
}

function deleteDebt(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الدين؟')) return;
  db.collection('debts').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف الدين'))
    .catch((error) => showToast('❌ ' + error.message));
}