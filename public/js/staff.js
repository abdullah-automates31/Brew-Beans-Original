'use strict';

const STATUS_FLOW = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = { placed: 'Placed', preparing: 'Preparing', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
const PIN_KEY = 'bb_staff_pin';

let currentPin = null;
let allOrders = [];
let statusFilter = 'active';
let pollTimer = null;
let notifyEnabled = false;
let knownOrderIds = null;

const loginView = document.getElementById('loginView');
const ordersView = document.getElementById('ordersView');
const pinForm = document.getElementById('pinForm');
const pinInput = document.getElementById('pinInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const ordersList = document.getElementById('ordersList');
const noOrders = document.getElementById('noOrders');

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function money(n) { return 'Rs. ' + Math.round(Number(n) || 0).toLocaleString(); }

function showToast(message, type) {
  const icons = { success: 'bi-check-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<i class="bi ${icons[type] || icons.success}"></i><span>${escapeHtml(message)}</span>`;
  const existingContainer = document.querySelector('.toast-container');
  if (existingContainer) existingContainer.remove();
  const container = document.createElement('div');
  container.className = 'toast-container';
  container.appendChild(toast);
  document.body.appendChild(container);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => container.remove(), 400); }, 3000);
}

function showLogin(message) {
  ordersView.style.display = 'none';
  loginView.style.display = 'block';
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (message) {
    document.getElementById('loginError').textContent = message;
    document.getElementById('loginError').style.display = 'block';
  }
}

function showOrders() {
  loginView.style.display = 'none';
  ordersView.style.display = 'block';
}

async function fetchOrders(pin, silent) {
  const { data, error } = await supabaseClient.rpc('staff_list_orders', { p_pin: pin });
  if (error) {
    if (!silent) showLoginErr(error.message);
    return null;
  }
  if (data && data.error) {
    if (!silent) showLoginErr(data.error);
    else { sessionStorage.removeItem(PIN_KEY); showLogin('Your session ended — please log in again.'); }
    return null;
  }
  return Array.isArray(data) ? data : [];
}

function showLoginErr(msg) {
  loginError.textContent = msg || 'Something went wrong.';
  loginError.style.display = 'block';
  loginBtn.disabled = false;
}

async function login(pin) {
  loginBtn.disabled = true;
  loginError.style.display = 'none';
  const orders = await fetchOrders(pin, false);
  loginBtn.disabled = false;
  if (orders === null) return;
  currentPin = pin;
  sessionStorage.setItem(PIN_KEY, pin);
  allOrders = orders;
  knownOrderIds = new Set(orders.map(o => o.id));
  showOrders();
  render();
  startPolling();
}

pinForm.addEventListener('submit', e => {
  e.preventDefault();
  const pin = pinInput.value.trim();
  if (pin) login(pin);
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(PIN_KEY);
  currentPin = null;
  pinInput.value = '';
  showLogin();
});

document.getElementById('refreshBtn').addEventListener('click', () => refresh(false));

async function refresh(silent) {
  if (!currentPin) return;
  const orders = await fetchOrders(currentPin, silent);
  if (orders === null) return;
  checkForNewOrders(orders);
  allOrders = orders;
  render();
}

function checkForNewOrders(freshOrders) {
  const freshIds = new Set(freshOrders.map(o => o.id));
  if (knownOrderIds) {
    const newOnes = freshOrders.filter(o => !knownOrderIds.has(o.id));
    if (newOnes.length) {
      showToast(`${newOnes.length} new order${newOnes.length > 1 ? 's' : ''}!`);
      if (notifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
        newOnes.forEach(o => new Notification('Brew Beans — New Order', { body: `${o.order_number} — ${o.customer_name}` }));
      }
    }
  }
  knownOrderIds = freshIds;
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => refresh(true), 15000);
}

document.getElementById('notifyBtn').addEventListener('click', async () => {
  if (!('Notification' in window)) { showToast('Notifications are not supported in this browser.', 'warning'); return; }
  const perm = await Notification.requestPermission();
  notifyEnabled = perm === 'granted';
  const btn = document.getElementById('notifyBtn');
  btn.innerHTML = `<i class="bi ${notifyEnabled ? 'bi-bell-fill' : 'bi-bell'} me-1"></i>Alerts: ${notifyEnabled ? 'On' : 'Off'}`;
});

