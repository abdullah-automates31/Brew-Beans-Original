'use strict';

/* ============================================================
   AUTH GUARD
   ============================================================ */
let currentUser = null;

(async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = 'admin.html';
    return;
  }
  currentUser = data.session.user;
  document.getElementById('userEmail').textContent = currentUser.email || 'Admin';
  document.getElementById('userAvatar').textContent = (currentUser.email || 'A').charAt(0).toUpperCase();
  bootDashboard();
})();

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.href = 'admin.html';
});

document.querySelector('.btn-logout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'admin.html';
});

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function money(n) {
  return 'Rs. ' + Math.round(Number(n) || 0).toLocaleString();
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(message, isError) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : ' success');
  toast.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

let confirmResolver = null;
function showConfirm(message) {
  document.getElementById('confirmMsg').textContent = message;
  document.getElementById('confirmOverlay').classList.add('show');
  return new Promise(resolve => { confirmResolver = resolve; });
}
document.getElementById('confirmYesBtn').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('show');
  if (confirmResolver) { confirmResolver(true); confirmResolver = null; }
});
document.querySelector('#confirmOverlay .btn-confirm-no').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('show');
  if (confirmResolver) { confirmResolver(false); confirmResolver = null; }
});

function openModal(overlay) { overlay.classList.add('show'); }
function closeModal(overlay) { overlay.classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
  overlay.querySelectorAll('.modal-close, .btn-modal.close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(overlay));
  });
});

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const STATUS_FLOW = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = { placed: 'Placed', preparing: 'Preparing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };

function isToday(iso) {
  const d = new Date(iso), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isSameMonth(iso) {
  const d = new Date(iso), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const PAGE_META = {
  orders: { title: 'Orders', subtitle: 'Manage incoming orders' },
  menu: { title: 'Menu', subtitle: 'Manage your menu items' },
  hours: { title: 'Business Hours', subtitle: 'Set when customers can order' },
  addons: { title: 'Add-ons', subtitle: 'Manage customization options' },
  staff: { title: 'Staff PINs', subtitle: 'Manage staff access codes' },
  analytics: { title: 'Analytics', subtitle: 'Performance at a glance' },
};

const loadedPages = new Set();

function goToPage(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  const meta = PAGE_META[page];
  if (meta) {
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.subtitle;
  }
  if (page === 'orders') { document.getElementById('newOrdersBadge').classList.remove('show'); document.getElementById('newOrdersBadge').textContent = '0'; }
  if (!loadedPages.has(page)) {
    loadedPages.add(page);
    if (page === 'menu') loadMenu();
    if (page === 'hours') loadHours();
    if (page === 'addons') loadAddonGroups();
    if (page === 'staff') loadStaff();
    if (page === 'analytics') loadAnalytics();
  } else if (page === 'analytics') {
    loadAnalytics(); // stats can go stale fast; refresh on every visit
  }
}

document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => goToPage(btn.dataset.page));
});

function bootDashboard() {
  loadBusinessHoursStatus();
  loadOrders();
  startOrderPolling();
}

/* ============================================================
   SHOP OPEN/CLOSED STATUS (topbar)
   ============================================================ */
let businessHoursCache = [];

async function loadBusinessHoursStatus() {
  const { data, error } = await supabaseClient.from('business_hours').select('*').order('day_of_week');
  if (error || !data) return;
  businessHoursCache = data;
  updateShopStatusBadge();
}

function updateShopStatusBadge() {
  if (!businessHoursCache.length) return;
  const now = new Date();
  const today = businessHoursCache.find(h => h.day_of_week === now.getDay());
  let open = false;
  if (today && !today.is_closed && today.open_time && today.close_time) {
    const [oh, om] = today.open_time.split(':').map(Number);
    const [ch, cm] = today.close_time.split(':').map(Number);
    const openMin = oh * 60 + om, closeMin = ch * 60 + cm, nowMin = now.getHours() * 60 + now.getMinutes();
    open = closeMin <= openMin
      ? (nowMin >= openMin || nowMin < closeMin) // crosses midnight
      : (nowMin >= openMin && nowMin < closeMin);
  }
  const badge = document.getElementById('shopStatus');
  badge.className = 'shop-status ' + (open ? 'open' : 'closed');
  document.getElementById('shopStatusText').textContent = open ? 'Open' : 'Closed';
}

/* ============================================================
   ORDERS PAGE
   ============================================================ */
let allOrders = [];
let ordersFilter = 'active';
let bulkMode = false;
let selectedOrders = new Set();
let knownOrderIds = null;

async function loadOrders(silent) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*, order_items(*, order_item_addons(*))')
    .order('created_at', { ascending: false });

  if (error) {
    if (!silent) showToast('Could not load orders: ' + error.message, true);
    return;
  }

  allOrders = data || [];
  checkForNewOrders();
  computeOrderStats();
  renderOrders();
}

