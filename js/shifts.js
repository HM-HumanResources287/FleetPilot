let userShifts = [];

function saveShift() {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠️ من فضلك سجل الدخول أولاً');
    return;
  }
  
  const date = document.getElementById('shiftDate').value;
  const time = document.getElementById('shiftTime').value;
  const totalKm = parseFloat(document.getElementById('shiftTotalKm').value) || 0;
  const emptyKm = parseFloat(document.getElementById('shiftEmptyKm').value) || 0;
  const hours = parseFloat(document.getElementById('shiftHours').value) || 0;
  
  const uberCash = parseFloat(document.getElementById('shiftUberCash').value) || 0;
  const uberWallet = parseFloat(document.getElementById('shiftUberWallet').value) || 0;
  const didiCash = parseFloat(document.getElementById('shiftDidiCash').value) || 0;
  const didiWallet = parseFloat(document.getElementById('shiftDidiWallet').value) || 0;
  const indriveCash = parseFloat(document.getElementById('shiftIndriveCash').value) || 0;
  const indriveWallet = parseFloat(document.getElementById('shiftIndriveWallet').value) || 0;
  
  const fuel = parseFloat(document.getElementById('shiftFuel').value) || 0;
  const food = parseFloat(document.getElementById('shiftFood').value) || 0;
  const maintenance = parseFloat(document.getElementById('shiftMaintenance').value) || 0;
  const phone = parseFloat(document.getElementById('shiftPhone').value) || 0;
  const notes = document.getElementById('shiftNotes').value || '';
  const editId = document.getElementById('editShiftId').value;
  
  if (!date) {
    showToast('⚠️ من فضلك أدخل التاريخ');
    return;
  }
  if (totalKm <= 0) {
    showToast('⚠️ من فضلك أدخل المسافة الكلية');
    return;
  }
  
  const shiftData = {
    userId: user.uid,
    date: date,
    time: time,
    totalKm: totalKm,
    emptyKm: emptyKm,
    hours: hours,
    uberCash: uberCash,
    uberWallet: uberWallet,
    didiCash: didiCash,
    didiWallet: didiWallet,
    indriveCash: indriveCash,
    indriveWallet: indriveWallet,
    fuel: fuel,
    food: food,
    maintenance: maintenance,
    phone: phone,
    notes: notes,
    synced: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  if (editId) {
    db.collection('shifts').doc(editId).update(shiftData)
      .then(() => {
        document.getElementById('editShiftId').value = '';
        showToast('✅ تم تعديل الشفت بنجاح');
      })
      .catch((error) => {
        showToast('❌ ' + error.message);
      });
  } else {
    db.collection('shifts').add(shiftData)
      .then(() => {
        showToast('✅ تم حفظ الشفت بنجاح');
        clearShiftForm();
      })
      .catch((error) => {
        showToast('❌ ' + error.message);
      });
  }
}

function renderShiftList() {
  const container = document.getElementById('todayShiftList');
  if (!container) return;
  
  const search = document.getElementById('shiftSearch')?.value.toLowerCase() || '';
  const fromDate = document.getElementById('shiftFromDate')?.value || '';
  const toDate = document.getElementById('shiftToDate')?.value || '';
  
  let filtered = userShifts.filter(sh => {
    const matchSearch = sh.date.includes(search) || 
                        (sh.notes || '').toLowerCase().includes(search) || 
                        (sh.totalKm || 0).toString().includes(search);
    const matchFrom = !fromDate || sh.date >= fromDate;
    const matchTo = !toDate || sh.date <= toDate;
    return matchSearch && matchFrom && matchTo;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 12px 0; font-size: 13px;">لا توجد شفتات مطابقة</div>';
    return;
  }
  
  container.innerHTML = filtered.map((sh, idx) => {
    const net = getShiftNetProfit(sh);
    return `<div class="shift-item">
      <div class="shift-info" style="font-size: 12px; color: var(--text-secondary); flex: 1;">
        <strong>#${idx + 1}</strong> ${sh.time || ''} · ${(sh.totalKm || 0).toFixed(0)} كم · <span style="color: var(--primary);">${net.toFixed(0)} ج</span>
        ${sh.notes ? `<br><span style="color: var(--text-secondary); font-size: 11px;">📝 ${sh.notes}</span>` : ''}
        <br><span style="color: var(--text-secondary); font-size: 10px;">${sh.date}</span>
      </div>
      <div class="shift-actions" style="display: flex; gap: 6px;">
        <i class="fas fa-pen-to-square" onclick="editShift('${sh.id}')" title="تعديل" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
        <i class="fas fa-trash-can" onclick="deleteShift('${sh.id}')" title="حذف" style="color: var(--text-secondary); cursor: pointer; font-size: 16px; transition: var(--transition);"></i>
      </div>
    </div>`;
  }).join('');
}

function editShift(id) {
  const shift = userShifts.find(s => s.id === id);
  if (!shift) return;
  
  document.getElementById('shiftDate').value = shift.date || '';
  document.getElementById('shiftTime').value = shift.time || '';
  document.getElementById('shiftTotalKm').value = shift.totalKm || '';
  document.getElementById('shiftEmptyKm').value = shift.emptyKm || '';
  document.getElementById('shiftHours').value = shift.hours || '';
  document.getElementById('shiftUberCash').value = shift.uberCash || '';
  document.getElementById('shiftUberWallet').value = shift.uberWallet || '';
  document.getElementById('shiftDidiCash').value = shift.didiCash || '';
  document.getElementById('shiftDidiWallet').value = shift.didiWallet || '';
  document.getElementById('shiftIndriveCash').value = shift.indriveCash || '';
  document.getElementById('shiftIndriveWallet').value = shift.indriveWallet || '';
  document.getElementById('shiftFuel').value = shift.fuel || '';
  document.getElementById('shiftFood').value = shift.food || '';
  document.getElementById('shiftMaintenance').value = shift.maintenance || '';
  document.getElementById('shiftPhone').value = shift.phone || '';
  document.getElementById('shiftNotes').value = shift.notes || '';
  document.getElementById('editShiftId').value = shift.id;
  
  document.querySelector('[data-tab="tab-shift"]').click();
  document.getElementById('tab-shift').scrollIntoView({ behavior: 'smooth' });
  showToast('✏️ جارٍ تعديل الشفت');
}

function deleteShift(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الشفت؟')) return;
  db.collection('shifts').doc(id).delete()
    .then(() => showToast('🗑️ تم حذف الشفت'))
    .catch((error) => showToast('❌ ' + error.message));
}