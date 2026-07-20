'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const STEPS = [
    { key: 'placed', label: 'Placed', icon: 'bi-bag-check' },
    { key: 'preparing', label: 'Preparing', icon: 'bi-cup-hot' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bi-bicycle' },
    { key: 'delivered', label: 'Delivered', icon: 'bi-house-check' },
];

const STATUS_LABELS = {
    placed: 'Placed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

function etaEstimate(createdAt, deliveryCharge) {
    const prepMin = 15;
    const legMin = deliveryCharge > 0 ? 25 : 8;
    return new Date(new Date(createdAt).getTime() + (prepMin + legMin) * 60000);
}

function paymentLabel(method, status) {
    const methodNames = { cod: 'Cash on Delivery', jazzcash: 'JazzCash', easypaisa: 'EasyPaisa' };
    const statusNames = { pending: 'Payment Pending', paid: 'Paid', failed: 'Payment Failed', cod: 'Pay on Delivery' };
    return `${methodNames[method] || method} — ${statusNames[status] || status}`;
}

export default function OrderTrackingInner() {
    const searchParams = useSearchParams();

    const [orderNumber, setOrderNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [order, setOrder] = useState(null);
    const [lastUpdated, setLastUpdated] = useState('');
    const [notifyEnabled, setNotifyEnabled] = useState(false);

    const pollRef = useRef(null);
    const lastStatusRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const fetchOrder = useCallback(async (orderNum, phoneNumber, silent) => {
        if (!silent) {
            setError('');
            setSuccess('');
            setLoading(true);
        }

        const { data, error: rpcError } = await supabase.rpc('get_order_status', {
            p_order_number: orderNum,
            p_phone: phoneNumber,
        });

        if (!silent) setLoading(false);

        const result = Array.isArray(data) ? data[0] : data;

        if (rpcError || !result) {
            if (!silent) {
                setError("We couldn't find an order matching that ID and phone number. Please double-check and try again.");
            }
            stopPolling();
            return;
        }

        const statusChanged = Boolean(lastStatusRef.current && lastStatusRef.current !== result.status);

        if (statusChanged) {
            if (result.status === 'cancelled') {
                setError('Order Cancelled — Your order has been cancelled. Please contact us for help.');
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Brew Beans — Order Cancelled', {
                        body: `Your order ${orderNum} has been cancelled.`,
                    });
                }
            } else {
                const label = STATUS_LABELS[result.status] || result.status;
                setSuccess(`Order status updated: ${label}`);
                if (notifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('Brew Beans order update', { body: `${orderNum} is now ${label}` });
                }
            }
        }

        lastStatusRef.current = result.status;
        setOrder(result);
        setLastUpdated(`Live — last checked ${new Date().toLocaleTimeString()}`);

        if (result.status === 'delivered' || result.status === 'cancelled') {
            stopPolling();
        } else if (!pollRef.current) {
            pollRef.current = setInterval(() => {
                fetchOrder(orderNum, phoneNumber, true);
            }, 10000);
        }
    }, [notifyEnabled, stopPolling]);

    useEffect(() => {
        const orderParam = searchParams.get('order');
        const paymentParam = searchParams.get('payment');

        let phoneParam = searchParams.get('phone');

        if (orderParam) {
            try {
                const stored = sessionStorage.getItem(`bb_phone_${orderParam}`);
                if (stored) {
                    phoneParam = stored;
                    sessionStorage.removeItem(`bb_phone_${orderParam}`);
                }
            } catch (e) { /* sessionStorage unavailable */ }
        }

        if (orderParam) setOrderNumber(orderParam);
        if (phoneParam) setPhone(phoneParam);

        if (paymentParam === 'success') {
            setSuccess('Payment successful! Here is your order status.');
        } else if (paymentParam === 'failed') {
            setError('Payment could not be completed. Please contact us or try again.');
        }

        if (orderParam && phoneParam) {
            fetchOrder(orderParam, phoneParam, false);

            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    setNotifyEnabled(true);
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then((perm) => {
                        if (perm === 'granted') setNotifyEnabled(true);
                    });
                }
            }
        }

        return () => stopPolling();
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        if (!orderNumber.trim() || !phone.trim()) return;
        stopPolling();
        lastStatusRef.current = null;
        fetchOrder(orderNumber.trim(), phone.trim(), false);
    }

    async function handleNotify() {
        if (!('Notification' in window)) {
            setError('Browser notifications are not supported here.');
            return;
        }
        const perm = await Notification.requestPermission();
        setNotifyEnabled(perm === 'granted');
    }

    function renderSteps(status) {
        if (status === 'cancelled') {
            return (
                <div className="tracking-step cancelled">
                    <div className="tracking-step-icon"><i className="bi bi-x-lg"></i></div>
                    <div className="tracking-step-label">Order Cancelled</div>
                </div>
            );
        }

        const currentIndex = STEPS.findIndex((s) => s.key === status);
        return STEPS.map((step, i) => {
            let cls = '';
            if (i < currentIndex) cls = 'done';
            else if (i === currentIndex) cls = 'active';
            return (
                <div key={step.key} className={`tracking-step ${cls}`}>
                    <div className="tracking-step-icon"><i className={`bi ${step.icon}`}></i></div>
                    <div className="tracking-step-label">{step.label}</div>
                </div>
            );
        });
    }

    const etaText = order
        ? order.status === 'cancelled'
            ? ''
            : order.status === 'delivered'
                ? 'Delivered — enjoy!'
                : `Estimated ready by ${etaEstimate(order.created_at, order.delivery_charge).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';

    return (
        <div className="tracking-card" data-aos="zoom-in-up" data-aos-duration="700" data-aos-delay="100">
            <h3 className="mb-4 text-center" data-aos="fade-up" data-aos-delay="200">Track Your Order</h3>

            <form onSubmit={handleSubmit} className="mb-4">
                <div className="row g-3">
                    <div className="col-12" data-aos="fade-up" data-aos-delay="250">
                        <label className="form-label">Order ID</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="BB-001234"
                            required
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                        />
                    </div>
                    <div className="col-12" data-aos="fade-up" data-aos-delay="320">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            className="form-control"
                            placeholder="+92 300 1234567"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="col-12" data-aos="fade-up" data-aos-delay="380">
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? (
                                <><i className="bi bi-arrow-repeat spin me-2"></i>Searching...</>
                            ) : (
                                <><i className="bi bi-search me-2"></i>Track Order</>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {order && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">{lastUpdated}</small>
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleNotify} title="Get notified when status changes">
                            <i className={`bi ${notifyEnabled ? 'bi-bell-fill' : 'bi-bell'} me-1`}></i>
                            {notifyEnabled ? 'Notifying' : 'Notify me'}
                        </button>
                    </div>

                    <div className="tracking-steps">
                        {renderSteps(order.status)}
                    </div>

                    <div className="text-center mb-2">
                        <span className="badge bg-secondary">{paymentLabel(order.payment_method, order.payment_status)}</span>
                    </div>
                    <p className="text-center text-muted small mb-3">{etaText}</p>

                    <div className="border-top pt-3">
                        <h6 className="mb-3">Order Summary</h6>
                        <div>
                            {(order.items || []).map((item, i) => (
                                <div key={i} className="d-flex justify-content-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>Rs. {item.total_price ?? (item.unit_price ?? 0) * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex justify-content-between mt-3 pt-3 border-top">
                            <span>Subtotal</span><span>Rs. {order.subtotal}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>Delivery</span>
                            <span>{order.delivery_charge === 0 ? 'FREE' : `Rs. ${order.delivery_charge}`}</span>
                        </div>
                        <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                            <span>Total</span><span>Rs. {order.total}</span>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}
        </div>
    );
}