function checkForNewOrders() {
  const currentIds = new Set(allOrders.map(o => o.id));
  if (knownOrderIds === null) { knownOrderIds = currentIds; return; }
  const newOnes = allOrders.filter(o => !knownOrderIds.has(o.id));
  knownOrderIds = currentIds;
  if (newOnes.length && document.getElementById('page-orders').classList.contains('active') === false) {
    const badge = document.getElementById('newOrdersBadge');
    badge.textContent = String(Number(badge.textContent || '0') + newOnes.length);
    badge.classList.add('show');
  }
  if (newOnes.length) {
    showToast(`${newOnes.length} new order${newOnes.length > 1 ? 's' : ''} received!`);
    if ('Notification' in window && Notification.permission === 'granted') {
      newOnes.forEach(o => new Notification('Brew Beans — New Order', { body: `${o.order_number} — ${o.customer_name}` }));
    }
  }
}

function startOrderPolling() {
  setInterval(() => loadOrders(true), 20000);
}

function computeOrderStats() {
  const active = allOrders.filter(o => ['placed', 'preparing', 'out_for_delivery'].includes(o.status)).length;
  const deliveredToday = allOrders.filter(o => o.status === 'delivered' && isToday(o.created_at)).length;
  const revenueToday = allOrders.filter(o => isToday(o.created_at) && o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  document.getElementById('statActive').textContent = active;
  document.getElementById('statDelivered').textContent = deliveredToday;
  document.getElementById('statRevenue').textContent = money(revenueToday);
  document.getElementById('statTotal').textContent = allOrders.length;
}

function getFilteredOrders() {
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;
  const payMethod = document.getElementById('filterPayMethod').value;
  const payStatus = document.getElementById('filterPayStatus').value;

  return allOrders.filter(o => {
    if (ordersFilter === 'active' && !['placed', 'preparing', 'out_for_delivery'].includes(o.status)) return false;
    if (ordersFilter === 'delivered' && o.status !== 'delivered') return false;
    if (ordersFilter === 'cancelled' && o.status !== 'cancelled') return false;
    if (search) {
      const hay = `${o.order_number} ${o.customer_name} ${o.phone}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom + 'T00:00:00')) return false;
    if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    if (payMethod && o.payment_method !== payMethod) return false;
    if (payStatus && o.payment_status !== payStatus) return false;
    return true;
  });
}

function orderCardHtml(o) {
  const itemsSummary = (o.order_items || []).map(i => `${i.quantity}x ${escapeHtml(i.menu_item_name)}`).join(', ') || 'No items';
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
  const canAdvance = o.status !== 'cancelled' && o.status !== 'delivered' && nextStatus;
  const canCancel = o.status !== 'cancelled' && o.status !== 'delivered';
  return `
    <div class="order-card${bulkMode ? ' selectable' : ''}${selectedOrders.has(o.id) ? ' selected-order' : ''}" data-id="${o.id}">
      <div class="order-select-cb"><input type="checkbox" ${selectedOrders.has(o.id) ? 'checked' : ''} data-select="${o.id}"></div>
      <div class="order-top">
        <span class="order-number">${escapeHtml(o.order_number)}</span>
        <span class="status-badge status-${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
        <span class="order-time">${fmtDateTime(o.created_at)}</span>
      </div>
      <div class="order-customer">
        <div class="customer-field"><i class="bi bi-person"></i>${escapeHtml(o.customer_name)}</div>
        <div class="customer-field"><i class="bi bi-telephone"></i>${escapeHtml(o.phone)}</div>
        <div class="customer-field"><i class="bi bi-geo-alt"></i>${escapeHtml(o.address || '—')}</div>
      </div>
      <div class="order-items-list">${itemsSummary}</div>
      <div class="order-footer">
        <span class="order-total">${money(o.total)}</span>
        <div class="order-actions">
          ${canAdvance ? `<button class="btn-action next" data-advance="${o.id}" data-next="${nextStatus}">Mark ${STATUS_LABELS[nextStatus]}</button>` : ''}
          ${canCancel ? `<button class="btn-action cancel" data-cancel="${o.id}">Cancel</button>` : ''}
        </div>
      </div>
    </div>`;
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const filtered = getFilteredOrders();
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><p>No orders match this view.</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(orderCardHtml).join('');

  list.querySelectorAll('[data-select]').forEach(cb => {
    cb.addEventListener('change', e => {
      e.stopPropagation();
      const id = cb.dataset.select;
      if (cb.checked) selectedOrders.add(id); else selectedOrders.delete(id);
      updateBulkBar();
      cb.closest('.order-card').classList.toggle('selected-order', cb.checked);
    });
  });
  list.querySelectorAll('[data-advance]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); advanceOrder(btn.dataset.advance, btn.dataset.next); });
  });
  list.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); cancelOrder(btn.dataset.cancel); });
  });
  list.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', () => {
      if (bulkMode) return;
      const order = allOrders.find(o => o.id === card.dataset.id);
      if (order) openOrderModal(order);
    });
  });
}

async function updateOrderStatus(id, status) {
  const { error } = await supabaseClient.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { showToast('Update failed: ' + error.message, true); return false; }
  const local = allOrders.find(o => o.id === id);
  if (local) local.status = status;
  computeOrderStats();
  renderOrders();
  return true;
}

async function advanceOrder(id, nextStatus) {
  if (await updateOrderStatus(id, nextStatus)) showToast(`Order marked ${STATUS_LABELS[nextStatus]}`);
}

async function cancelOrder(id) {
  const order = allOrders.find(o => o.id === id);
  const ok = await showConfirm(`Cancel order ${order ? order.order_number : ''}? This can't be undone.`);
  if (!ok) return;
  if (await updateOrderStatus(id, 'cancelled')) showToast('Order cancelled');
}

function openOrderModal(o) {
  document.getElementById('modalTitle').textContent = `Order ${o.order_number}`;
  const itemsRows = (o.order_items || []).map(i => {
    const addons = (i.order_item_addons || []).map(a => a.addon_name).join(', ');
    return `<tr><td>${i.quantity}x ${escapeHtml(i.menu_item_name)}${addons ? `<br><small style="color:var(--text-light)">${escapeHtml(addons)}</small>` : ''}</td><td>${money(i.total_price)}</td></tr>`;
  }).join('');
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Customer</div>
      <div class="modal-grid">
        <div class="modal-field"><label>Name</label><span>${escapeHtml(o.customer_name)}</span></div>
        <div class="modal-field"><label>Phone</label><span>${escapeHtml(o.phone)}</span></div>
        <div class="modal-field full"><label>Address</label><span>${escapeHtml(o.address || '—')}</span></div>
        ${o.notes ? `<div class="modal-field full"><label>Notes</label><span>${escapeHtml(o.notes)}</span></div>` : ''}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Items</div>
      <table class="modal-items-table"><tbody>${itemsRows}</tbody></table>
    </div>
    <div class="modal-section">
      <div class="modal-total-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      <div class="modal-total-row"><span>Delivery</span><span>${o.delivery_charge === 0 ? 'FREE' : money(o.delivery_charge)}</span></div>
      <div class="modal-total-row grand"><span>Total</span><span>${money(o.total)}</span></div>
      <div class="modal-total-row"><span>Payment</span><span class="payment-badge payment-${o.payment_status === 'paid' ? 'paid' : (o.payment_status === 'failed' ? 'failed' : 'pending')}">${o.payment_method.toUpperCase()} — ${o.payment_status}</span></div>
    </div>`;

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
  const actions = [];
  if (o.status !== 'cancelled' && o.status !== 'delivered' && nextStatus) {
    actions.push(`<button class="btn-modal next" id="modalAdvanceBtn">Mark ${STATUS_LABELS[nextStatus]}</button>`);
  }
  if (o.status !== 'cancelled' && o.status !== 'delivered') {
    actions.push(`<button class="btn-modal cancel" id="modalCancelBtn">Cancel Order</button>`);
  }
  actions.push(`<button class="btn-modal close">Close</button>`);
  document.getElementById('modalActions').innerHTML = actions.join('');

  const overlay = document.getElementById('orderModal');
  const advanceBtn = document.getElementById('modalAdvanceBtn');
  if (advanceBtn) advanceBtn.addEventListener('click', async () => { await advanceOrder(o.id, nextStatus); closeModal(overlay); });
  const cancelBtn = document.getElementById('modalCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', async () => { await cancelOrder(o.id); closeModal(overlay); });
  overlay.querySelectorAll('.modal-close, .btn-modal.close').forEach(btn => btn.addEventListener('click', () => closeModal(overlay)));
  openModal(overlay);
}

document.querySelectorAll('#page-orders .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#page-orders .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ordersFilter = btn.dataset.filter;
    renderOrders();
  });
});
document.getElementById('searchInput').addEventListener('input', debounce(renderOrders, 200));
['filterDateFrom', 'filterDateTo', 'filterPayMethod', 'filterPayStatus'].forEach(id => {
  document.getElementById(id).addEventListener('change', renderOrders);
});
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterPayMethod').value = '';
  document.getElementById('filterPayStatus').value = '';
  renderOrders();
});

document.getElementById('bulkSelectBtn').addEventListener('click', () => {
  bulkMode = !bulkMode;
  selectedOrders.clear();
  document.getElementById('bulkSelectBtn').classList.toggle('active', bulkMode);
  updateBulkBar();
  renderOrders();
});

function updateBulkBar() {
  const bar = document.getElementById('bulkActionBar');
  bar.classList.toggle('visible', bulkMode && selectedOrders.size > 0);
  document.getElementById('bulkCount').textContent = `${selectedOrders.size} order${selectedOrders.size === 1 ? '' : 's'} selected`;
}

async function bulkUpdateStatus(status) {
  const ids = [...selectedOrders];
  if (!ids.length) return;
  const { error } = await supabaseClient.from('orders').update({ status, updated_at: new Date().toISOString() }).in('id', ids);
  if (error) { showToast('Bulk update failed: ' + error.message, true); return; }
  ids.forEach(id => { const o = allOrders.find(x => x.id === id); if (o) o.status = status; });
  selectedOrders.clear();
  updateBulkBar();
  computeOrderStats();
  renderOrders();
  showToast(`${ids.length} order(s) updated`);
}
document.getElementById('bulkMarkPreparing').addEventListener('click', () => bulkUpdateStatus('preparing'));
document.getElementById('bulkMarkDelivered').addEventListener('click', () => bulkUpdateStatus('delivered'));
document.getElementById('bulkMarkCancelled').addEventListener('click', async () => {
  if (await showConfirm(`Cancel ${selectedOrders.size} selected order(s)?`)) bulkUpdateStatus('cancelled');
});

/* ============================================================
   MENU PAGE
   ============================================================ */
let allMenuItems = [];
let editingMenuItemId = null;
let assigningMenuItemId = null;

async function loadMenu() {
  const { data, error } = await supabaseClient.from('menu_items').select('*').order('id');
  if (error) { showToast('Could not load menu: ' + error.message, true); return; }
  allMenuItems = data || [];
  renderMenu();
}

function menuItemCardHtml(item) {
  const img = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="menu-item-img" onerror="this.outerHTML='<div class=\\'menu-item-img-placeholder\\'><i class=\\'bi bi-cup-hot\\'></i></div>'">`
    : `<div class="menu-item-img-placeholder"><i class="bi bi-cup-hot"></i></div>`;
  return `
    <div class="menu-item-card">
      ${img}
      <div class="menu-item-body">
        <div class="menu-item-top">
          <span class="menu-item-name">${escapeHtml(item.name)}</span>
          <span class="category-badge">${escapeHtml(item.category.replace(/-/g, ' '))}</span>
        </div>
        <p class="menu-item-desc">${escapeHtml(item.description || '')}</p>
        <div class="menu-item-footer">
          <span class="menu-item-price">${money(item.price)}</span>
          <div class="menu-item-actions">
            <label class="toggle" title="Available">
              <input type="checkbox" ${item.is_available ? 'checked' : ''} data-toggle-available="${item.id}">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-icon${item.is_popular ? ' popular-active' : ''}" title="Toggle popular" data-toggle-popular="${item.id}"><i class="bi bi-star-fill"></i></button>
            <button class="btn-icon" title="Assign add-ons" data-assign="${item.id}"><i class="bi bi-tags"></i></button>
            <button class="btn-icon" title="Edit" data-edit="${item.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon danger" title="Delete" data-delete="${item.id}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const q = document.getElementById('menuSearchInput').value.trim().toLowerCase();
  const filtered = q ? allMenuItems.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)) : allMenuItems;
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><i class="bi bi-cup"></i><p>No menu items found.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(menuItemCardHtml).join('');

  grid.querySelectorAll('[data-toggle-available]').forEach(cb => cb.addEventListener('change', () => toggleMenuField(cb.dataset.toggleAvailable, 'is_available', cb.checked)));
  grid.querySelectorAll('[data-toggle-popular]').forEach(btn => {
    const item = allMenuItems.find(i => i.id === Number(btn.dataset.togglePopular));
    btn.addEventListener('click', () => toggleMenuField(btn.dataset.togglePopular, 'is_popular', !(item && item.is_popular)));
  });
  grid.querySelectorAll('[data-assign]').forEach(btn => btn.addEventListener('click', () => openAssignModal(Number(btn.dataset.assign))));
  grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openMenuModal(Number(btn.dataset.edit))));
  grid.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteMenuItem(Number(btn.dataset.delete))));
}

async function toggleMenuField(id, field, value) {
  const { error } = await supabaseClient.from('menu_items').update({ [field]: value }).eq('id', id);
  if (error) { showToast('Update failed: ' + error.message, true); renderMenu(); return; }
  const item = allMenuItems.find(i => i.id === Number(id));
  if (item) item[field] = value;
  renderMenu();
}

async function deleteMenuItem(id) {
  const item = allMenuItems.find(i => i.id === id);
  const ok = await showConfirm(`Delete "${item ? item.name : 'this item'}"? This can't be undone.`);
  if (!ok) return;
  const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
  if (error) { showToast('Delete failed: ' + error.message, true); return; }
  allMenuItems = allMenuItems.filter(i => i.id !== id);
  renderMenu();
  showToast('Menu item deleted');
}

function openMenuModal(id) {
  editingMenuItemId = id || null;
  const item = id ? allMenuItems.find(i => i.id === id) : null;
  document.getElementById('menuModalTitle').textContent = item ? 'Edit Menu Item' : 'Add Menu Item';
  document.getElementById('menuName').value = item ? item.name : '';
  document.getElementById('menuCategory').value = item ? item.category : '';
  document.getElementById('menuDesc').value = item ? (item.description || '') : '';
  document.getElementById('menuPrice').value = item ? item.price : '';
  document.getElementById('menuAvailable').value = item ? String(item.is_available) : 'true';
  document.getElementById('menuImage').value = item ? (item.image || '') : '';
  document.getElementById('menuFormError').style.display = 'none';
  openModal(document.getElementById('menuModal'));
}
document.querySelector('#page-menu .btn-primary').addEventListener('click', () => openMenuModal(null));

document.getElementById('menuSaveBtn').addEventListener('click', async () => {
  const name = document.getElementById('menuName').value.trim();
  const category = document.getElementById('menuCategory').value;
  const price = Number(document.getElementById('menuPrice').value);
  const errorEl = document.getElementById('menuFormError');
  if (!name || !category || !(price >= 0)) {
    errorEl.textContent = 'Name, category and a valid price are required.';
    errorEl.style.display = 'block';
    return;
  }
  const payload = {
    name, category, price,
    description: document.getElementById('menuDesc').value.trim() || null,
    is_available: document.getElementById('menuAvailable').value === 'true',
    image: document.getElementById('menuImage').value.trim() || null,
  };
  let error;
  if (editingMenuItemId) {
    ({ error } = await supabaseClient.from('menu_items').update(payload).eq('id', editingMenuItemId));
  } else {
    ({ error } = await supabaseClient.from('menu_items').insert(payload));
  }
  if (error) { errorEl.textContent = error.message; errorEl.style.display = 'block'; return; }
  closeModal(document.getElementById('menuModal'));
  showToast(editingMenuItemId ? 'Menu item updated' : 'Menu item added');
  loadMenu();
});

document.getElementById('menuSearchInput').addEventListener('input', debounce(renderMenu, 200));

/* Assign add-on groups to a menu item */
async function openAssignModal(menuItemId) {
  assigningMenuItemId = menuItemId;
  const item = allMenuItems.find(i => i.id === menuItemId);
  document.getElementById('assignModalTitle').textContent = `Assign Add-ons — ${item ? item.name : ''}`;
  const [{ data: groups }, { data: links }] = await Promise.all([
    supabaseClient.from('addon_groups').select('*').order('name'),
    supabaseClient.from('menu_item_addon_groups').select('addon_group_id').eq('menu_item_id', menuItemId),
  ]);
  const linkedIds = new Set((links || []).map(l => l.addon_group_id));
  document.getElementById('assignGroupsList').innerHTML = (groups || []).map(g => `
    <div class="assign-group-row">
      <label class="toggle"><input type="checkbox" value="${g.id}" ${linkedIds.has(g.id) ? 'checked' : ''}><span class="toggle-slider"></span></label>
      <label>${escapeHtml(g.name)}</label>
    </div>`).join('') || '<p style="color:var(--text-light);font-size:0.85rem">No add-on groups yet — create one on the Add-ons page first.</p>';
  openModal(document.getElementById('assignModal'));
}

document.querySelector('#assignModal .btn-modal.next').addEventListener('click', async () => {
  const checked = [...document.querySelectorAll('#assignGroupsList input[type="checkbox"]:checked')].map(cb => cb.value);
  await supabaseClient.from('menu_item_addon_groups').delete().eq('menu_item_id', assigningMenuItemId);
  if (checked.length) {
    await supabaseClient.from('menu_item_addon_groups').insert(checked.map(gid => ({ menu_item_id: assigningMenuItemId, addon_group_id: gid })));
  }
  closeModal(document.getElementById('assignModal'));
  showToast('Add-ons assigned');
});

/* ============================================================
   BUSINESS HOURS PAGE
   ============================================================ */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function loadHours() {
  if (!businessHoursCache.length) {
    const { data, error } = await supabaseClient.from('business_hours').select('*').order('day_of_week');
    if (error) { showToast('Could not load hours: ' + error.message, true); return; }
    businessHoursCache = data || [];
  }
  renderHours();
}

function renderHours() {
  const container = document.getElementById('hoursContainer');
  container.innerHTML = businessHoursCache.map(h => `
    <div class="hours-row${h.is_closed ? ' is-closed' : ''}" data-dow="${h.day_of_week}">
      <div class="hours-day">${DAY_NAMES[h.day_of_week]}</div>
      <div class="hours-time"><input type="time" class="time-input" data-open value="${(h.open_time || '09:00:00').slice(0, 5)}"></div>
      <div class="hours-time"><input type="time" class="time-input" data-close value="${(h.close_time || '22:00:00').slice(0, 5)}"></div>
      <div class="hours-closed-wrap">
        <label class="toggle"><input type="checkbox" data-closed ${h.is_closed ? 'checked' : ''}><span class="toggle-slider"></span></label>
        <span class="hours-closed-label">Closed</span>
      </div>
    </div>`).join('');

  container.querySelectorAll('.hours-row').forEach(row => {
    row.querySelector('[data-closed]').addEventListener('change', e => row.classList.toggle('is-closed', e.target.checked));
  });
}

document.getElementById('saveHoursBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveHoursBtn');
  btn.disabled = true;
  const rows = [...document.querySelectorAll('#hoursContainer .hours-row')].map(row => ({
    day_of_week: Number(row.dataset.dow),
    open_time: row.querySelector('[data-open]').value + ':00',
    close_time: row.querySelector('[data-close]').value + ':00',
    is_closed: row.querySelector('[data-closed]').checked,
  }));
  try {
    const results = await Promise.all(rows.map(r => supabaseClient.from('business_hours').update({
      open_time: r.open_time, close_time: r.close_time, is_closed: r.is_closed,
    }).eq('day_of_week', r.day_of_week)));
    const failed = results.find(r => r.error);
    if (failed) throw failed.error;
    businessHoursCache = businessHoursCache.map(h => ({ ...h, ...rows.find(r => r.day_of_week === h.day_of_week) }));
    updateShopStatusBadge();
    showToast('Business hours saved');
  } catch (err) {
    showToast('Save failed: ' + err.message, true);
  }
  btn.disabled = false;
});

document.getElementById('closeTodayBtn').addEventListener('click', async () => {
  const dow = new Date().getDay();
  const { error } = await supabaseClient.from('business_hours').update({ is_closed: true }).eq('day_of_week', dow);
  if (error) { showToast('Failed: ' + error.message, true); return; }
  const row = businessHoursCache.find(h => h.day_of_week === dow);
  if (row) row.is_closed = true;
  renderHours();
  updateShopStatusBadge();
  showToast('Closed for today');
});

document.getElementById('openAllWeekBtn').addEventListener('click', async () => {
  const { error } = await supabaseClient.from('business_hours').update({ is_closed: false }).gte('day_of_week', 0);
  if (error) { showToast('Failed: ' + error.message, true); return; }
  businessHoursCache.forEach(h => h.is_closed = false);
  renderHours();
  updateShopStatusBadge();
  showToast('Open all week');
});

/* ============================================================
   ADD-ONS PAGE
   ============================================================ */
let allAddonGroups = [];
let editingGroupId = null;
let activeAddonGroupId = null; // which group is "Add Option" targeting
let editingAddonId = null;

async function loadAddonGroups() {
  const { data, error } = await supabaseClient.from('addon_groups').select('*, addons(*)').order('name');
  if (error) { showToast('Could not load add-ons: ' + error.message, true); return; }
  allAddonGroups = data || [];
  renderAddonGroups();
}

function renderAddonGroups() {
  const list = document.getElementById('addonGroupsList');
  if (!allAddonGroups.length) {
    list.innerHTML = `<div class="empty-state"><i class="bi bi-tags"></i><p>No add-on groups yet.</p></div>`;
    return;
  }
  list.innerHTML = allAddonGroups.map(g => `
    <div class="addon-group-card" data-group="${g.id}">
      <div class="addon-group-header" data-expand="${g.id}">
        <span class="addon-group-name">${escapeHtml(g.name)}</span>
        <span class="req-badge ${g.is_required ? 'required' : 'optional'}">${g.is_required ? 'Required' : 'Optional'}</span>
        <button class="btn-icon" title="Edit group" data-edit-group="${g.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn-icon danger" title="Delete group" data-delete-group="${g.id}"><i class="bi bi-trash"></i></button>
        <i class="bi bi-chevron-down group-chevron"></i>
      </div>
      <div class="addon-group-body">
        ${(g.addons || []).map(a => `
          <div class="addon-row">
            <span class="addon-row-name">${escapeHtml(a.name)}</span>
            <span class="addon-row-price">${a.price > 0 ? '+' + money(a.price) : 'Free'}</span>
            <button class="btn-icon" title="Edit" data-edit-addon="${a.id}" data-group-of="${g.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon danger" title="Delete" data-delete-addon="${a.id}" data-group-of="${g.id}"><i class="bi bi-trash"></i></button>
          </div>`).join('')}
        <button class="btn-add-addon" data-add-addon="${g.id}"><i class="bi bi-plus"></i> Add Option</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('[data-expand]').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('.btn-icon')) return;
      header.closest('.addon-group-card').classList.toggle('expanded');
    });
  });
  list.querySelectorAll('[data-edit-group]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openGroupModal(btn.dataset.editGroup); }));
  list.querySelectorAll('[data-delete-group]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteAddonGroup(btn.dataset.deleteGroup); }));
  list.querySelectorAll('[data-add-addon]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openAddonModal(null, btn.dataset.addAddon); }));
  list.querySelectorAll('[data-edit-addon]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openAddonModal(btn.dataset.editAddon, btn.dataset.groupOf); }));
  list.querySelectorAll('[data-delete-addon]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteAddon(btn.dataset.deleteAddon); }));
}

function openGroupModal(id) {
  editingGroupId = id || null;
  const group = id ? allAddonGroups.find(g => g.id === id) : null;
  document.getElementById('groupModalTitle').textContent = group ? 'Edit Addon Group' : 'Add Addon Group';
  document.getElementById('groupName').value = group ? group.name : '';
  document.getElementById('groupRequired').checked = !!(group && group.is_required);
  document.getElementById('groupFormError').style.display = 'none';
  openModal(document.getElementById('groupModal'));
}
document.querySelector('#page-addons .btn-primary').addEventListener('click', () => openGroupModal(null));

document.querySelector('#groupModal .btn-modal.next').addEventListener('click', async () => {
  const name = document.getElementById('groupName').value.trim();
  const errorEl = document.getElementById('groupFormError');
  if (!name) { errorEl.textContent = 'Group name is required.'; errorEl.style.display = 'block'; return; }
  const payload = { name, is_required: document.getElementById('groupRequired').checked };
  const { error } = editingGroupId
    ? await supabaseClient.from('addon_groups').update(payload).eq('id', editingGroupId)
    : await supabaseClient.from('addon_groups').insert(payload);
  if (error) { errorEl.textContent = error.message; errorEl.style.display = 'block'; return; }
  closeModal(document.getElementById('groupModal'));
  showToast('Add-on group saved');
  loadAddonGroups();
});

async function deleteAddonGroup(id) {
  const group = allAddonGroups.find(g => g.id === id);
  if (!(await showConfirm(`Delete "${group ? group.name : 'this group'}" and all its options?`))) return;
  const { error } = await supabaseClient.from('addon_groups').delete().eq('id', id);
  if (error) { showToast('Delete failed: ' + error.message, true); return; }
  loadAddonGroups();
  showToast('Add-on group deleted');
}

function openAddonModal(addonId, groupId) {
  editingAddonId = addonId || null;
  activeAddonGroupId = groupId;
  const group = allAddonGroups.find(g => g.id === groupId);
  const addon = addonId && group ? (group.addons || []).find(a => a.id === addonId) : null;
  document.getElementById('addonModalTitle').textContent = addon ? 'Edit Addon' : 'Add Addon';
  document.getElementById('addonName').value = addon ? addon.name : '';
  document.getElementById('addonPrice').value = addon ? addon.price : 0;
  document.getElementById('addonFormError').style.display = 'none';
  openModal(document.getElementById('addonModal'));
}

document.querySelector('#addonModal .btn-modal.next').addEventListener('click', async () => {
  const name = document.getElementById('addonName').value.trim();
  const price = Number(document.getElementById('addonPrice').value) || 0;
  const errorEl = document.getElementById('addonFormError');
  if (!name) { errorEl.textContent = 'Option name is required.'; errorEl.style.display = 'block'; return; }
  const { error } = editingAddonId
    ? await supabaseClient.from('addons').update({ name, price }).eq('id', editingAddonId)
    : await supabaseClient.from('addons').insert({ name, price, group_id: activeAddonGroupId });
  if (error) { errorEl.textContent = error.message; errorEl.style.display = 'block'; return; }
  closeModal(document.getElementById('addonModal'));
  showToast('Option saved');
  loadAddonGroups();
});

async function deleteAddon(id) {
  if (!(await showConfirm('Delete this option?'))) return;
  const { error } = await supabaseClient.from('addons').delete().eq('id', id);
  if (error) { showToast('Delete failed: ' + error.message, true); return; }
  loadAddonGroups();
  showToast('Option deleted');
}

/* ============================================================
   STAFF PINS PAGE
   ============================================================ */
let allStaff = [];
let editingStaffId = null;

async function loadStaff() {
  const { data, error } = await supabaseClient.from('staff_pins').select('*').order('created_at');
  if (error) { showToast('Could not load staff: ' + error.message, true); return; }
  allStaff = data || [];
  renderStaff();
}

function renderStaff() {
  const list = document.getElementById('staffList');
  if (!allStaff.length) {
    list.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>No staff PINs yet.</p></div>`;
    return;
  }
  list.innerHTML = allStaff.map(s => `
    <div class="staff-row" data-id="${s.id}">
      <div class="staff-row-info">
        <div class="staff-row-name">${escapeHtml(s.name)}</div>
        <div class="staff-row-pin">PIN: ${escapeHtml(s.pin)}</div>
      </div>
      <label class="toggle" title="Active"><input type="checkbox" ${s.is_active ? 'checked' : ''} data-toggle-active="${s.id}"><span class="toggle-slider"></span></label>
      <button class="btn-icon" title="Edit" data-edit-staff="${s.id}"><i class="bi bi-pencil"></i></button>
      <button class="btn-icon danger" title="Delete" data-delete-staff="${s.id}"><i class="bi bi-trash"></i></button>
    </div>`).join('');

  list.querySelectorAll('[data-toggle-active]').forEach(cb => cb.addEventListener('change', () => toggleStaffActive(cb.dataset.toggleActive, cb.checked)));
  list.querySelectorAll('[data-edit-staff]').forEach(btn => btn.addEventListener('click', () => openStaffModal(btn.dataset.editStaff)));
  list.querySelectorAll('[data-delete-staff]').forEach(btn => btn.addEventListener('click', () => deleteStaff(btn.dataset.deleteStaff)));
}

async function toggleStaffActive(id, isActive) {
  const { error } = await supabaseClient.from('staff_pins').update({ is_active: isActive }).eq('id', id);
  if (error) { showToast('Update failed: ' + error.message, true); renderStaff(); return; }
  const s = allStaff.find(x => x.id === id);
  if (s) s.is_active = isActive;
}

function openStaffModal(id) {
  editingStaffId = id || null;
  const staff = id ? allStaff.find(s => s.id === id) : null;
  document.getElementById('staffModalTitle').textContent = staff ? 'Edit Staff' : 'Add Staff';
  document.getElementById('staffName').value = staff ? staff.name : '';
  document.getElementById('staffPin').value = staff ? staff.pin : '';
  openModal(document.getElementById('staffModal'));
}
document.querySelector('#page-staff .btn-add').addEventListener('click', () => openStaffModal(null));

document.getElementById('staffSaveBtn').addEventListener('click', async () => {
  const name = document.getElementById('staffName').value.trim();
  const pin = document.getElementById('staffPin').value.trim();
  if (!name || !/^\d{4,6}$/.test(pin)) { showToast('Name and a 4–6 digit PIN are required.', true); return; }
  const { error } = editingStaffId
    ? await supabaseClient.from('staff_pins').update({ name, pin }).eq('id', editingStaffId)
    : await supabaseClient.from('staff_pins').insert({ name, pin });
  if (error) { showToast('Save failed: ' + error.message, true); return; }
  closeModal(document.getElementById('staffModal'));
  showToast('Staff saved');
  loadStaff();
});

async function deleteStaff(id) {
  const staff = allStaff.find(s => s.id === id);
  if (!(await showConfirm(`Remove staff member "${staff ? staff.name : ''}"?`))) return;
  const { error } = await supabaseClient.from('staff_pins').delete().eq('id', id);
  if (error) { showToast('Delete failed: ' + error.message, true); return; }
  loadStaff();
  showToast('Staff removed');
}

/* ============================================================
   ANALYTICS PAGE
   ============================================================ */
let revenueChartInstance = null;

async function loadAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);
  const rangeStart = startOfMonth < sevenDaysAgo ? startOfMonth : sevenDaysAgo;

  const { data, error } = await supabaseClient
    .from('orders')
    .select('id, status, total, created_at, order_items(menu_item_name, quantity)')
    .gte('created_at', rangeStart.toISOString())
    .order('created_at');

  if (error) { showToast('Could not load analytics: ' + error.message, true); return; }

  const orders = data || [];
  const monthOrders = orders.filter(o => isSameMonth(o.created_at));
  const todayOrders = orders.filter(o => isToday(o.created_at));
  const monthNonCancelled = monthOrders.filter(o => o.status !== 'cancelled');
  const todayNonCancelled = todayOrders.filter(o => o.status !== 'cancelled');

  const monthRevenue = monthNonCancelled.reduce((s, o) => s + Number(o.total), 0);
  const todayRevenue = todayNonCancelled.reduce((s, o) => s + Number(o.total), 0);
  const deliveredThisMonth = monthOrders.filter(o => o.status === 'delivered').length;

  document.getElementById('statTodayOrders').textContent = todayOrders.length;
  document.getElementById('statTodayRevenue').textContent = money(todayRevenue);
  document.getElementById('statMonthOrders').textContent = monthOrders.length;
  document.getElementById('statMonthRevenue').textContent = money(monthRevenue);
  document.getElementById('statAvgOrder').textContent = monthNonCancelled.length ? money(monthRevenue / monthNonCancelled.length) : 'Rs. 0';
  document.getElementById('statCompletionRate').textContent = monthNonCancelled.length ? Math.round((deliveredThisMonth / monthNonCancelled.length) * 100) + '%' : '—';

  renderStatusBreakdown(monthOrders);
  renderTopItems(monthOrders);
  renderRevenueChart(orders, sevenDaysAgo);
  renderPeakHours(monthOrders);
}

