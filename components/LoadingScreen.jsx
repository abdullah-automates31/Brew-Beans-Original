'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('bbVisited')) {
            setHidden(true);
            return;
        }
        const timer = setTimeout(() => {
            setHidden(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('bbVisited', '1');
            }
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div id="loading-screen" className={hidden ? 'hidden' : ''}>
            <div className="loading-content">
                <img
                    src="/img/brewbeans-logo.png"
                    alt="Brew Beans Coffee Bar"
                    className="loading-logo"
                />
                <p className="loading-subtext">Brewing something special...</p>
            </div>
        </div>
    );
}
