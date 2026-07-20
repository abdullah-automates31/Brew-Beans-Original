'use client';
import { useApp } from '@/context/AppContext';
import { useState, useEffect, useRef } from 'react';

const HOT_MEDIA_CATS = ['hot-coffee'];
const COLD_MEDIA_CATS = ['cold-coffee', 'frappes', 'summer-coolers'];

const LOCAL_ADDON_CATALOG = {
    'hot-coffee': [
        { id: 'temp', name: 'Temperature Preference', required: true, multi: false, options: [
            { name: 'Extra Hot', price: 0 }, { name: 'Hot', price: 0 }, { name: 'Warm', price: 0 }, { name: 'Room Temperature', price: 0 }
        ]},
        { id: 'size', name: 'Cup Size', required: false, multi: false, options: [
            { name: 'Small', price: 0 }, { name: 'Medium', price: 0 }, { name: 'Large', price: 0 }
        ]},
        { id: 'milk', name: 'Milk Options', required: false, multi: false, options: [
            { name: 'Full Cream', price: 0 }, { name: 'Low Fat', price: 0 }, { name: 'Oat Milk', price: 70 },
            { name: 'Almond Milk', price: 90 }, { name: 'Soy Milk', price: 80 }
        ]},
        { id: 'blend', name: 'Choose Your Blend', required: false, multi: false, options: [
            { name: 'House Blend', price: 0 }, { name: 'Ethiopian Single Origin', price: 150 }, { name: 'Colombian Supremo', price: 120 }
        ]},
        { id: 'sweetness', name: 'Sweetness', required: false, multi: false, options: [
            { name: 'No Sugar', price: 0 }, { name: 'Less Sugar', price: 0 }, { name: 'Regular', price: 0 }, { name: 'Extra Sweet', price: 0 }
        ]},
        { id: 'extras', name: 'Add Extras', required: false, multi: true, options: [
            { name: 'Extra Espresso Shot', price: 60 }, { name: 'Vanilla Syrup', price: 50 }, { name: 'Caramel Syrup', price: 50 },
            { name: 'Hazelnut Syrup', price: 50 }, { name: 'Chocolate Syrup', price: 50 }, { name: 'Whipped Cream', price: 50 },
            { name: 'Cinnamon Powder', price: 30 }, { name: 'Chocolate Powder', price: 40 }, { name: 'Marshmallows', price: 70 }
        ]}
    ],
    'cold-coffee': [
        { id: 'temp', name: 'Temperature Preference', required: true, multi: false, options: [
            { name: 'Extra Cold', price: 0 }, { name: 'Cold', price: 0 }, { name: 'Room Temperature', price: 0 }
        ]},
        { id: 'blend', name: 'Choose Your Blend', required: false, multi: false, options: [
            { name: 'House Blend', price: 0 }, { name: 'Ethiopian Single Origin', price: 150 }, { name: 'Colombian Supremo', price: 120 }
        ]},
        { id: 'extras', name: 'Add Extras', required: false, multi: true, options: [
            { name: 'Extra Shot', price: 60 }, { name: 'Caramel Syrup', price: 50 }, { name: 'Hazelnut Syrup', price: 50 },
            { name: 'Oat Milk', price: 70 }, { name: 'Whipped Cream', price: 50 }, { name: 'Chocolate Powder', price: 40 }
        ]}
    ]
};
LOCAL_ADDON_CATALOG.frappes = LOCAL_ADDON_CATALOG['cold-coffee'];
LOCAL_ADDON_CATALOG['summer-coolers'] = LOCAL_ADDON_CATALOG['cold-coffee'];

