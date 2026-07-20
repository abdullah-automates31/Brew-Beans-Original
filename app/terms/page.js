export const metadata = {
    title: 'Terms of Service | Brew Beans',
    robots: 'noindex, follow',
};

export default function TermsPage() {
    return (
        <section className="legal-page">
            <div className="container">
                <div className="legal-card">
                    <a href="/" className="legal-back-link"><i className="bi bi-arrow-left"></i> Back to Brew Beans</a>
                    <h1>Terms of Service</h1>
                    <p className="legal-updated">Last updated: July 2026</p>

                    <p>These terms govern your use of the Brew Beans website and your orders placed with us. By using this site or placing an order, you agree to the terms below.</p>

                    <h2>Orders</h2>
                    <p>Menu items, prices, and availability are subject to change without notice. We reserve the right to refuse or cancel an order &mdash; for example, if an item is out of stock, if delivery falls outside our service area, or if we suspect fraudulent activity. If we cancel a paid order, you will be refunded in full.</p>

                    <h2>Delivery</h2>
                    <p>Delivery charges are calculated based on distance from our shop and are shown at checkout before you confirm your order. Estimated preparation and delivery times are estimates, not guarantees, and can vary with weather, traffic, and order volume.</p>

                    <h2>Payments</h2>
                    <p>We accept cash on delivery and select online payment methods (JazzCash, EasyPaisa) where available. Online payments are processed by our payment partners under their own terms; we do not store your card or wallet credentials.</p>

                    <h2>Website Use</h2>
                    <p>You agree to use this website only for lawful purposes and not to misuse it in ways that could damage, disable, or impair the site or interfere with anyone else&rsquo;s use of it.</p>

                    <h2>Limitation of Liability</h2>
                    <p>We work hard to keep information on this site accurate and up to date, but we make no guarantees that it is always error-free. To the extent permitted by law, Brew Beans is not liable for indirect or incidental damages arising from your use of the site.</p>

                    <h2>Changes to These Terms</h2>
                    <p>We may update these terms from time to time. Continued use of the site after changes are posted means you accept the updated terms.</p>

                    <h2>Contact Us</h2>
                    <p>Questions about these terms? Reach out via the details on our <a href="/#contact">Contact page</a>.</p>
                </div>
            </div>
        </section>
    );
}
