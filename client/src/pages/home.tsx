import { Helmet } from "react-helmet";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import EnhancedSearchBanner from "@/components/home/EnhancedSearchBanner";
import AIMatchingSection from "@/components/home/AIMatchingSection";
import FeaturedSchoolsSection from "@/components/home/FeaturedSchoolsSection";
import MapViewSection from "@/components/home/MapViewSection";
import ComparisonToolTeaser from "@/components/home/ComparisonToolTeaser";
import CategoriesSection from "@/components/home/CategoriesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>SmartSchool Finder | Find the Perfect School for Your Child</title>
        <meta name="description" content="Discover and compare top-rated schools based on location, curriculum, facilities, and more. Our AI-powered matching helps you find the best educational fit." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
         integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
         crossOrigin=""/>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          {/* Hero and Search - Full width for maximum impact */}
          <HeroSection />
          <EnhancedSearchBanner />
          
          {/* Main content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Primary Tools Section - Two column layout for key features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <AIMatchingSection />
              <ComparisonToolTeaser />
            </div>
            
            {/* Schools Discovery Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Discover Schools</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Featured schools takes 2 columns on desktop */}
                <div className="lg:col-span-2">
                  <FeaturedSchoolsSection />
                </div>
                {/* Categories takes 1 column */}
                <div>
                  <CategoriesSection />
                </div>
              </div>
            </div>
            
            {/* Interactive Map - Full width for better visibility */}
            <MapViewSection />
            
            {/* Social Proof & Help Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
              <TestimonialsSection />
              <FAQSection />
            </div>
            
            {/* Call to Action - Full width for emphasis */}
            <CTASection />
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Home;
