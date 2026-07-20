'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NAV_SCROLL_OFFSET = 110;

function fmt12(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return hour + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + period;
}

export default function Navbar() {
    const { cartCount, setCartOpen, lastOrder } = useApp();
    const router = useRouter();
    const [shopBanner, setShopBanner] = useState(null);
    const navbarNavRef = useRef(null);

    const handleTrackOrder = useCallback(() => {
        if (lastOrder && lastOrder.orderNumber && lastOrder.phone) {
            try { sessionStorage.setItem(`bb_phone_${lastOrder.orderNumber}`, lastOrder.phone); } catch (e) { /* ignore */ }
            router.push(`/order-tracking?order=${encodeURIComponent(lastOrder.orderNumber)}`);
        } else {
            router.push('/order-tracking');
        }
    }, [router, lastOrder]);

    /* ── Business hours banner ── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await supabase
                    .from('business_hours')
                    .select('*')
                    .order('day_of_week');
                if (cancelled || !data) return;

                const now = new Date();
                const day = now.getDay();
                const todayHours = data.find((h) => h.day_of_week === day);

                if (!todayHours || todayHours.is_closed) {
                    const next = data.find(
                        (h) => h.day_of_week === (day + 1) % 7 && !h.is_closed
                    );
                    const txt = next
                        ? `Closed · Opens ${DAY_NAMES[next.day_of_week]} at ${fmt12(next.open_time)}`
                        : 'Closed Today';
                    setShopBanner({ text: txt, isOpen: false });
                    return;
                }

                const [oh, om] = todayHours.open_time.split(':').map(Number);
                const [ch, cm] = todayHours.close_time.split(':').map(Number);
                const nowMins = now.getHours() * 60 + now.getMinutes();
                const openMins = oh * 60 + om;
                let closeMins = ch * 60 + cm;
                if (closeMins < openMins) closeMins += 24 * 60;

                if (nowMins >= openMins && nowMins < closeMins) {
                    setShopBanner({
                        text: 'Open · Closes at ' + fmt12(todayHours.close_time),
                        isOpen: true,
                    });
                } else if (nowMins < openMins) {
                    setShopBanner({
                        text: 'Closed · Opens today at ' + fmt12(todayHours.open_time),
                        isOpen: false,
                    });
                } else {
                    const next = data.find(
                        (h) => h.day_of_week === (day + 1) % 7 && !h.is_closed
                    );
                    const txt = next
                        ? `Closed · Opens ${DAY_NAMES[next.day_of_week]} at ${fmt12(next.open_time)}`
                        : 'Closed';
                    setShopBanner({ text: txt, isOpen: false });
                }
            } catch (e) { /* silent */ }
        })();
        return () => { cancelled = true; };
    }, []);

    /* ── Scroll: .scrolled class + active nav link ── */
    useEffect(() => {
        let ticking = false;

        function onScrollFrame() {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const nav = document.getElementById('mainNav');
            if (nav) {
                nav.classList.toggle('scrolled', scrollY > 50);
            }

            /* Active nav link highlighting */
            const scrollPos = scrollY + NAV_SCROLL_OFFSET + 20;
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            navLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (!href) return;
                const section = document.querySelector(href);
                if (!section) return;
                const sectionTop = section.getBoundingClientRect().top + window.scrollY;
                const sectionBottom = sectionTop + section.offsetHeight;
                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    navLinks.forEach((l) => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });

            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(onScrollFrame);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Smooth scroll for nav-link clicks ── */
    useEffect(() => {
        function handleClick(e) {
            const link = e.target.closest('.nav-link[href^="#"]');
            if (!link) return;
            e.preventDefault();
            const href = link.getAttribute('href');
            const target = document.querySelector(href);
            if (target) {
                const y = target.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
            /* Close mobile menu */
            const navbarCollapse = document.querySelector('.navbar-collapse.show');
            if (navbarCollapse) {
                const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbarCollapse);
                if (bsCollapse) bsCollapse.hide();
                else navbarCollapse.classList.remove('show');
            }
        }

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* ── Mobile menu: outside-click & ESC to close ── */
    useEffect(() => {
        const navbarNavEl = navbarNavRef.current;
        if (!navbarNavEl) return;

        function handleOutsideClick(e) {
            if (!navbarNavEl.classList.contains('show')) return;
            if (navbarNavEl.contains(e.target) || e.target.closest('.navbar-toggler')) return;
            const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbarNavEl);
            if (bsCollapse) bsCollapse.hide();
            else navbarNavEl.classList.remove('show');
        }

        function handleKeydown(e) {
            if (e.key === 'Escape' && navbarNavEl.classList.contains('show')) {
                const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbarNavEl);
                if (bsCollapse) bsCollapse.hide();
                else navbarNavEl.classList.remove('show');
            }
        }

        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleKeydown);
        };
    }, []);

    return (
        <nav className="navbar navbar-expand-lg fixed-top" id="mainNav">
            <div className="nav-shell">
                <div className="nav-side nav-side-left">
                    <button type="button" className="nav-info-card nav-info-location" id="navLocationCard">
                        <span className="nav-info-icon"><i className="bi bi-geo-alt-fill"></i></span>
                        <span className="nav-info-text">
                            <span className="nav-info-label">Delivery</span>
                            <span className="nav-info-value">Karachi, Pakistan</span>
                        </span>
                        <i className="bi bi-chevron-down nav-info-caret"></i>
                    </button>
                    <a href="tel:+923112463092" className="nav-info-card nav-info-phone">
                        <span className="nav-info-icon"><i className="bi bi-telephone-fill"></i></span>
                        <span className="nav-info-value">+92 311 2463092</span>
                    </a>
                </div>

                <a className="navbar-brand" href="#home">
                    <span className="brand-badge">
                        <img
                            src="/img/brewbeans-logo.png"
                            alt="Brew Beans Coffee Bar"
                            className="brand-logo"
                            width="872"
                            height="439"
                        />
                    </span>
                </a>

                <div className="nav-side nav-side-right">
                    <div className="collapse navbar-collapse" id="navbarNav" ref={navbarNavRef}>
                        <ul className="navbar-nav align-items-lg-center">
                            <li className="nav-item"><a className="nav-link" href="#home">Home</a></li>
                            <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
                            <li className="nav-item"><a className="nav-link" href="#menu">Menu</a></li>
                            <li className="nav-item"><a className="nav-link" href="#gallery">Gallery</a></li>
                            <li className="nav-item"><a className="nav-link" href="#reviews">Reviews</a></li>
                            <li className="nav-item"><a className="nav-link" href="#contact">Contact</a></li>
                            <li className="nav-item ms-lg-2" id="trackOrderNavItem" style={{ display: lastOrder ? '' : 'none' }}>
                                <button className="btn-track-nav" onClick={handleTrackOrder}>
                                    <i className="bi bi-truck"></i> Track Order
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="nav-actions">
                        <span id="shopBanner" style={{ display: shopBanner ? '' : 'none' }}>
                            <span
                                id="shopBannerInner"
                                className="shop-banner-pill"
                                style={{
                                    background: shopBanner?.isOpen ? 'rgba(134,239,172,0.15)' : 'rgba(252,165,165,0.15)',
                                    borderColor: shopBanner?.isOpen ? 'rgba(134,239,172,0.5)' : 'rgba(252,165,165,0.5)',
                                }}
                            >
                                <span
                                    className="shop-banner-dot"
                                    style={{ background: shopBanner?.isOpen ? '#86efac' : '#fca5a5' }}
                                ></span>
                                <span className="shop-banner-text">{shopBanner?.text || ''}</span>
                            </span>
                        </span>
                        <button className="btn btn-cart" onClick={() => setCartOpen(true)}>
                            <i className="bi bi-bag"></i>
                            <span className={`cart-badge ${cartCount > 0 ? 'show' : ''}`} id="cartCount">
                                {cartCount}
                            </span>
                        </button>
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="hamburger-bar"></span>
                            <span className="hamburger-bar"></span>
                            <span className="hamburger-bar"></span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
