'use client';

export default function ReviewsSection() {
    return (
        <section className="reviews section-padding bg-light" id="reviews">
            <div className="container">
                <div className="section-header text-center" data-aos="fade-up">
                    <span className="section-label">Testimonials</span>
                    <h2 className="section-title">What Our Customers Say</h2>
                    <p className="section-subtitle">Real reviews from our Google Business Profile</p>
                </div>
                <div className="row g-4 mt-2">
                    <div className="col-md-6 col-lg-4" data-aos="fade-right" data-aos-delay="100">
                        <div className="review-card">
                            <div className="review-stars">
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                            </div>
                            <p className="review-text">&quot;Excellent coffee and a fantastic ambience. Cozy, welcoming, and the perfect spot to relax. Will definitely be coming back!&quot;</p>
                            <div className="reviewer">
                                <div className="reviewer-avatar">S</div>
                                <div className="reviewer-info">
                                    <h5>Shahzeb Aslam</h5>
                                    <span className="review-source"><i className="bi bi-google"></i> Google Review</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
                        <div className="review-card">
                            <div className="review-stars">
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                            </div>
                            <p className="review-text">&quot;Just went out for a coffee and it turned out to be such a peaceful moment. The vibe was calm, the coffee tasted amazing, and everything felt so aesthetic and relaxing. Definitely a good experience.&quot;</p>
                            <div className="reviewer">
                                <div className="reviewer-avatar">M</div>
                                <div className="reviewer-info">
                                    <h5>Mustafa Mushtaq</h5>
                                    <span className="review-source"><i className="bi bi-google"></i> Google Review</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-lg-4" data-aos="fade-left" data-aos-delay="300">
                        <div className="review-card">
                            <div className="review-stars">
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                                <i className="bi bi-star-fill"></i>
                            </div>
                            <p className="review-text">&quot;Amazing taste, best service and amazing owners.&quot;</p>
                            <div className="reviewer">
                                <div className="reviewer-avatar">S</div>
                                <div className="reviewer-info">
                                    <h5>Salman Ali</h5>
                                    <span className="review-source"><i className="bi bi-google"></i> Google Review</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-4" data-aos="fade-up">
                    <a href="https://www.google.com/maps/search/?api=1&query=Brew+Beans+Karachi" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                        <i className="bi bi-google me-2"></i>See all reviews on Google
                    </a>
                </div>
            </div>
        </section>
    );
}
