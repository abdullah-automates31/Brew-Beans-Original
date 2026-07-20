'use client';

import { useApp } from '@/context/AppContext';

export default function FanFavorites() {
    const { menuItems, addToCart, setAddonModalOpen, setCurrentAddonItem } = useApp();
    const featured = menuItems.filter(item => item.is_popular);

    if (!featured.length) return null;

    function handleOrder(item) {
        setCurrentAddonItem(item);
        setAddonModalOpen(true);
    }

    return (
        <section id="fanFavorites" className="section-padding" style={{ background: 'linear-gradient(135deg, #f9f5f0 0%, #fff8f0 100%)' }}>
            <div className="container">
                <div className="section-header text-center" data-aos="fade-up">
                    <span className="section-label">Most Loved</span>
                    <h2 className="section-title">Fan Favorites</h2>
                    <p className="section-subtitle">The ones our customers can&apos;t get enough of</p>
                </div>
                <div className="fav-grid">
                    {featured.map(item => (
                        <div key={item.id} className="fav-card" data-aos="fade-up">
                            <div className="fav-card-img">
                                <img src={item.image} alt={item.name} loading="lazy" />
                                <span className="fav-tag">⭐ Fan Favorite</span>
                            </div>
                            <div className="fav-card-body">
                                <h4 className="fav-card-name">{item.name}</h4>
                                <p className="fav-card-desc">{item.description}</p>
                                <div className="fav-card-footer">
                                    <span className="fav-card-price">Rs. {item.price}</span>
                                    <button className="btn-fav-order btn-add-cart" onClick={() => handleOrder(item)}>
                                        <i className="bi bi-plus-lg"></i> Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