function renderStatusBreakdown(monthOrders) {
  const counts = { placed: 0, preparing: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 };
  monthOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
  const max = Math.max(1, ...Object.values(counts));
  const colors = { placed: '#D97706', preparing: '#1D4ED8', out_for_delivery: '#7C3AED', delivered: '#15803D', cancelled: '#DC2626' };
  document.getElementById('statusBreakdown').innerHTML = Object.keys(counts).map(k => `
    <div class="status-breakdown-row">
      <span class="status-breakdown-label">${STATUS_LABELS[k]}</span>
      <div class="status-breakdown-track"><div class="status-breakdown-fill" style="width:${(counts[k] / max) * 100}%;background:${colors[k]}"></div></div>
      <span class="status-breakdown-count">${counts[k]}</span>
    </div>`).join('');
}

function renderTopItems(monthOrders) {
  const totals = {};
  monthOrders.forEach(o => {
    if (o.status === 'cancelled') return;
    (o.order_items || []).forEach(i => { totals[i.menu_item_name] = (totals[i.menu_item_name] || 0) + i.quantity; });
  });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const container = document.getElementById('topItems');
  if (!top.length) { container.innerHTML = `<p style="color:var(--text-light);font-size:0.85rem">No orders yet this month.</p>`; return; }
  container.innerHTML = top.map(([name, qty], i) => `
    <div class="top-item-row">
      <span class="top-item-rank">#${i + 1}</span>
      <span class="top-item-name">${escapeHtml(name)}</span>
      <span class="top-item-qty">${qty} sold</span>
    </div>`).join('');
}

