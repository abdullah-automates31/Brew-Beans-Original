'use client';

import { useEffect } from 'react';

export default function ScrollProgress() {
    useEffect(() => {
        const bar = document.getElementById('scrollProgress');
        if (!bar) return;

        function update() {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const ratio = max > 0 ? h.scrollTop / max : 0;
            bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return <div className="scroll-progress" id="scrollProgress"></div>;
}
