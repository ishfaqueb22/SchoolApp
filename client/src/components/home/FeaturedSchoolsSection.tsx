import { useEffect, useState } from "react";
import { Link } from "wouter";
import { School } from "@/lib/types";
import SchoolCard from "@/components/schools/SchoolCard";
import { apiRequest } from "@/lib/queryClient";
import { FEATURED_SCHOOLS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const FeaturedSchoolsSection = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // Request featured schools with the featured parameter
        const response = await apiRequest("GET", "/api/schools?featured=true&limit=3", undefined);
        const data = await response.json();
        setSchools(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch featured schools:", error);
        // Fallback to example data if needed
        setSchools(FEATURED_SCHOOLS);
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Featured Schools</h3>
        <Link href="/discover" className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center">
          View all <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse p-5">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mt-5"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-3"></div>
              <div className="flex justify-between mt-4">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex mt-6 space-x-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
          <div className="text-center mt-6">
            <Link href="/discover">
              <Button variant="outline" className="w-full">
                Explore All Schools
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedSchoolsSection;
