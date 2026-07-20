'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const SHOP_LAT = 24.9180;
const SHOP_LNG = 67.0971;
const NAV_SCROLL_OFFSET = 110;

function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function sanitizeCartData(storedCart) {
    if (!Array.isArray(storedCart)) return [];
    return storedCart
        .filter(item => item && typeof item.id === 'number' && typeof item.price === 'number' && Number.isFinite(item.quantity) && item.quantity > 0)
        .map(item => {
            const selectedAddons = Array.isArray(item.selectedAddons)
                ? item.selectedAddons.filter(a => a && typeof a.name === 'string')
                : [];
            const specialInstructions = typeof item.specialInstructions === 'string'
                ? item.specialInstructions.slice(0, 100)
                : '';
            const cartKey = item.cartKey || (selectedAddons.length || specialInstructions
                ? `${item.id}_${selectedAddons.map(a => a.name).join('|')}_${specialInstructions}`
                : String(item.id));
            return {
                id: Number(item.id),
                cartKey,
                name: item.name || '',
                price: Number(item.price),
                addonPrice: Number(item.addonPrice) || 0,
                selectedAddons,
                specialInstructions,
                image: item.image || '',
                quantity: Number(item.quantity)
            };
        });
}

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

export function AppProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [dynamicBadgeMap, setDynamicBadgeMap] = useState({});
    const [userLocation, setUserLocation] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [addonModalOpen, setAddonModalOpen] = useState(false);
    const [currentAddonItem, setCurrentAddonItem] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    useEffect(() => {
        const saved = safeReadLocalStorage('brewBeansCart');
        if (saved) setCart(sanitizeCartData(saved));
        const loc = safeReadLocalStorage('brewBeansLocation');
        if (loc) setUserLocation(loc);
        const lastOrd = safeReadLocalStorage('brewBeansLastOrder');
        if (lastOrd) setLastOrder(lastOrd);
    }, []);

    const saveCart = useCallback((newCart) => {
        const cleaned = newCart.filter(item => item && Number.isFinite(item.quantity) && item.quantity > 0);
        setCart(cleaned);
        safeWriteLocalStorage('brewBeansCart', cleaned);
    }, []);

    const addToCart = useCallback((menuItem, quantity = 1, selectedAddons = [], addonPrice = 0, specialInstructions = '') => {
        setCart(prev => {
            const cartKey = selectedAddons.length || specialInstructions
                ? `${menuItem.id}_${selectedAddons.map(a => a.name).join('|')}_${specialInstructions}`
                : String(menuItem.id);
            const existing = prev.find(item => item.cartKey === cartKey);
            let updated;
            if (existing) {
                updated = prev.map(item =>
                    item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                updated = [...prev, {
                    id: menuItem.id,
                    cartKey,
                    name: menuItem.name,
                    price: menuItem.price,
                    addonPrice,
                    selectedAddons,
                    specialInstructions,
                    image: menuItem.image,
                    quantity
                }];
            }
            safeWriteLocalStorage('brewBeansCart', updated.filter(item => Number.isFinite(item.quantity) && item.quantity > 0));
            return updated;
        });
    }, []);

    const updateCartQuantity = useCallback((cartKey, delta) => {
        setCart(prev => {
            const updated = prev.map(item =>
                item.cartKey === cartKey ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
            );
            safeWriteLocalStorage('brewBeansCart', updated);
            return updated;
        });
    }, []);

    const removeFromCart = useCallback((cartKey) => {
        setCart(prev => {
            const updated = prev.filter(item => item.cartKey !== cartKey);
            safeWriteLocalStorage('brewBeansCart', updated);
            return updated;
        });
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        safeWriteLocalStorage('brewBeansCart', []);
    }, []);

    const cartTotal = cart.reduce((sum, item) => {
        const unitPrice = item.price + (item.addonPrice || 0);
        return sum + unitPrice * item.quantity;
    }, 0);

    const cartCount = cart.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

    const value = {
        cart, setCart: saveCart, addToCart, updateCartQuantity, removeFromCart, clearCart,
        cartTotal, cartCount,
        menuItems, setMenuItems,
        dynamicBadgeMap, setDynamicBadgeMap,
        userLocation, setUserLocation,
        cartOpen, setCartOpen,
        checkoutOpen, setCheckoutOpen,
        addonModalOpen, setAddonModalOpen,
        currentAddonItem, setCurrentAddonItem,
        successModalOpen, setSuccessModalOpen,
        lastOrder, setLastOrder,
        SHOP_LAT, SHOP_LNG, NAV_SCROLL_OFFSET,
        escapeHtml,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
