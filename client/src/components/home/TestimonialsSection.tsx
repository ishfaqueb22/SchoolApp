import { Link } from "wouter";
import TestimonialCard from "@/components/ui/testimonial-card";
import { Testimonial } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { TESTIMONIALS } from "@/lib/constants"; // Keep as fallback

const TestimonialsSection = () => {
  // Fetch testimonials from API
  const { data: testimonials, isLoading, error } = useQuery({
    queryKey: ['/api/testimonials'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use fallback data while loading or if there's an error
  const displayTestimonials = !isLoading && !error && testimonials ? testimonials : TESTIMONIALS;

  return (
    <section className="mb-12">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg py-8 px-6 sm:py-12 sm:px-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">What Parents Are Saying</h2>
          <p className="mt-2 text-gray-600">
            Hear from families who found their perfect school match
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            // Show skeleton placeholders while loading
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-gray-200 mb-4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex justify-center mt-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))
          ) : (
            displayTestimonials.map((testimonial: Testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/testimonials" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
            Read more testimonials 
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