function addonOptionIcon(groupId, name) {
    if (groupId !== 'temp' && groupId !== 'blend') return '';
    const n = name.toLowerCase();
    if (groupId === 'blend') return 'bi-cup-hot';
    if (n.includes('cold') || n.includes('iced')) return 'bi-snow2';
    if (n.includes('hot')) return 'bi-fire';
    return 'bi-thermometer-half';
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

export default function AddonModal() {
    const { addonModalOpen, setAddonModalOpen, currentAddonItem, setCurrentAddonItem, addToCart, escapeHtml } = useApp();
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [animatingPrice, setAnimatingPrice] = useState(0);
    const [breakdownExpanded, setBreakdownExpanded] = useState(false);
    const [priceExpanded, setPriceExpanded] = useState(false);
    const mediaRef = useRef(null);
    const imgRef = useRef(null);
    const animFrameRef = useRef(null);
    const priceAnimRef = useRef(null);

    const groups = currentAddonItem ? (LOCAL_ADDON_CATALOG[currentAddonItem.category] || []) : [];
    const isHot = currentAddonItem ? HOT_MEDIA_CATS.includes(currentAddonItem.category) : false;
    const isCold = currentAddonItem ? COLD_MEDIA_CATS.includes(currentAddonItem.category) : false;

    const selectedAddonsList = [];
    let extraPrice = 0;
    groups.forEach(group => {
        const selected = selectedOptions[group.id] || [];
        selected.forEach(optName => {
            const opt = group.options.find(o => o.name === optName);
            if (opt) {
                selectedAddonsList.push({ name: opt.name, price: opt.price });
                extraPrice += opt.price;
            }
        });
    });
    const baseTotal = currentAddonItem ? (currentAddonItem.price + extraPrice) * quantity : 0;

    const animatedPriceRef = useRef(0);
    useEffect(() => {
        const to = baseTotal;
        const from = animatedPriceRef.current;
        if (from === to) { setAnimatingPrice(to); animatedPriceRef.current = to; return; }
        if (priceAnimRef.current) cancelAnimationFrame(priceAnimRef.current);
        const duration = 300;
        const start = performance.now();
        function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.round(from + (to - from) * eased);
            setAnimatingPrice(val);
            if (p < 1) priceAnimRef.current = requestAnimationFrame(tick);
            else animatedPriceRef.current = to;
        }
        priceAnimRef.current = requestAnimationFrame(tick);
        return () => { if (priceAnimRef.current) cancelAnimationFrame(priceAnimRef.current); };
    }, [baseTotal]);

    useEffect(() => {
        if (addonModalOpen && currentAddonItem) {
            setSelectedOptions({});
            setQuantity(1);
            setSpecialInstructions('');
            setAnimatingPrice(currentAddonItem.price);
            animatedPriceRef.current = currentAddonItem.price;
            setBreakdownExpanded(false);
            setPriceExpanded(false);
        }
    }, [addonModalOpen, currentAddonItem]);

    function handleOptionClick(groupId, optionName, isMulti) {
        setSelectedOptions(prev => {
            const current = prev[groupId] || [];
            if (isMulti) {
                const newSelected = current.includes(optionName)
                    ? current.filter(n => n !== optionName)
                    : [...current, optionName];
                return { ...prev, [groupId]: newSelected };
            } else {
                const wasSelected = current.includes(optionName);
                return { ...prev, [groupId]: wasSelected ? [] : [optionName] };
            }
        });
    }

    function handleMediaMouseMove(e) {
        if (!imgRef.current) return;
        const rect = mediaRef.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        imgRef.current.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg)`;
    }

    function handleMediaMouseLeave() {
        if (imgRef.current) imgRef.current.style.transform = '';
    }

    function handleSubmit() {
        if (!currentAddonItem) return;

        const mandatoryGroups = groups.filter(g => g.required);
        for (const group of mandatoryGroups) {
            const selected = selectedOptions[group.id] || [];
            if (selected.length === 0) {
                showToast('Please select all required options', 'warning');
                return;
            }
        }

        const addonPrice = selectedAddonsList.reduce((sum, a) => sum + a.price, 0);
        const trimmedInstructions = specialInstructions.trim().slice(0, 100);
        const addedName = currentAddonItem.name;

        addToCart(currentAddonItem, quantity, selectedAddonsList, addonPrice, trimmedInstructions);
        setAddonModalOpen(false);
        setCurrentAddonItem(null);
        showToast(`${addedName} added to cart!`);
    }

    function handleClose() {
        setAddonModalOpen(false);
        setCurrentAddonItem(null);
    }

    useEffect(() => {
        if (!addonModalOpen) return;
        function handleKey(e) { if (e.key === 'Escape') handleClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [addonModalOpen]);

    if (!addonModalOpen || !currentAddonItem) return null;

    const mediaClass = `addon-media${isHot ? ' is-hot' : ''}${isCold ? ' is-cold' : ''}`;

    return (
        <div className="modal fade show d-block" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleClose}>
            <div className="modal-dialog modal-dialog-centered addon-modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="modal-content addon-modal">
                    <button type="button" className="addon-modal-close" onClick={handleClose} aria-label="Close">
                        <i className="bi bi-x-lg"></i>
                    </button>

                    <div className="addon-modal-body">
                        <div ref={mediaRef} className={mediaClass} onMouseMove={handleMediaMouseMove} onMouseLeave={handleMediaMouseLeave}>
                            <div className="addon-media-glow"></div>
                            <div className="addon-steam" aria-hidden="true">
                                <span className="addon-steam-wisp addon-steam-wisp-1"></span>
                                <span className="addon-steam-wisp addon-steam-wisp-2"></span>
                                <span className="addon-steam-wisp addon-steam-wisp-3"></span>
                            </div>
                            <div className="addon-chill" aria-hidden="true">
                                <span className="addon-ice-cube addon-ice-cube-1"></span>
                                <span className="addon-ice-cube addon-ice-cube-2"></span>
                                <span className="addon-droplet addon-droplet-1"></span>
                                <span className="addon-droplet addon-droplet-2"></span>
                                <span className="addon-droplet addon-droplet-3"></span>
                            </div>
                            <div className="addon-media-stage">
                                <img ref={imgRef} src={currentAddonItem.image || ''} alt={currentAddonItem.name} className="addon-media-img" />
                            </div>
                            <div className="addon-media-caption">
                                <span className="addon-media-badge"><i className="bi bi-stars"></i> Customize</span>
                                <h3 className="addon-media-name">{escapeHtml(currentAddonItem.name)}</h3>
                                <p className="addon-media-desc">{escapeHtml(currentAddonItem.description || '')}</p>
                                <div className="addon-media-baseprice">Base Price <strong>Rs. {currentAddonItem.price}</strong></div>
                            </div>
                        </div>

                        <div className="addon-panel">
                            <div className="addon-panel-scroll">
                                <div id="addonGroupsContainer">
                                    {groups.length === 0 ? (
                                        <div className="addon-empty-state">
                                            <i className="bi bi-check2-circle"></i>
                                            <p>This item is ready to go — just pick your quantity below.</p>
                                        </div>
                                    ) : groups.map(group => (
                                        <div key={group.id} className="addon-group">
                                            <div className="addon-group-title">
                                                {group.name}{' '}
                                                {group.required
                                                    ? <span className="addon-required-badge">Required</span>
                                                    : <span className="addon-optional-badge">Optional</span>
                                                }
                                            </div>
                                            <div className={`addon-options${(selectedOptions[group.id] || []).length > 0 ? ' has-selection' : ''}`}>
                                                {group.options.map(opt => {
                                                    const icon = addonOptionIcon(group.id, opt.name);
                                                    const isSelected = (selectedOptions[group.id] || []).includes(opt.name);
                                                    return (
                                                        <div
                                                            key={opt.name}
                                                            className={`addon-option${isSelected ? ' selected' : ''}`}
                                                            onClick={() => handleOptionClick(group.id, opt.name, group.multi)}
                                                        >
                                                            <span className="addon-option-name">
                                                                {icon ? <i className={`bi ${icon} addon-option-icon`}></i> : null}
                                                                {opt.name}
                                                            </span>
                                                            {opt.price > 0 && (
                                                                <span className="addon-option-price">+Rs.{opt.price}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={`addon-price-breakdown${breakdownExpanded ? ' show' : ''}`}>
                                    {(selectedAddonsList.length > 0 || quantity > 1) && (
                                        <>
                                            <div className="addon-breakdown-row">
                                                <span>Base Price</span>
                                                <span>Rs. {currentAddonItem.price}</span>
                                            </div>
                                            {selectedAddonsList.filter(a => a.price > 0).map((a, i) => (
                                                <div key={i} className="addon-breakdown-row">
                                                    <span>{a.name}</span>
                                                    <span>+Rs. {a.price}</span>
                                                </div>
                                            ))}
                                            {quantity > 1 && (
                                                <div className="addon-breakdown-row addon-breakdown-qty">
                                                    <span>Quantity</span>
                                                    <span>&times; {quantity}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="addon-notes-group">
                                    <div className="addon-group-title">
                                        Special Instructions <span className="addon-optional-badge">Optional</span>
                                    </div>
                                    <textarea
                                        className="addon-notes-input"
                                        maxLength={100}
                                        placeholder="Add any special instructions..."
                                        value={specialInstructions}
                                        onChange={e => setSpecialInstructions(e.target.value)}
                                    />
                                    <div className="addon-notes-count"><span>{specialInstructions.length}</span>/100</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="addon-modal-footer">
                        <div className="addon-qty" role="group" aria-label="Quantity">
                            <button type="button" className="addon-qty-btn" aria-label="Decrease quantity" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                <i className="bi bi-dash"></i>
                            </button>
                            <span className="addon-qty-value">{quantity}</span>
                            <button type="button" className="addon-qty-btn" aria-label="Increase quantity" onClick={() => setQuantity(q => Math.min(20, q + 1))}>
                                <i className="bi bi-plus"></i>
                            </button>
                        </div>
                        <button type="button" className="btn-addon-submit" onClick={handleSubmit}>
                            <i className="bi bi-bag-check"></i> Add to Cart
                        </button>
                        <button
                            type="button"
                            className={`addon-price-pill${priceExpanded ? ' expanded' : ''}`}
                            onClick={() => { setPriceExpanded(v => !v); setBreakdownExpanded(v => !v); }}
                            aria-label="Toggle price breakdown"
                        >
                            <span className="addon-price-pill-text">
                                <span className="addon-price-pill-label">Total Price</span>
                                <span className="addon-price-pill-value">Rs. {animatingPrice}</span>
                            </span>
                            <i className="bi bi-chevron-down addon-price-pill-chevron"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
