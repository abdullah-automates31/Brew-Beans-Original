'use client';

export default function WhyUsSection() {
    return (
        <section className="why-us section-padding bg-primary-dark" id="why-us">
            <div className="container">
                <div className="section-header text-center" data-aos="fade-up">
                    <span className="section-label text-white-50">Why Brew Beans</span>
                    <h2 className="section-title text-white">The Brew Beans Difference</h2>
                    <p className="section-subtitle text-white-50">What makes us special</p>
                </div>
                <div className="row g-4 mt-2 justify-content-center">
                    <div className="col-md-6 col-lg-3" data-aos="fade-right" data-aos-delay="0">
                        <div className="why-card">
                            <div className="why-icon"><i className="bi bi-tree-fill"></i></div>
                            <h4>Fresh Beans</h4>
                            <p>Ethically sourced and freshly roasted weekly for maximum aroma and flavor.</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3" data-aos="fade-left" data-aos-delay="60">
                        <div className="why-card">
                            <div className="why-icon"><i className="bi bi-award"></i></div>
                            <h4>Premium Quality</h4>
                            <p>Only the top 1% of Arabica beans make it into our signature blends.</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3" data-aos="fade-right" data-aos-delay="120">
                        <div className="why-card">
                            <div className="why-icon"><i className="bi bi-lightning-charge"></i></div>
                            <h4>Fast Delivery</h4>
                            <p>Hot and fresh to your door within 30 minutes. Guaranteed satisfaction.</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3" data-aos="fade-left" data-aos-delay="180">
                        <div className="why-card">
                            <div className="why-icon"><i className="bi bi-shield-check"></i></div>
                            <h4>Hygienic Prep</h4>
                            <p>ISO-certified kitchen with strict hygiene protocols and contactless options.</p>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-3" data-aos="fade-right" data-aos-delay="240">
                        <div className="why-card">
                            <div className="why-icon"><i className="bi bi-shop"></i></div>
                            <h4>Cozy Environment</h4>
                            <p>Warm, inviting spaces designed for work, relaxation, and connection.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