document.querySelectorAll('#statusFilter [data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusFilter [data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statusFilter = btn.dataset.filter;
    render();
  });
});

document.getElementById('searchInput').addEventListener('input', render);

function getFiltered() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  return allOrders.filter(o => {
    if (statusFilter === 'active' && !['placed', 'preparing', 'out_for_delivery'].includes(o.status)) return false;
    if (statusFilter === 'completed' && o.status !== 'delivered') return false;
    if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;
    if (q) {
      const hay = `${o.order_number} ${o.customer_name} ${o.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function orderCardHtml(o) {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1];
  const canAdvance = o.status !== 'cancelled' && o.status !== 'delivered' && nextStatus;
  const canCancel = o.status !== 'cancelled' && o.status !== 'delivered';
  const itemsHtml = (o.items || []).map(i => {
    const addons = (i.addons || []).map(a => a.name).join(', ');
    return `<div>${i.quantity}x ${escapeHtml(i.name)}${addons ? ` <span class="text-muted small">(${escapeHtml(addons)})</span>` : ''}</div>`;
  }).join('');
  return `
    <div class="staff-order-card" data-id="${o.id}">
      <div class="staff-order-header">
        <strong>${escapeHtml(o.order_number)}</strong>
        <span class="staff-status-badge ${o.status}">${STATUS_LABELS[o.status] || o.status}</span>
      </div>
      <div class="mb-2">
        <div><i class="bi bi-person me-1"></i>${escapeHtml(o.customer_name)} &middot; <i class="bi bi-telephone me-1"></i>${escapeHtml(o.phone)}</div>
        <div class="text-muted small"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(o.address || '—')}</div>
        ${o.notes ? `<div class="text-muted small"><i class="bi bi-pencil-fill me-1"></i>${escapeHtml(o.notes)}</div>` : ''}
      </div>
      <div class="mb-2 small">${itemsHtml}</div>
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <span class="fw-bold">${money(o.total)}</span>
          <span class="text-muted small ms-2">${(o.payment_method || '').toUpperCase()} — ${o.payment_status}</span>
        </div>
        <div class="d-flex gap-2">
          ${canAdvance ? `<button class="btn btn-sm btn-primary" data-advance="${o.order_number}" data-next="${nextStatus}">Mark ${STATUS_LABELS[nextStatus]}</button>` : ''}
          ${canCancel ? `<button class="btn btn-sm btn-outline-danger" data-cancel="${o.order_number}">Cancel</button>` : ''}
        </div>
      </div>
    </div>`;
}

function render() {
  const filtered = getFiltered();
  if (!filtered.length) {
    ordersList.innerHTML = '';
    noOrders.style.display = 'block';
    return;
  }
  noOrders.style.display = 'none';
  ordersList.innerHTML = filtered.map(orderCardHtml).join('');

  ordersList.querySelectorAll('[data-advance]').forEach(btn => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.advance, btn.dataset.next));
  });
  ordersList.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(`Cancel order ${btn.dataset.cancel}?`)) updateStatus(btn.dataset.cancel, 'cancelled');
    });
  });
}

async function updateStatus(orderNumber, newStatus) {
  const { data, error } = await supabaseClient.rpc('staff_update_order_status', {
    p_pin: currentPin, p_order_number: orderNumber, p_new_status: newStatus,
  });
  if (error || (data && data.error)) {
    showToast((data && data.error) || (error && error.message) || 'Update failed', 'warning');
    return;
  }
  const order = allOrders.find(o => o.order_number === orderNumber);
  if (order) order.status = newStatus;
  render();
  showToast(`Order marked ${STATUS_LABELS[newStatus]}`);
}

// Resume an existing PIN session on reload.
(function init() {
  const savedPin = sessionStorage.getItem(PIN_KEY);
  if (savedPin) login(savedPin);
})();
