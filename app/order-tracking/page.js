'use client';

import { Suspense } from 'react';
import ScrollProgress from '@/components/ScrollProgress';
import OrderTrackingInner from './OrderTrackingInner';

export default function OrderTrackingPage() {
    return (
        <>
            <ScrollProgress />
            <section className="tracking-page">
                <div className="container">
                    <div className="text-center mb-4" data-aos="fade-down" data-aos-duration="700">
                        <a href="/" className="navbar-brand justify-content-center">
                            <img src="/img/brewbeans-logo.png" alt="Brew Beans Coffee Bar" className="brand-logo tracking-brand-logo" />
                        </a>
                    </div>

                    <Suspense fallback={
                        <div className="tracking-card text-center p-5">
                            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
                        </div>
                    }>
                        <OrderTrackingInner />
                    </Suspense>
                </div>
            </section>
        </>
    );
}
