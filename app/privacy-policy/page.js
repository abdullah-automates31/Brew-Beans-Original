export const metadata = {
    title: 'Privacy Policy | Brew Beans',
    robots: 'noindex, follow',
};

export default function PrivacyPolicyPage() {
    return (
        <section className="legal-page">
            <div className="container">
                <div className="legal-card">
                    <a href="/" className="legal-back-link"><i className="bi bi-arrow-left"></i> Back to Brew Beans</a>
                    <h1>Privacy Policy</h1>
                    <p className="legal-updated">Last updated: July 2026</p>

                    <p>Brew Beans (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates this website to let customers browse our menu, place orders, and get in touch. This policy explains what information we collect and how we use it.</p>

                    <h2>Information We Collect</h2>
                    <p>When you place an order or fill out our contact form, we collect the details you provide directly, such as:</p>
                    <ul>
                        <li>Your name and phone number</li>
                        <li>Your delivery address or location (only if you request delivery)</li>
                        <li>Order details (items, quantities, payment method)</li>
                        <li>Any message you send us through the contact form</li>
                    </ul>
                    <p>We do not collect payment card details ourselves &mdash; online payments are handled directly by our payment partners (JazzCash, EasyPaisa), who have their own privacy and security practices.</p>

                    <h2>How We Use Your Information</h2>
                    <p>We use the information you provide to prepare and deliver your order, contact you about order status, calculate delivery charges based on distance, and respond to questions or feedback you send us. We do not sell or rent your personal information to third parties.</p>

                    <h2>Cookies and Local Storage</h2>
                    <p>Our site uses your browser&rsquo;s local storage to remember items in your cart between visits, and session storage to briefly pass order details between pages during checkout. This data stays on your device and is not sent to third-party advertisers.</p>

                    <h2>Data Retention</h2>
                    <p>Order records are kept for as long as needed to fulfill orders, resolve disputes, and meet our accounting obligations. You can ask us to delete your information at any time by contacting us using the details below.</p>

                    <h2>Your Rights</h2>
                    <p>You can ask us what information we hold about you, request a correction, or request deletion at any time. Contact us via WhatsApp or the contact form on our homepage and we&rsquo;ll respond as soon as possible.</p>

                    <h2>Contact Us</h2>
                    <p>If you have questions about this policy, reach out to us through the contact details on our <a href="/#contact">Contact page</a>.</p>
                </div>
            </div>
        </section>
    );
}
