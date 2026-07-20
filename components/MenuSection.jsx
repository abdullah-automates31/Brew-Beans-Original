'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function MenuSection() {
    const { menuItems, setMenuItems, dynamicBadgeMap, setDynamicBadgeMap, addToCart, setAddonModalOpen, setCurrentAddonItem } = useApp();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function loadMenu() {
            const [{ data, error }, { data: badgeRows }] = await Promise.all([
                supabase.from('menu_items').select('*').eq('is_available', true).order('id'),
                supabase.rpc('get_menu_badges')
            ]);
            const BADGE_LABEL = { 'badge-bestseller': '🔥 Best Seller', 'badge-popular': '⭐ Fan Favorite', 'badge-trending': '📈 Trending' };
            const map = {};
            (badgeRows || []).forEach(r => {
                if (r.badge_cls) map[r.menu_item_id] = { label: BADGE_LABEL[r.badge_cls] || r.badge, cls: r.badge_cls };
            });
            setDynamicBadgeMap(map);
            if (data && data.length) setMenuItems(data);
        }
        loadMenu();
    }, []);

    const filteredItems = (activeFilter === 'all' ? menuItems : menuItems.filter(i => i.category === activeFilter))
        .filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description || '').toLowerCase().includes(searchQuery.toLowerCase()));

    function handleAddToCart(item) {
        setCurrentAddonItem(item);
        setAddonModalOpen(true);
    }

    return (
        <section className="menu section-padding" id="menu">
            <div className="container">
                <div className="section-header text-center" data-aos="fade-up">
                    <span className="section-label">Our Menu</span>
                    <h2 className="section-title">Crafted with Passion</h2>
                    <p className="section-subtitle">Discover our signature selections</p>
                </div>

                <div className="menu-search-bar" data-aos="fade-up" data-aos-delay="80">
                    <i className="bi bi-search"></i>
                    <input type="text" placeholder="Search drinks, desserts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                <div className="menu-filters">
                    {['all', 'hot-coffee', 'cold-coffee', 'frappes', 'summer-coolers', 'desserts'].map(f => (
                        <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
                            {f === 'all' ? 'All Items' : f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                <div className="row g-4">
                    {filteredItems.length === 0 ? (
                        <div className="col-12 text-center py-5 text-muted">
                            <i className="bi bi-search" style={{fontSize:'2rem'}}></i>
                            <p className="mt-3">No items found for "<strong>{searchQuery}</strong>"</p>
                        </div>
                    ) : filteredItems.map(item => {
                        const badge = dynamicBadgeMap[item.id];
                        return (
                            <div key={item.id} className="col-12 col-md-6 col-lg-3 motion-pop" style={{opacity:1}}>
                                <div className="menu-item">
                                    <div className="menu-item-img">
                                        <img src={item.image} alt={item.name} loading="lazy" />
                                        <span className="menu-item-badge">{item.category.replace('-', ' ')}</span>
                                        {badge ? (
                                            <span className={`menu-item-tag ${badge.cls}`}>{badge.label}</span>
                                        ) : item.is_popular ? (
                                            <span className="menu-item-tag badge-popular">⭐ Popular</span>
                                        ) : null}
                                    </div>
                                    <div className="menu-item-content">
                                        <h3 className="menu-item-name">{item.name}</h3>
                                        <p className="menu-item-desc">{item.description}</p>
                                        <div className="menu-item-footer">
                                            <span className="menu-item-price">Rs. {item.price}</span>
                                            <button className="btn-add-cart" onClick={() => handleAddToCart(item)}>
                                                <i className="bi bi-plus-lg"></i> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
