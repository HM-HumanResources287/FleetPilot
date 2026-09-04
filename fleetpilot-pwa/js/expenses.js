let userExpenses = [];
let userExtraIncome = [];

function addExtraIncome() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const type = document.getElementById('extraIncomeType').value;
  const amount = parseFloat(document.getElementById('extraIncomeAmount').value);
  const note = document.getElementById('extraIncomeNote').value || '';
  
  if (!amount || amount <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  const data = {
    userId: user.uid,
    type: type,
    amount: amount,
    note: note,
    date: new Date().toISOString().split('T')[0],
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('extraIncome').add(data)
    .then(() => {
      document.getElementById('extraIncomeAmount').value = '';
      document.getElementById('extraIncomeNote').value = '';
      showToast('✅ تم إضافة الدخل الإضافي');
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function addPersonalExpense() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const type = document.getElementById('personalExpenseType').value;
  const amount = parseFloat(document.getElementById('personalExpenseAmount').value);
  const note = document.getElementById('personalExpenseNote').value || '';
  
  if (!amount || amount <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  const data = {
    userId: user.uid,
    type: type,
    amount: amount,
    note: note,
    date: new Date().toISOString().split('T')[0],
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('personalExpenses').add(data)
    .then(() => {
      document.getElementById('personalExpenseAmount').value = '';
      document.getElementById('personalExpenseNote').value = '';
      showToast('✅ تم إضافة المصروف');
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function renderIncomeList() {
  const container = document.getElementById('extraIncomeList');
  if (!container) return;
  
  if (userExtraIncome.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا يوجد دخل إضافي</div>';
    return;
  }
  
  container.innerHTML = userExtraIncome.map(i => `
    <div class="income-item">
      <div class="income-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>${i.type}</strong> · ${i.amount.toFixed(0)} ج${i.note ? ` · ${i.note}` : ''}
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">${i.date}</span>
      </div>
      <div class="income-actions">
        <i class="fas fa-trash-can" onclick="deleteExtraIncome('${i.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>
  `).join('');
}

function renderExpenseList() {
  const container = document.getElementById('personalExpenseList');
  if (!container) return;
  
  if (userExpenses.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا توجد مصاريف شخصية</div>';
    return;
  }
  
  container.innerHTML = userExpenses.map(e => `
    <div class="expense-item">
      <div class="expense-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>${e.type}</strong> · ${e.amount.toFixed(0)} ج${e.note ? ` · ${e.note}` : ''}
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">${e.date}</span>
      </div>
      <div class="expense-actions">
        <i class="fas fa-trash-can" onclick="deletePersonalExpense('${e.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>
  `).join('');
}

function deleteExtraIncome(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الدخل الإضافي؟')) return;
  db.collection('extraIncome').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف الدخل الإضافي'))
    .catch((error) => showToast('❌ ' + error.message));
}

function deletePersonalExpense(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
  db.collection('personalExpenses').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف المصروف'))
    .catch((error) => showToast('❌ ' + error.message));
}