import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="mb-12">
      <div className="bg-primary-700 rounded-lg overflow-hidden shadow-xl">
        <div className="px-6 py-12 md:py-16 md:px-12 text-center md:text-left md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to find the perfect school?</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto md:mx-0 text-lg text-primary-100 sm:text-xl md:mt-5">
              Create an account to save your favorites, get personalized recommendations, and more.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-center md:mt-0 md:flex-shrink-0">
            <div className="rounded-md shadow">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full md:text-lg md:px-10 text-primary-700 bg-white hover:bg-gray-50"
                >
                  Sign up now
                </Button>
              </Link>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <Link href="/discover">
                <Button 
                  size="lg" 
                  className="w-full md:text-lg md:px-10 bg-primary-800 hover:bg-primary-900"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
