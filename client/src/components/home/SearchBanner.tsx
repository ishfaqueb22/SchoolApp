import { useState, KeyboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, MapPin, GraduationCap, BookOpen, ArrowRight, 
  Filter, Info, X, Sparkles, School, Building
} from "lucide-react";
import { LOCATIONS, SCHOOL_TYPES, GRADE_LEVELS, FEATURES } from "@/lib/constants";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SearchBanner = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [popularSearches] = useState<string[]>([
    "International Schools in Karachi", 
    "Cambridge Schools in Lahore", 
    "STEM Schools in Islamabad",
    "Islamic Schools with Computer Lab"
  ]);
  
  // Navigation hook
  const [, navigate] = useLocation();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Add to recent searches, avoid duplicates, and keep only the last 5
    const updatedSearches = [
      query,
      ...recentSearches.filter(search => search !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handleSearch = () => {
    // Save the search query
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }
    
    // Build query parameters for search
    const params = new URLSearchParams();
    
    if (searchQuery) params.append("query", searchQuery);
    if (location) params.append("location", location);
    if (curriculum) params.append("curriculum", curriculum);
    if (gradeLevel) params.append("gradeLevel", gradeLevel);
    
    // Add selected features
    if (selectedFeatures.length > 0) {
      for (const feature of selectedFeatures) {
        params.append("features", feature);
      }
    }
    
    // Hide recent searches dropdown
    setShowRecentSearches(false);
    
    // Navigate to discover page with search parameters
    navigate(`/discover?${params.toString()}`);
  };
  
  // Handle enter key press in search input
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Handle quick search selection
  const handleQuickSearch = (search: string) => {
    setSearchQuery(search);
    saveRecentSearch(search);
    // Hide the dropdown
    setShowRecentSearches(false);
    // Trigger search with the new query
    const params = new URLSearchParams();
    params.append("query", search);
    navigate(`/discover?${params.toString()}`);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setLocation("");
    setCurriculum("");
    setGradeLevel("");
    setSelectedFeatures([]);
  };
  
  // Focus handler for search input
  const handleSearchFocus = () => {
    // Only show if we have recent searches and the input is empty
    if (recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  };
  
  // Blur handler for search input with delay to allow clicking on suggestions
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowRecentSearches(false);
    }, 200);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100 to-blue-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-center gap-2 mb-5">
            <School className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center">
              <span className="mr-2">Find Your Ideal School</span>
              <SimpleTooltip content="Our search feature helps you discover schools based on your preferences">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </SimpleTooltip>
            </h2>
            <School className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={handleKeyPress}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pl-10 pr-12 py-3"
                  placeholder="Search schools by name, location, or curriculum"
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                
                {/* Search suggestions dropdown */}
                {showRecentSearches && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden">
                    {/* Recent searches section */}
                    {recentSearches.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-xs font-medium text-gray-500 mb-1 px-2">Recent Searches</h4>
                        <div className="space-y-1">
                          {recentSearches.map((search, index) => (
                            <button
                              key={`recent-${index}`}
                              onClick={() => handleQuickSearch(search)}
                              className="flex items-center gap-2 w-full text-left text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md"
                            >
                              <Search className="h-3 w-3 text-gray-400" />
                              <span className="truncate">{search}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Popular searches section */}
                    <div className="p-2 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 mb-1 px-2">Popular Searches</h4>
                      <div className="space-y-1">
                        {popularSearches.map((search, index) => (
                          <button
                            key={`popular-${index}`}
                            onClick={() => handleQuickSearch(search)}
                            className="flex items-center gap-2 w-full text-left text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md"
                          >
                            <Sparkles className="h-3 w-3 text-yellow-400" />
                            <span className="truncate">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="col-span-1">
                <div className="relative">
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <Select
                    value={location}
                    onValueChange={setLocation}
                    className="pl-8"
                  >
                    <option value="">Location</option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="col-span-1">
                <div className="relative">
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <Select
                    value={curriculum}
                    onValueChange={setCurriculum}
                    className="pl-8"
                  >
                    <option value="">Curriculum</option>
                    {SCHOOL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="col-span-1">
                <div className="relative">
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-gray-500">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <Select
                    value={gradeLevel}
                    onValueChange={setGradeLevel}
                    className="pl-8"
                  >
                    <option value="">Grade Level</option>
                    {GRADE_LEVELS.map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="col-span-1">
                <Button 
                  onClick={handleSearch}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 mr-2" /> 
                  Search
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-2 items-center">
              <Button 
                variant="ghost" 
                className="text-sm flex items-center text-gray-600"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Filter className="h-3 w-3 mr-1" />
                {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </Button>
              
              {(searchQuery || location || curriculum || gradeLevel || selectedFeatures.length > 0) && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={clearAllFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            
            {selectedFeatures.length > 0 && (
              <div className="flex items-center text-sm text-gray-500">
                <Badge variant="outline" className="bg-gray-50">
                  {selectedFeatures.length} filter{selectedFeatures.length > 1 ? 's' : ''} applied
                </Badge>
              </div>
            )}
          </div>
          
          {/* Advanced filters section */}
          {showAdvanced && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg animate-in fade-in duration-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <span className="mr-1">School Features</span>
                <SimpleTooltip content="Select specific features you need in a school">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </SimpleTooltip>
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((feature) => (
                  <div key={feature.value} className="flex items-center">
                    <Badge 
                      variant={selectedFeatures.includes(feature.value) ? "default" : "outline"}
                      className={cn(
                        "transition-all duration-200",
                        selectedFeatures.includes(feature.value) 
                          ? '' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      )}
                      clickable
                      onClick={() => handleFeatureToggle(feature.value)}
                    >
                      {feature.label}
                    </Badge>
                    <SimpleTooltip
                      content={<span className="max-w-xs">{feature.description}</span>}
                      side="top"
                    >
                      <div className="ml-1 cursor-help">
                        <Info className="h-3 w-3 text-gray-400" />
                      </div>
                    </SimpleTooltip>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedFeatures([])}
                  disabled={selectedFeatures.length === 0}
                >
                  Clear filters
                </Button>
                
                <Button 
                  onClick={handleSearch}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  Apply filters
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBanner;
