'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const autoplayRef = useRef(null);
    const frameRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const totalSlides = 3;

    const goToSlide = useCallback((index) => {
        let target = index;
        if (index < 0) target = totalSlides - 1;
        if (index >= totalSlides) target = 0;
        setCurrentSlide(target);
        if (autoplayRef.current) {
            clearInterval(autoplayRef.current);
            autoplayRef.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % totalSlides);
            }, 4000);
        }
    }, [totalSlides]);

    const handlePrev = useCallback(() => {
        goToSlide(currentSlide - 1);
    }, [currentSlide, goToSlide]);

    const handleNext = useCallback(() => {
        goToSlide(currentSlide + 1);
    }, [currentSlide, goToSlide]);

    const handleDotClick = useCallback((index) => {
        goToSlide(index);
    }, [goToSlide]);

    const handleSmoothScroll = useCallback((e) => {
        const href = e.currentTarget.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 110;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    }, []);

    useEffect(() => {
        autoplayRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 4000);
        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [totalSlides]);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;

        const handleTouchStart = (e) => {
            touchStartX.current = e.touches[0].clientX;
        };

        const handleTouchEnd = (e) => {
            touchEndX.current = e.changedTouches[0].clientX;
            const diff = touchStartX.current - touchEndX.current;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    handleNext();
                } else {
                    handlePrev();
                }
            }
        };

        frame.addEventListener('touchstart', handleTouchStart, { passive: true });
        frame.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            frame.removeEventListener('touchstart', handleTouchStart);
            frame.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleNext, handlePrev]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            document.querySelectorAll('.hero-bg').forEach((bg) => {
                bg.style.transform = `translateY(${scrollY * 0.3}px)`;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="hero" id="home">
            <div className="hero-frame" id="heroFrame" ref={frameRef}>
                <div
                    className={`hero-slide${currentSlide === 0 ? ' is-active' : ''}${currentSlide === 1 || currentSlide === 2 ? ' hero-slide-banner' : ''}`}
                    data-slide-index="0"
                    style={{ display: currentSlide === 0 ? 'block' : 'none' }}
                >
                    <div className="hero-bg" style={{ backgroundImage: "url('img/bg-2.png')" }}></div>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <div className="hero-inner" data-aos="fade-up" data-aos-duration="1200">
                            <span className="hero-badge">
                                <i className="bi bi-star-fill me-1"></i>Premium Artisan Coffee
                            </span>
                            <h1 className="hero-title">Freshly Brewed Happiness<br/>in Every <span className="hero-title-accent">Cup</span></h1>
                            <p className="hero-subtitle">Experience handcrafted coffee, premium desserts, and unforgettable moments in the heart of Karachi.</p>
                            <div className="hero-buttons">
                                <a href="#menu" className="btn btn-primary btn-lg me-3" onClick={handleSmoothScroll}>
                                    <i className="bi bi-cup-hot me-2"></i>Order Now
                                </a>
                                <a href="#menu" className="btn btn-outline-light btn-lg" onClick={handleSmoothScroll}>
                                    <i className="bi bi-journal-text me-2"></i>View Menu
                                </a>
                            </div>
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <span className="stat-icon"><i className="bi bi-people-fill"></i></span>
                                    <span className="stat-text">
                                        <span className="stat-number">15K+</span>
                                        <span className="stat-label">Happy Customers</span>
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-icon"><i className="bi bi-cup-hot-fill"></i></span>
                                    <span className="stat-text">
                                        <span className="stat-number">50+</span>
                                        <span className="stat-label">Coffee Varieties</span>
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-icon"><i className="bi bi-star-fill"></i></span>
                                    <span className="stat-text">
                                        <span className="stat-number">4.9</span>
                                        <span className="stat-label">Average Rating</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`hero-slide hero-slide-banner${currentSlide === 1 ? ' is-active' : ''}`}
                    data-slide-index="1"
                    style={{ display: currentSlide === 1 ? 'block' : 'none' }}
                >
                    <div className="hero-bg" style={{ backgroundImage: "url('/img/predict.png')", backgroundPosition: "center" }}></div>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <div className="hero-inner">
                            <div className="hero-buttons">
                                <a href="#menu" className="btn btn-primary btn-lg" onClick={handleSmoothScroll}>
                                    <i className="bi bi-trophy-fill me-2"></i>Predict Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={`hero-slide hero-slide-banner${currentSlide === 2 ? ' is-active' : ''}`}
                    data-slide-index="2"
                    style={{ display: currentSlide === 2 ? 'block' : 'none' }}
                >
                    <div className="hero-bg" style={{ backgroundImage: "url('/img/3rd carousel.png')", backgroundPosition: "center" }}></div>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <div className="hero-inner">
                            <div className="hero-buttons">
                                <a href="#menu" className="btn btn-primary btn-lg" onClick={handleSmoothScroll}>
                                    <i className="bi bi-cup-hot me-2"></i>Order Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" className="hero-arrow hero-arrow-prev" id="heroPrev" aria-label="Previous slide" onClick={handlePrev}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <button type="button" className="hero-arrow hero-arrow-next" id="heroNext" aria-label="Next slide" onClick={handleNext}>
                    <i className="bi bi-chevron-right"></i>
                </button>

                <div className="hero-dots" id="heroDots">
                    {[0, 1, 2].map((i) => (
                        <button
                            key={i}
                            type="button"
                            className={`hero-dot${currentSlide === i ? ' is-active' : ''}`}
                            data-slide-index={i}
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => handleDotClick(i)}
                        ></button>
                    ))}
                </div>
            </div>
        </section>
    );
}
