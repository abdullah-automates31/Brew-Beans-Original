'use client';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';

const COFFEE_CATS = ['hot-coffee', 'cold-coffee', 'frappes'];
const FOOD_CATS = ['desserts', 'sandwiches'];

export default function CartSidebar() {
    const { cart, cartOpen, setCartOpen, updateCartQuantity, removeFromCart, cartTotal, menuItems, setCurrentAddonItem, setAddonModalOpen, setCheckoutOpen } = useApp();

    const deliveryCharge = cartTotal > 1000 ? 0 : 100;
    const grandTotal = cartTotal + deliveryCharge;

    function getUpsellItems() {
        if (!menuItems.length || cart.length === 0) return [];
        const inCartIds = new Set(cart.map(i => i.id));
        const cartCats = new Set(cart.map(i => {
            const found = menuItems.find(m => m.id === i.id);
            return found ? found.category : null;
        }).filter(Boolean));
        const hasCoffee = [...cartCats].some(c => COFFEE_CATS.includes(c));
        const hasFood = [...cartCats].some(c => FOOD_CATS.includes(c));
        let suggestions = [];
        if (hasCoffee && !hasFood) {
            suggestions = menuItems.filter(m => FOOD_CATS.includes(m.category) && !inCartIds.has(m.id)).sort(() => Math.random() - 0.5).slice(0, 2);
        } else if (hasFood && !hasCoffee) {
            suggestions = menuItems.filter(m => COFFEE_CATS.includes(m.category) && !inCartIds.has(m.id)).sort(() => Math.random() - 0.5).slice(0, 2);
        }
        return suggestions;
    }
    const upsellItems = getUpsellItems();

    function handleBrowseMenu() {
        setCartOpen(false);
        const el = document.getElementById('menu');
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    }

    function handleCheckout() {
        if (cart.length === 0) return;
        setCartOpen(false);
        setCheckoutOpen(true);
    }

    useEffect(() => {
        if (!cartOpen) return;
        let startX = 0;
        function handleTouchStart(e) { startX = e.touches[0].clientX; }
        function handleTouchEnd(e) {
            const diff = startX - e.changedTouches[0].clientX;
            if (diff > 100) setCartOpen(false);
        }
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [cartOpen]);

    useEffect(() => {
        if (!cartOpen) return;
        function handleKey(e) { if (e.key === 'Escape') setCartOpen(false); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [cartOpen, setCartOpen]);

    return (
        <>
            <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h4><i className="bi bi-bag me-2"></i>Your Order</h4>
                    <button className="btn-close-cart" onClick={() => setCartOpen(false)}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="cart-body">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <i className="bi bi-bag-x"></i>
                            <p>Your cart is empty</p>
                            <span className="text-muted">Add some delicious items!</span>
                            <button className="btn-browse-menu" onClick={handleBrowseMenu}>Browse Menu</button>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map(item => {
                                    const unitPrice = item.price + (item.addonPrice || 0);
                                    const itemTotal = unitPrice * item.quantity;
                                    return (
                                        <div key={item.cartKey} className="cart-item">
                                            <img src={item.image} alt={item.name} className="cart-item-img" />
                                            <div className="cart-item-info">
                                                <div className="cart-item-name">{item.name}</div>
                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                    <div className="cart-item-addons">
                                                        {item.selectedAddons.map(a => a.price > 0 ? `${a.name} +Rs.${a.price}` : a.name).join(' · ')}
                                                    </div>
                                                )}
                                                {item.specialInstructions && (
                                                    <div className="cart-item-note"><i className="bi bi-pencil-fill"></i> {item.specialInstructions}</div>
                                                )}
                                                <div className="cart-item-price">Rs. {itemTotal}</div>
                                                <div className="cart-item-actions">
                                                    <button className="cart-qty-btn qty-minus" onClick={() => updateCartQuantity(item.cartKey, -1)}><i className="bi bi-dash"></i></button>
                                                    <span className="cart-qty">{item.quantity}</span>
                                                    <button className="cart-qty-btn qty-plus" onClick={() => updateCartQuantity(item.cartKey, 1)}><i className="bi bi-plus"></i></button>
                                                    <button className="cart-item-remove" onClick={() => removeFromCart(item.cartKey)}><i className="bi bi-trash"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {upsellItems.length > 0 && (
                                <div>
                                    <div className="upsell-header">Also try...</div>
                                    <div className="upsell-cards">
                                        {upsellItems.map(item => (
                                            <div key={item.id} className="upsell-card">
                                                <img src={item.image} alt={item.name} className="upsell-img" />
                                                <div className="upsell-info">
                                                    <div className="upsell-name">{item.name}</div>
                                                    <div className="upsell-price">Rs. {item.price}</div>
                                                </div>
                                                <button className="upsell-add btn-add-cart" title="Add to cart" onClick={() => { setCurrentAddonItem(item); setAddonModalOpen(true); }}>
                                                    <i className="bi bi-plus-lg"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>Rs. {cartTotal}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery</span>
                                <span>{deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge}`}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>Rs. {grandTotal}</span>
                            </div>
                        </div>
                        <button className="btn btn-checkout w-100" onClick={handleCheckout}>
                            <i className="bi bi-credit-card me-2"></i>Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
            <div className={`cart-overlay ${cartOpen ? 'show' : ''}`} onClick={() => setCartOpen(false)}></div>
        </>
    );
}
