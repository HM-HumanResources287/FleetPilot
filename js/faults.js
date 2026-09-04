let userFaults = [];

function addFault() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const type = document.getElementById('faultType').value;
  const desc = document.getElementById('faultDesc').value.trim();
  const cost = parseFloat(document.getElementById('faultCost').value) || 0;
  const downtime = parseFloat(document.getElementById('faultDowntime').value) || 0;
  
  if (!desc) {
    showToast('⚠️ من فضلك أدخل وصف العطل');
    return;
  }
  
  const data = {
    userId: user.uid,
    type: type,
    desc: desc,
    cost: cost,
    downtime: downtime,
    date: new Date().toISOString().split('T')[0],
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('faults').add(data)
    .then(() => {
      document.getElementById('faultDesc').value = '';
      document.getElementById('faultCost').value = '';
      document.getElementById('faultDowntime').value = '';
      showToast('✅ تم تسجيل العطل');
    })
    .catch((error) => {
      showToast('❌ ' + error.message);
    });
}

function renderFaultList() {
  const container = document.getElementById('faultList');
  if (!container) return;
  
  if (userFaults.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا توجد أعطال مسجلة</div>';
    return;
  }
  
  container.innerHTML = userFaults.map(f => `
    <div class="fault-item">
      <div class="fault-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>${f.type}</strong> · ${f.desc}
        ${f.cost > 0 ? ` · تكلفة: ${f.cost.toFixed(0)} ج` : ''}
        ${f.downtime > 0 ? ` · توقف: ${f.downtime.toFixed(1)} ساعة` : ''}
        <span style="color: var(--text-secondary); font-size: 11px; display: block;">${f.date}</span>
      </div>
      <div class="fault-actions">
        <i class="fas fa-trash-can" onclick="deleteFault('${f.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>
  `).join('');
}

function deleteFault(id) {
  if (!confirm('هل أنت متأكد من حذف هذا العطل؟')) return;
  db.collection('faults').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف العطل'))
    .catch((error) => showToast('❌ ' + error.message));
}