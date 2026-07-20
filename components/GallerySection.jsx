'use client';
import { useState, useEffect } from 'react';

export default function GallerySection() {
    const [lightboxImg, setLightboxImg] = useState(null);

    const galleryItems = [
        { src: '/Screenshot 2026-06-13 190414.png', alt: 'Coffee Brewing', cls: 'gallery-item-1' },
        { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', alt: 'Latte Art', cls: 'gallery-item-2' },
        { src: '/Screenshot 2026-06-13 190422.png', alt: 'Coffee Shop', cls: 'gallery-item-3' },
        { src: '/Screenshot 2026-06-13 201116.png', alt: 'Cafe Interior', cls: 'gallery-item-4' },
        { src: '/img/b1.png', alt: 'Coffee Beans', cls: 'gallery-item-5' },
        { src: '/Screenshot 2026-06-13 201209.png', alt: 'Pastries', cls: 'gallery-item-6' },
        { src: '/Screenshot 2026-06-13 201307.png', alt: 'Espresso Machine', cls: 'gallery-item-7' },
        { src: '/Screenshot 2026-06-13 201324.png', alt: 'Coffee Cup', cls: 'gallery-item-8' },
    ];

    function openLightbox(src) { setLightboxImg(src); }
    function closeLightbox() { setLightboxImg(null); }

    useEffect(() => {
        function handleEsc(e) {
            if (e.key === 'Escape') closeLightbox();
        }
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        document.body.style.overflow = lightboxImg ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [lightboxImg]);

    return (
        <>
            <section className="gallery section-padding" id="gallery">
                <div className="container">
                    <div className="section-header text-center" data-aos="fade-up">
                        <span className="section-label">Gallery</span>
                        <h2 className="section-title">A Visual Journey</h2>
                        <p className="section-subtitle">Moments captured at Brew Beans</p>
                    </div>
                    <div className="gallery-grid mt-2">
                        {galleryItems.map((item, i) => (
                            <div key={i} className={`gallery-item ${item.cls}`}
                                data-aos={i % 2 === 0 ? 'fade-right' : 'fade-left'}
                                data-aos-delay={i * 40}
                                onClick={() => openLightbox(item.src)}
                            >
                                <img src={item.src} alt={item.alt} loading="lazy" />
                                <div className="gallery-overlay">
                                    <i className="bi bi-zoom-in"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            <div className={`lightbox ${lightboxImg ? 'show' : ''}`} onClick={e => { if (e.target === e.currentTarget || e.target.closest('#lightboxClose')) closeLightbox(); }}>
                <button className="lightbox-close" id="lightboxClose"><i className="bi bi-x-lg"></i></button>
                {lightboxImg && <img src={lightboxImg} alt="Gallery Preview" />}
            </div>
        </>
    );
}
