'use client';
import { useApp } from '@/context/AppContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, SUPABASE_URL_CONST } from '@/lib/supabase';

function safeReadLocalStorage(key) {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        localStorage.removeItem(key);
        return null;
    }
}

function safeWriteLocalStorage(key, value) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable */ }
}

function showToast(message, type = 'success') {
    const icons = { success: 'bi-check-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="bi ${icons[type] || icons.success}"></i><span>${message}</span>`;
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.appendChild(toast);
    document.body.appendChild(container);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => container.remove(), 400); }, 3000);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function rcDebounce(fn, ms) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}

export default function CheckoutModal() {
    const {
        checkoutOpen, setCheckoutOpen, cart, cartTotal, clearCart,
        setSuccessModalOpen, setLastOrder, userLocation, menuItems, escapeHtml,
        SHOP_LAT, SHOP_LNG, setCartOpen, setAddonModalOpen, setCurrentAddonItem
    } = useApp();

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        paymentMethod: 'cod'
    });
    const [deliveryEstimate, setDeliveryEstimate] = useState(null);
    const [isPlacing, setIsPlacing] = useState(false);
    const [returningCustomer, setReturningCustomer] = useState(null);
    const [checkoutLatLng, setCheckoutLatLng] = useState(null);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [successOrderDetails, setSuccessOrderDetails] = useState(null);

    const deliveryCharge = cartTotal > 1000 ? 0 : 100;
    const grandTotal = cartTotal + deliveryCharge;

    useEffect(() => {
        if (!checkoutOpen) return;
        const cached = safeReadLocalStorage('brewBeansLastCustomer');
        if (cached) {
            setReturningCustomer(cached);
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || cached.name || '',
                email: prev.email || cached.email || '',
                address: prev.address || cached.address || '',
                phone: prev.phone || cached.phone || '',
                paymentMethod: cached.lastPaymentMethod || prev.paymentMethod
            }));
        }
        if (userLocation) {
            setCheckoutLatLng({ lat: userLocation.lat, lng: userLocation.lng });
            calculateDeliveryEstimate(userLocation.lat, userLocation.lng);
        }
    }, [checkoutOpen]);

    const checkReturningCustomer = useCallback(async (phone) => {
        const normalized = phone.replace(/[\s\-()]/g, '');
        const cached = safeReadLocalStorage('brewBeansLastCustomer');
        if (cached && cached.phone.replace(/[\s\-()]/g, '') === normalized) return cached;

        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('id, customer_name, email, payment_method')
                .eq('phone', phone)
                .order('created_at', { ascending: false })
                .limit(5);
            if (!orders || !orders.length) return null;

            const orderIds = orders.map(o => o.id);
            const { data: items } = await supabase
                .from('order_items')
                .select('menu_item_id, menu_item_name, quantity')
                .in('order_id', orderIds);

            const freq = {};
            (items || []).forEach(i => {
                if (!freq[i.menu_item_id]) freq[i.menu_item_id] = { id: i.menu_item_id, name: i.menu_item_name, image: '', count: 0 };
                freq[i.menu_item_id].count += i.quantity;
            });
            Object.values(freq).forEach(fi => {
                const m = menuItems.find(x => x.id === fi.id);
                if (m) fi.image = m.image || '';
            });

            const last = orders[0];
            return {
                phone, name: last.customer_name, email: last.email || '',
                lastPaymentMethod: last.payment_method,
                lastItems: Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 6),
                savedAt: new Date().toISOString()
            };
        } catch (e) { return null; }
    }, [menuItems]);

    const debouncedPhoneLookup = useRef(null);
    useEffect(() => {
        debouncedPhoneLookup.current = rcDebounce(async (phone) => {
            if (phone.length >= 10) {
                const customer = await checkReturningCustomer(phone);
                if (customer) {
                    setReturningCustomer(customer);
                    setFormData(prev => ({
                        ...prev,
                        fullName: prev.fullName || customer.name || '',
                        email: prev.email || customer.email || '',
                        address: prev.address || customer.address || '',
                        paymentMethod: customer.lastPaymentMethod || prev.paymentMethod
                    }));
                } else {
                    setReturningCustomer(null);
                }
            }
        }, 700);
    }, [checkReturningCustomer]);

    function handlePhoneChange(value) {
        setFormData(prev => ({ ...prev, phone: value }));
        if (debouncedPhoneLookup.current) debouncedPhoneLookup.current(value);
    }

    function calculateDeliveryEstimate(lat, lng) {
        const distance = calculateDistance(SHOP_LAT, SHOP_LNG, lat, lng);
        const deliveryTime = Math.max(15, Math.round(distance * 3));
        const deliveryCost = distance > 5 ? Math.round(distance * 20) : (distance > 3 ? 100 : 0);
        const subtotal = cartTotal;
        const finalDelivery = subtotal > 1000 ? 0 : deliveryCost;

        setDeliveryEstimate({ distance: distance.toFixed(1), time: deliveryTime, cost: finalDelivery });
    }

    function handleDetectLocation() {
        if (!navigator.geolocation) return;
        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCheckoutLatLng({ lat, lng });
                calculateDeliveryEstimate(lat, lng);
                setDetectingLocation(false);
            },
            () => {
                showToast('Could not detect location', 'warning');
                setDetectingLocation(false);
            }
        );
    }

    function handleClose() {
        setCheckoutOpen(false);
        setFormData({ fullName: '', phone: '', email: '', address: '', notes: '', paymentMethod: 'cod' });
        setDeliveryEstimate(null);
        setReturningCustomer(null);
        setCheckoutLatLng(null);
        setIsPlacing(false);
    }

    useEffect(() => {
        if (!checkoutOpen) return;
        function handleKey(e) { if (e.key === 'Escape') handleClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [checkoutOpen]);

    function saveCustomerProfile(phone, name, email, address, paymentMethod, cartSnapshot) {
        const freq = {};
        cartSnapshot.forEach(item => {
            if (!freq[item.id]) freq[item.id] = { id: item.id, name: item.name, image: item.image || '', count: 0 };
            freq[item.id].count += item.quantity;
        });
        safeWriteLocalStorage('brewBeansLastCustomer', {
            phone, name, email: email || '', address: address || '',
            lastPaymentMethod: paymentMethod,
            lastItems: Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 6),
            savedAt: new Date().toISOString()
        });
    }

    function completeOrderSuccess(orderNumber, total, phone, delCharge) {
        const prepMin = 15;
        const legMin = delCharge > 0 ? 25 : 8;
        const eta = new Date(Date.now() + (prepMin + legMin) * 60000);
        const etaLabel = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        try { sessionStorage.setItem(`bb_phone_${orderNumber}`, phone); } catch (e) { /* ignore */ }

        setLastOrder({ orderNumber, phone });
        safeWriteLocalStorage('brewBeansLastOrder', { orderNumber, phone });
        setCheckoutOpen(false);
        clearCart();
        setSuccessOrderDetails({ orderNumber, total, etaLabel });
        setSuccessModalOpen(true);
    }

    async function handlePlaceOrder() {
        const { fullName, phone, email, address, notes, paymentMethod } = formData;

        if (!fullName.trim() || !phone.trim() || !address.trim()) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'warning');
            return;
        }

        setIsPlacing(true);

        try {
            const items = cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                addons: item.selectedAddons && item.selectedAddons.length
                    ? item.selectedAddons.map(a => ({ name: a.name, price: a.price }))
                    : []
            }));

            const addonSummary = cart
                .filter(ci => ci.selectedAddons && ci.selectedAddons.length > 0)
                .map(ci => `${ci.name}: ${ci.selectedAddons.map(a => a.name).join(', ')}`)
                .join(' | ');
            const instructionsSummary = cart
                .filter(ci => ci.specialInstructions)
                .map(ci => `${ci.name} note: ${ci.specialInstructions}`)
                .join(' | ');
            const fullNotes = [notes, addonSummary, instructionsSummary].filter(Boolean).join('\n');

            const finalDelivery = deliveryEstimate ? deliveryEstimate.cost : deliveryCharge;

            const { data: order, error } = await supabase.functions.invoke('submit-order', {
                body: {
                    p_customer_name: fullName.trim(),
                    p_phone: phone.trim(),
                    p_email: email.trim() || null,
                    p_address: address.trim(),
                    p_lat: checkoutLatLng ? checkoutLatLng.lat : null,
                    p_lng: checkoutLatLng ? checkoutLatLng.lng : null,
                    p_notes: fullNotes || null,
                    p_payment_method: paymentMethod,
                    p_items: items,
                    p_delivery_charge: finalDelivery
                }
            });

            if (error) throw error;

            const orderNumber = order.order_number;
            const total = order.total;

            saveCustomerProfile(phone.trim(), fullName.trim(), email.trim(), address.trim(), paymentMethod, [...cart]);
            safeWriteLocalStorage('brewBeansLastOrder', { orderNumber, phone: phone.trim() });

            if (paymentMethod === 'cod') {
                completeOrderSuccess(orderNumber, total, phone.trim(), order.delivery_charge);
                setIsPlacing(false);
                return;
            }

            const callbackUrl = `${SUPABASE_URL_CONST}/functions/v1/payment-callback?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone.trim())}`;
            const { data: payData, error: payError } = await supabase.functions.invoke('create-payment', {
                body: {
                    order_number: orderNumber,
                    payment_method: paymentMethod,
                    amount: total,
                    return_url: callbackUrl
                }
            });

            if (payError) throw payError;

            if (!payData.configured) {
                showToast(`${paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} isn't set up yet — your order was placed for cash on delivery instead.`, 'warning');
                completeOrderSuccess(orderNumber, total, phone.trim(), order.delivery_charge);
                setIsPlacing(false);
                return;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payData.gatewayUrl;
            Object.entries(payData.fields).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);

            clearCart();
            setCheckoutOpen(false);
            setIsPlacing(false);
            form.submit();
        } catch (err) {
            console.error('Order error:', err);
            showToast(err.message || 'Could not place order. Please try again.', 'warning');
            setIsPlacing(false);
        }
    }

    if (!checkoutOpen) return null;

    const customerSuggestions = returningCustomer && returningCustomer.lastItems
        ? returningCustomer.lastItems.filter(item => menuItems.find(m => m.id === item.id) && !cart.find(c => c.id === item.id)).slice(0, 2)
        : [];

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleClose}>
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                    <div className="modal-content checkout-modal">
                        <div className="modal-header">
                            <h4 className="modal-title"><i className="bi bi-credit-card me-2"></i>Checkout</h4>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose} aria-label="Close"></button>
                        </div>
                        <div className="modal-body p-0">
                            <div className="row g-0">
                                <div className="col-lg-7 checkout-form-section">
                                    <div className="p-4">
                                        <h5 className="mb-4">Delivery Details</h5>
                                        {returningCustomer && customerSuggestions.length > 0 && (
                                            <div className="rc-banner" style={{ display: 'block' }}>
                                                <div className="rc-header">
                                                    <i className="bi bi-person-check-fill"></i>
                                                    <span>Welcome back, <strong>{(returningCustomer.name || '').split(' ')[0] || 'there'}</strong>!</span>
                                                </div>
                                                <p className="rc-subtitle">Because you loved these last time — add to your order:</p>
                                                <div className="rc-suggestions">
                                                    {customerSuggestions.map(item => {
                                                        const menuItem = menuItems.find(m => m.id === item.id);
                                                        if (!menuItem) return null;
                                                        return (
                                                            <div key={item.id} className="rc-suggestion-item">
                                                                {menuItem.image && (
                                                                    <img src={menuItem.image} alt={menuItem.name} className="rc-item-img" onError={e => { e.target.style.display = 'none'; }} />
                                                                )}
                                                                <div className="rc-item-info">
                                                                    <div className="rc-item-name">{menuItem.name}</div>
                                                                    <div className="rc-item-reason">Because last time you tried this &#10003;</div>
                                                                </div>
                                                                <button className="rc-add-btn" onClick={() => {
                                                                    setAddonModalOpen(true);
                                                                    setCurrentAddonItem(menuItem);
                                                                }}>
                                                                    <i className="bi bi-plus"></i> Add
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        <form id="checkoutForm" onSubmit={e => { e.preventDefault(); handlePlaceOrder(); }}>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Full Name *</label>
                                                    <input type="text" className="form-control" required placeholder="John Doe" value={formData.fullName} onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Phone Number *</label>
                                                    <input type="tel" className="form-control" required placeholder="+92 300 1234567" value={formData.phone} onChange={e => handlePhoneChange(e.target.value)} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Email Address</label>
                                                    <input type="email" className="form-control" placeholder="john@example.com" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Delivery Address *</label>
                                                    <textarea className="form-control" rows="2" required placeholder="House #, Street, Area" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}></textarea>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Current Location</label>
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            readOnly
                                                            placeholder={detectingLocation ? 'Detecting location...' : (checkoutLatLng ? `${checkoutLatLng.lat.toFixed(4)}, ${checkoutLatLng.lng.toFixed(4)}` : 'Detecting location...')}
                                                            value={checkoutLatLng ? `${checkoutLatLng.lat.toFixed(4)}, ${checkoutLatLng.lng.toFixed(4)}` : ''}
                                                        />
                                                        <button className="btn btn-outline-secondary" type="button" onClick={handleDetectLocation}>
                                                            <i className={`bi ${detectingLocation ? 'bi-arrow-repeat spin' : 'bi-geo-alt'}`}></i>
                                                        </button>
                                                    </div>
                                                    {deliveryEstimate && (
                                                        <div className="delivery-estimate mt-2" style={{ display: 'block' }}>
                                                            <div className="estimate-item">
                                                                <i className="bi bi-geo"></i>
                                                                <span>{deliveryEstimate.distance} km</span>
                                                            </div>
                                                            <div className="estimate-item">
                                                                <i className="bi bi-clock"></i>
                                                                <span>{deliveryEstimate.time} mins</span>
                                                            </div>
                                                            <div className="estimate-item">
                                                                <i className="bi bi-truck"></i>
                                                                <span>{deliveryEstimate.cost === 0 ? 'FREE' : `Rs. ${deliveryEstimate.cost}`}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">Order Notes</label>
                                                    <textarea className="form-control" rows="2" placeholder="Any special instructions?" value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}></textarea>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label d-block">Payment Method *</label>
                                                    <div className="payment-method-options">
                                                        {[
                                                            { value: 'cod', icon: 'bi-cash-coin', label: 'Cash on Delivery' },
                                                            { value: 'jazzcash', icon: 'bi-phone', label: 'JazzCash' },
                                                            { value: 'easypaisa', icon: 'bi-phone', label: 'EasyPaisa' }
                                                        ].map(pm => (
                                                            <label key={pm.value} className="payment-method-option">
                                                                <input type="radio" name="paymentMethod" value={pm.value} checked={formData.paymentMethod === pm.value} onChange={() => setFormData(prev => ({ ...prev, paymentMethod: pm.value }))} />
                                                                <span><i className={`bi ${pm.icon} me-2`}></i>{pm.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <div className="col-lg-5 checkout-summary-section">
                                    <div className="p-4">
                                        <h5 className="mb-4">Order Summary</h5>
                                        <div className="checkout-items">
                                            {cart.map(item => {
                                                const unitPrice = item.price + (item.addonPrice || 0);
                                                const itemTotal = unitPrice * item.quantity;
                                                return (
                                                    <div key={item.cartKey} className="checkout-item">
                                                        <span className="checkout-item-name">
                                                            <span className="checkout-item-qty">{item.quantity}x</span>
                                                            {escapeHtml(item.name)}
                                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                                <span className="checkout-item-addons">{item.selectedAddons.map(a => escapeHtml(a.name)).join(', ')}</span>
                                                            )}
                                                            {item.specialInstructions && (
                                                                <span className="checkout-item-note"><i className="bi bi-pencil-fill"></i> {escapeHtml(item.specialInstructions)}</span>
                                                            )}
                                                        </span>
                                                        <span>Rs. {itemTotal}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="checkout-totals mt-4 pt-3 border-top">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Subtotal</span>
                                                <span>Rs. {cartTotal}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Delivery</span>
                                                <span>{deliveryEstimate ? (deliveryEstimate.cost === 0 ? 'FREE' : `Rs. ${deliveryEstimate.cost}`) : (deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge}`)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between total-row mt-3 pt-3">
                                                <span>Total</span>
                                                <span>Rs. {cartTotal + (deliveryEstimate ? deliveryEstimate.cost : deliveryCharge)}</span>
                                            </div>
                                        </div>
                                        <button type="button" className="btn btn-checkout w-100 mt-4" onClick={handlePlaceOrder} disabled={isPlacing}>
                                            {isPlacing ? (
                                                <><i className="bi bi-arrow-repeat spin me-2"></i>Processing...</>
                                            ) : (
                                                <><i className="bi bi-check-circle me-2"></i>Place Order</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {successOrderDetails && (
                <SuccessModalInline
                    orderNumber={successOrderDetails.orderNumber}
                    total={successOrderDetails.total}
                    etaLabel={successOrderDetails.etaLabel}
                    onClose={() => { setSuccessOrderDetails(null); setSuccessModalOpen(false); }}
                />
            )}
        </>
    );
}

function SuccessModalInline({ orderNumber, total, etaLabel, onClose }) {
    return (
        <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                <div className="modal-content success-modal">
                    <div className="modal-body text-center p-5">
                        <div className="success-icon mb-4">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h3>Order Placed Successfully!</h3>
                        <p className="text-muted mb-4">Thank you for choosing Brew Beans. Your delicious order is being prepared and will be delivered soon.</p>
                        <div className="order-details mb-4">
                            <p className="mb-1"><strong>Order ID:</strong> {orderNumber}</p>
                            <p className="mb-1"><strong>Total:</strong> Rs. {total}</p>
                            <p className="mb-3"><strong>Estimated ready by:</strong> {etaLabel}</p>
                            <a href={`/order-tracking?order=${encodeURIComponent(orderNumber)}`} className="btn btn-outline-primary">
                                <i className="bi bi-truck me-2"></i>Track Your Order
                            </a>
                        </div>
                        <button type="button" className="btn btn-primary btn-lg" onClick={onClose}>
                            <i className="bi bi-house me-2"></i>Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
