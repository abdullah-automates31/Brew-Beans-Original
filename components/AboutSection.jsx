'use client';

import { useCallback } from 'react';

export default function AboutSection() {
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

    return (
        <section className="about section-padding" id="about">
            <div className="container">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6" data-aos="fade-right">
                        <div className="about-images">
                            <div className="about-img-main">
                                <img
                                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=700&fit=crop"
                                    alt="Brew Beans Coffee Shop Interior"
                                    loading="lazy"
                                />
                            </div>
                            <div className="about-img-float">
                                <img
                                    src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&h=300&fit=crop"
                                    alt="Coffee Art"
                                    loading="lazy"
                                />
                            </div>
                            <div className="experience-badge">
                                <span className="exp-number">8+</span>
                                <span className="exp-text">Years of<br/>Excellence</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6" data-aos="fade-left">
                        <div className="about-content">
                            <span className="section-label">Our Story</span>
                            <h2 className="section-title">Where Every Cup<br/>Tells a Story</h2>
                            <p className="section-text">Founded in 2018, Brew Beans began with a simple mission: to bring the world's finest coffee experiences to Karachi. What started as a small corner shop has blossomed into a beloved community gathering place.</p>
                            <p className="section-text">We source our beans directly from ethical farms in Ethiopia, Colombia, and Guatemala, ensuring every sip supports sustainable farming practices while delivering unmatched flavor profiles.</p>
                            <div className="about-features mt-4">
                                <div className="about-feature">
                                    <div className="feature-icon"><i className="bi bi-cup-hot"></i></div>
                                    <div className="feature-info">
                                        <h5>Artisan Roasting</h5>
                                        <p>Small-batch roasted for peak flavor</p>
                                    </div>
                                </div>
                                <div className="about-feature">
                                    <div className="feature-icon"><i className="bi bi-heart"></i></div>
                                    <div className="feature-info">
                                        <h5>Made with Love</h5>
                                        <p>Every drink crafted with passion</p>
                                    </div>
                                </div>
                            </div>
                            <a href="#menu" className="btn btn-primary mt-4" onClick={handleSmoothScroll}>
                                <i className="bi bi-arrow-right me-2"></i>Explore Our Menu
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
