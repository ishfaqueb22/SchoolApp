import { Button } from "@/components/ui/button";
import FAQItem from "@/components/ui/faq-item";
import { FAQ } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { FAQS } from "@/lib/constants"; // Keep as fallback

const FAQSection = () => {
  // Fetch FAQs from API
  const { data: faqs, isLoading, error } = useQuery({
    queryKey: ['/api/faqs'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use fallback data while loading or if there's an error
  const displayFaqs = !isLoading && !error && faqs ? faqs : FAQS;

  return (
    <section className="mb-12">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {isLoading ? (
              // Show skeleton loaders while loading
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6 mb-1"></div>
                  <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                </div>
              ))
            ) : (
              displayFaqs.map((faq: FAQ) => (
                <FAQItem key={faq.id} faq={faq} />
              ))
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Don't see your question here?</p>
            <Button variant="outline" className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-transparent">
              Contact our support team
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
