'use client';

export default function Footer() {
    function handleNewsletter(e) {
        e.preventDefault();
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Thank you for subscribing!</span>';
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.appendChild(toast);
        document.body.appendChild(container);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => container.remove(), 400);
        }, 3000);
        e.target.reset();
    }

    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="container">
                    <div className="row g-5">
                        <div className="col-lg-4 col-md-6">
                            <div className="footer-brand">
                                <a className="navbar-brand mb-3" href="#home">
                                    <img src="img/brewbeans-logo.png" alt="Brew Beans Coffee Bar" className="brand-logo" />
                                </a>
                                <p className="footer-text">Crafting moments of joy through exceptional coffee and warm hospitality since 2018. Your daily dose of happiness.</p>
                                <div className="footer-social">
                                    <a href="https://www.facebook.com/brewbeanskhi/" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook"></i></a>
                                    <a href="https://www.instagram.com/brewbeans.karachi/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                                    <a href="https://wa.me/923112463092" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp"></i></a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-6">
                            <div className="footer-links">
                                <h5>Quick Links</h5>
                                <ul>
                                    <li><a href="#home">Home</a></li>
                                    <li><a href="#about">About Us</a></li>
                                    <li><a href="#menu">Our Menu</a></li>
                                    <li><a href="#gallery">Gallery</a></li>
                                    <li><a href="#contact">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-6">
                            <div className="footer-links">
                                <h5>Services</h5>
                                <ul>
                                    <li><a href="#contact">Dine In</a></li>
                                    <li><a href="#contact">Drive Through</a></li>
                                    <li><a href="#menu">Delivery</a></li>
                                    <li><a href="#contact">Catering</a></li>
                                    <li><a href="#contact">Private Events</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="footer-newsletter">
                                <h5>Newsletter</h5>
                                <p>Subscribe for exclusive offers, new menu updates, and coffee tips.</p>
                                <form className="newsletter-form" onSubmit={handleNewsletter}>
                                    <div className="input-group">
                                        <input type="email" className="form-control" placeholder="Your email address" required />
                                        <button className="btn btn-primary" type="submit">
                                            <i className="bi bi-send"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <p className="copyright">&copy; 2026 Brew Beans. All rights reserved.</p>
                        </div>
                        <div className="col-md-6 text-md-end">
                            <div className="footer-bottom-links">
                                <a href="privacy-policy.html">Privacy Policy</a>
                                <a href="terms.html">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
