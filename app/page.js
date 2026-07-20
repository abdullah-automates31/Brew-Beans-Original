'use client';

import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import MenuSection from '@/components/MenuSection';
import FanFavorites from '@/components/FanFavorites';
import WhyUsSection from '@/components/WhyUsSection';
import GallerySection from '@/components/GallerySection';
import ReviewsSection from '@/components/ReviewsSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import AddonModal from '@/components/AddonModal';
import CheckoutModal from '@/components/CheckoutModal';
import ScrollProgress from '@/components/ScrollProgress';

export default function HomePage() {
    return (
        <>
            <ScrollProgress />
            <LoadingScreen />
            <Navbar />
            <HeroSection />
            <AboutSection />
            <FanFavorites />
            <MenuSection />
            <WhyUsSection />
            <GallerySection />
            <ReviewsSection />
            <ContactSection />
            <Footer />
            <CartSidebar />
            <AddonModal />
            <CheckoutModal />
        </>
    );
}
