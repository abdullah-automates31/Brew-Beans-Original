import './globals.css';
import Script from 'next/script';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
    title: 'Brew Beans | Premium Artisan Coffee Shop in Karachi',
    description: 'Brew Beans - Experience handcrafted coffee, premium desserts, and unforgettable moments. Freshly brewed happiness in every cup. Dine-in, Drive-through & Delivery available in Karachi.',
    keywords: 'coffee shop, artisan coffee, espresso, cappuccino, latte, Karachi, premium coffee, desserts, frappes, brew beans',
    authors: [{ name: 'Brew Beans' }],
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        url: 'https://brewbeans.pk/',
        title: 'Brew Beans | Premium Artisan Coffee Shop',
        description: 'Experience handcrafted coffee, premium desserts, and unforgettable moments. Freshly brewed happiness in every cup.',
        images: [{ url: 'https://brewbeans.pk/img/b1.png' }],
        siteName: 'Brew Beans',
        locale: 'en_PK',
    },
    twitter: {
        card: 'summary_large_image',
        url: 'https://brewbeans.pk/',
        title: 'Brew Beans | Premium Artisan Coffee Shop',
        description: 'Experience handcrafted coffee, premium desserts, and unforgettable moments. Freshly brewed happiness in every cup.',
        images: ['https://brewbeans.pk/img/b1.png'],
    },
    icons: {
        icon: [
            { url: '/img/favicon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/img/favicon-192.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: { url: '/img/favicon-180.png', sizes: '180x180' },
    },
    alternates: {
        canonical: 'https://brewbeans.pk/',
    },
};

export default function RootLayout({ children }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CafeOrCoffeeShop',
        name: 'Brew Beans',
        image: 'https://brewbeans.pk/img/b1.png',
        '@id': 'https://brewbeans.pk',
        url: 'https://brewbeans.pk',
        telephone: '+92-311-2463092',
        priceRange: '$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Shop No. 6, Plot SB, Rab Medical Center, Block 2 Gulshan-e-Iqbal',
            addressLocality: 'Karachi',
            addressRegion: 'Sindh',
            postalCode: '75300',
            addressCountry: 'PK',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 24.9180,
            longitude: 67.0971,
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '09:00',
                closes: '04:00',
            },
        ],
        servesCuisine: 'Coffee, Desserts, Sandwiches',
        acceptsReservations: true,
        paymentAccepted: 'Cash, Credit Card, Mobile Payment',
        currenciesAccepted: 'PKR',
    };

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://cdn.jsdelivr.net" />
                <link rel="preconnect" href="https://images.unsplash.com" />
                <link rel="preload" as="image" href="/img/bg-2.png" fetchPriority="high" />
                <link rel="preload" as="image" href="/img/brewbeans-logo.png" fetchPriority="high" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
                />
                <link
                    href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css"
                    rel="stylesheet"
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                <AppProvider>
                    {children}
                </AppProvider>

                <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
                <Script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js" strategy="beforeInteractive" />
                <Script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js" strategy="beforeInteractive" />
                <Script src="https://cdn.jsdelivr.net/npm/motion@12.42.2/dist/motion.js" strategy="beforeInteractive" />
                <Script
                    id="aos-init"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            if (typeof AOS !== 'undefined' && !window.__aosInitialized) {
                                try {
                                    AOS.init({
                                        duration: 450,
                                        easing: 'ease-out-cubic',
                                        once: true,
                                        offset: 60
                                    });
                                    window.__aosInitialized = true;
                                } catch(e) {}
                            }
                            setTimeout(function() {
                                document.querySelectorAll('[data-aos]').forEach(function(el) {
                                    if (!el.classList.contains('aos-animate')) {
                                        el.style.opacity = '1';
                                        el.style.transform = 'none';
                                    }
                                });
                            }, 1200);
                        `,
                    }}
                />
                <Script
                    id="spin-keyframes"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            if (!document.getElementById('bb-spin-style')) {
                                var s = document.createElement('style');
                                s.id = 'bb-spin-style';
                                s.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;display:inline-block}';
                                document.head.appendChild(s);
                            }
                        `,
                    }}
                />
            </body>
        </html>
    );
}
