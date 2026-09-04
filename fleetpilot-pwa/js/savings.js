let userSavings = [];

function depositToSavings() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const amount = parseFloat(document.getElementById('savingDepositAmount').value);
  const note = document.getElementById('savingDepositNote').value || '';
  
  if (!amount || amount <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  const data = {
    userId: user.uid,
    type: 'deposit',
    amount: amount,
    note: note || 'إيداع يدوي',
    date: new Date().toISOString().split('T')[0],
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('savings').add(data)
    .then(() => {
      document.getElementById('savingDepositAmount').value = '';
      document.getElementById('savingDepositNote').value = '';
      showToast(`✅ تم إيداع ${amount.toFixed(0)} ج في التوفير`);
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function withdrawFromSavings() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const amount = parseFloat(document.getElementById('savingWithdrawAmount').value);
  const note = document.getElementById('savingWithdrawNote').value || '';
  
  if (!amount || amount <= 0) {
    showToast('⚠️ من فضلك أدخل مبلغ صحيح');
    return;
  }
  
  const totalSavings = getSavingsTotal();
  if (amount > totalSavings) {
    showToast(`⚠️ المبلغ أكبر من الرصيد (الرصيد ${totalSavings.toFixed(0)} ج)`);
    return;
  }
  
  const data = {
    userId: user.uid,
    type: 'withdraw',
    amount: amount,
    note: note || 'سحب يدوي',
    date: new Date().toISOString().split('T')[0],
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('savings').add(data)
    .then(() => {
      document.getElementById('savingWithdrawAmount').value = '';
      document.getElementById('savingWithdrawNote').value = '';
      showToast(`✅ تم سحب ${amount.toFixed(0)} ج من التوفير`);
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function renderSavingList() {
  const container = document.getElementById('savingList');
  if (!container) return;
  
  if (userSavings.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا توجد حركات توفير</div>';
    return;
  }
  
  container.innerHTML = userSavings.map(s => {
    const isDeposit = s.type === 'deposit';
    return `<div class="saving-item" style="border-right-color: ${isDeposit ? '#51CF66' : '#FF6B6B'};">
      <div class="saving-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>${isDeposit ? '💰 إيداع' : '💸 سحب'}</strong> ${isDeposit ? '+' : '-'} ${s.amount.toFixed(0)} ج${s.note ? ` · ${s.note}` : ''}
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">${s.date}</span>
      </div>
      <div class="saving-actions">
        <i class="fas fa-trash-can" onclick="deleteSaving('${s.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>`;
  }).join('');
}

function deleteSaving(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الحركة؟')) return;
  db.collection('savings').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف الحركة'))
    .catch((error) => showToast('❌ ' + error.message));
}