function renderRevenueChart(orders, sevenDaysAgo) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo); d.setDate(sevenDaysAgo.getDate() + i);
    days.push(d);
  }
  const labels = days.map(d => d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }));
  const totals = days.map(d => orders
    .filter(o => o.status !== 'cancelled' && new Date(o.created_at).toDateString() === d.toDateString())
    .reduce((s, o) => s + Number(o.total), 0));

  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChartInstance) revenueChartInstance.destroy();
  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Revenue (Rs.)', data: totals, borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.12)', fill: true, tension: 0.3 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function renderPeakHours(monthOrders) {
  const buckets = new Array(24).fill(0);
  monthOrders.forEach(o => { if (o.status !== 'cancelled') buckets[new Date(o.created_at).getHours()]++; });
  const max = Math.max(1, ...buckets);
  const grid = document.getElementById('peakHoursGrid');
  const cellsHtml = buckets.map((count, hour) => {
    const intensity = count / max;
    const bg = count === 0 ? 'var(--bg)' : `rgba(46,139,87,${0.15 + intensity * 0.75})`;
    return `<div class="heat-cell${count > 0 ? ' has-orders' : ''}" style="background:${bg}" title="${count} order${count === 1 ? '' : 's'} at ${hour}:00"><span class="heat-count">${count || ''}</span></div>`;
  }).join('');
  const labelsHtml = buckets.map((_, hour) => `<div class="heat-label">${hour}</div>`).join('');
  grid.innerHTML = `<div class="heat-grid">${cellsHtml}</div><div class="heat-labels">${labelsHtml}</div>`;
}
