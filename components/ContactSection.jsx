'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function ContactSection() {
    const { escapeHtml } = useApp();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    function handleChange(e) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        const form = e.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        setSending(true);
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Thanks for reaching out! We\'ll get back to you soon.</span>';
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.appendChild(toast);
            document.body.appendChild(container);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => container.remove(), 400);
            }, 3000);

            setFormData({ name: '', email: '', subject: '', message: '' });
            form.classList.remove('was-validated');
            setSending(false);
        }, 800);
    }

    return (
        <section className="contact section-padding" id="contact">
            <div className="container">
                <div className="section-header text-center" data-aos="fade-up">
                    <span className="section-label">Get In Touch</span>
                    <h2 className="section-title">Visit Us Today</h2>
                    <p className="section-subtitle">We&apos;d love to hear from you</p>
                </div>
                <div className="row g-5 mt-2">
                    <div className="col-lg-5" data-aos="fade-right">
                        <div className="contact-info">
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <i className="bi bi-geo-alt"></i>
                                </div>
                                <div className="contact-details">
                                    <h5>Address</h5>
                                    <p>Shop No. 6, Plot SB, Rab Medical Center,<br />Block 2 Gulshan-e-Iqbal,<br />Karachi, Pakistan</p>
                                </div>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <i className="bi bi-telephone"></i>
                                </div>
                                <div className="contact-details">
                                    <h5>Phone</h5>
                                    <p><a href="tel:+923112463092">+92 311 2463092</a></p>
                                </div>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <i className="bi bi-envelope"></i>
                                </div>
                                <div className="contact-details">
                                    <h5>Email</h5>
                                    <p><a href="mailto:hello@brewbeans.pk">hello@brewbeans.pk</a></p>
                                </div>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <i className="bi bi-clock"></i>
                                </div>
                                <div className="contact-details">
                                    <h5>Opening Hours</h5>
                                    <p>Mon - Sun: 9:00 AM - 4:00 AM</p>
                                </div>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <i className="bi bi-shop"></i>
                                </div>
                                <div className="contact-details">
                                    <h5>Services</h5>
                                    <p>Dine In · Drive Through · No Contact Delivery</p>
                                </div>
                            </div>

                            <div className="social-links mt-4">
                                <a href="https://www.facebook.com/brewbeanskhi/" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook"></i></a>
                                <a href="https://www.instagram.com/brewbeans.karachi/" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                                <a href="https://wa.me/923112463092" className="social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><i className="bi bi-whatsapp"></i></a>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-7" data-aos="fade-left">
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3619.4405!2d67.0971!3d24.9180!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDU1JzA0LjgiTiA2N8KwMDUnNDkuNiJF!5e0!3m2!1sen!2s!4v1609459200000!5m2!1sen!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '400px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Brew Beans Location Map"
                            ></iframe>
                        </div>
                    </div>
                </div>
                <div className="row mt-5">
                    <div className="col-lg-8 col-xl-7 mx-auto" data-aos="fade-up">
                        <div className="contact-form-card">
                            <h3 className="contact-form-title">Send Us a Message</h3>
                            <p className="contact-form-subtitle">Have a question, feedback, or a catering request? We&apos;d love to hear from you.</p>
                            <form noValidate onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label" htmlFor="contactName">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="contactName"
                                            name="name"
                                            required
                                            placeholder="Your name"
                                            autoComplete="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                        <div className="invalid-feedback">Please enter your full name.</div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label" htmlFor="contactEmail">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="contactEmail"
                                            name="email"
                                            required
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        <div className="invalid-feedback">Please enter a valid email address.</div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label" htmlFor="contactSubject">Subject</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="contactSubject"
                                            name="subject"
                                            required
                                            placeholder="What&apos;s this about?"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                        <div className="invalid-feedback">Please enter a subject.</div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label" htmlFor="contactMessage">Message</label>
                                        <textarea
                                            className="form-control"
                                            id="contactMessage"
                                            name="message"
                                            rows="5"
                                            required
                                            placeholder="Tell us more..."
                                            value={formData.message}
                                            onChange={handleChange}
                                        ></textarea>
                                        <div className="invalid-feedback">Please enter your message.</div>
                                    </div>
                                    <div className="col-12">
                                        <button type="submit" className="btn btn-checkout w-100" disabled={sending}>
                                            <i className="bi bi-send me-2"></i>{sending ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
