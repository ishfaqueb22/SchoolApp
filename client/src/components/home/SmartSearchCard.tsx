import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, MapPin, School, Building } from "lucide-react";

const SmartSearchCard = () => {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-8 py-12 md:px-12 text-center md:text-left">
        <h2 className="text-3xl font-bold text-white mb-4">
          Advanced School Search
        </h2>
        <div className="md:flex md:items-center md:gap-10">
          <div className="w-full md:w-1/2">
            <p className="text-primary-100 mb-6">
              Find the perfect school with our powerful search tools. Filter by location, 
              curriculum, facilities, and more to discover schools that match your exact criteria.
            </p>
            <div className="mb-8">
              <Link href="/smart-search">
                <Button
                  variant="secondary" 
                  size="lg"
                  className="bg-white hover:bg-gray-50 text-primary-700 shadow-lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Try Smart Search
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 mt-8 md:mt-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg">
                  <MapPin className="h-6 w-6 text-white mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Location-Based</h3>
                    <p className="text-primary-100 text-sm">Find schools near you or in specific neighborhoods</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg">
                  <School className="h-6 w-6 text-white mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Curriculum</h3>
                    <p className="text-primary-100 text-sm">Filter by educational approach and teaching methods</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg">
                  <Building className="h-6 w-6 text-white mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Facilities</h3>
                    <p className="text-primary-100 text-sm">Find schools with specific amenities and resources</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg">
                  <Search className="h-6 w-6 text-white mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">Advanced Filters</h3>
                    <p className="text-primary-100 text-sm">Fine-tune your search with multiple criteria</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchCard;