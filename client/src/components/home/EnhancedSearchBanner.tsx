import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, MapPin, GraduationCap, BookOpen, ArrowRight, 
  Filter, Info, X, Sparkles, School, Building, Star, TrendingUp,
  BadgeCheck, CircleCheck, CircleDashed, RefreshCw, MapPinned
} from "lucide-react";
import { LOCATIONS, SCHOOL_TYPES, GRADE_LEVELS, FEATURES } from "@/lib/constants";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Interface for filter options - same as in discover.tsx
interface ExtendedFilterOptions {
  location?: string;
  curriculum?: string;
  gradeLevel?: string;
  features?: string[];
  minRating?: number;
  maxTuition?: string;
  hasFinancialAid?: boolean;
  useLocationDistance?: boolean;
  radius?: number;
  category?: string;
  showVerifiedOnly?: boolean;
}

const EnhancedSearchBanner = () => {
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false); // Initially hidden
  const [filterView, setFilterView] = useState<'simple' | 'advanced'>('simple');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Advanced Filters
  const [filters, setFilters] = useState<ExtendedFilterOptions>({
    location: "",
    curriculum: "",
    gradeLevel: "",
    features: [],
    minRating: 0,
    hasFinancialAid: false,
    useLocationDistance: false,
    radius: 10,
    showVerifiedOnly: false
  });
  
  // Fetch school categories for advanced filtering
  const { data: schoolCategories } = useQuery({
    queryKey: ['/api/school-categories'],
    staleTime: 300000, // 5 minutes
  });
  
  // Predefined popular searches
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

  // Get user's location if needed
  useEffect(() => {
    if (filters.useLocationDistance && !userCoordinates) {
      getUserLocation();
    }
  }, [filters.useLocationDistance]);
  
  // Scroll to filters section when it opens
  useEffect(() => {
    if (showAdvanced && filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showAdvanced]);

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

  // Toggle feature selection
  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = filters.features || [];
    
    if (currentFeatures.includes(feature)) {
      setFilters({
        ...filters,
        features: currentFeatures.filter(f => f !== feature)
      });
    } else {
      setFilters({
        ...filters,
        features: [...currentFeatures, feature]
      });
    }
  };

  // General filter change handler
  const handleFilterChange = (filterName: string, value: string | number | boolean) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
  };

  // Handle search with all parameters
  const handleSearch = () => {
    // Save the search query
    if (searchQuery) {
      saveRecentSearch(searchQuery);
    }
    
    // Build query parameters for search
    const params = new URLSearchParams();
    
    if (searchQuery) params.append("q", searchQuery); // Using 'q' as the server expects this parameter name
    if (filters.location) params.append("location", filters.location);
    if (filters.curriculum) params.append("curriculum", filters.curriculum);
    if (filters.gradeLevel) params.append("gradeLevel", filters.gradeLevel);
    if (filters.minRating && filters.minRating > 0) params.append("min_rating", filters.minRating.toString());
    if (filters.category) params.append("category", filters.category);
    if (filters.hasFinancialAid) params.append("has_financial_aid", "true");
    if (filters.showVerifiedOnly) params.append("verification_status", "true");
    
    // Add user coordinates if available and using location
    if (filters.useLocationDistance && userCoordinates) {
      params.append("lat", userCoordinates.lat.toString());
      params.append("lng", userCoordinates.lng.toString());
      params.append("radius", filters.radius?.toString() || "10");
    }
    
    // Add selected features
    if (filters.features && filters.features.length > 0) {
      for (const feature of filters.features) {
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
  
  // Handle quick search selection (from recent or popular searches)
  const handleQuickSearch = (search: string) => {
    setSearchQuery(search);
    saveRecentSearch(search);
    // Hide the dropdown
    setShowRecentSearches(false);
    // Trigger search with the new query
    const params = new URLSearchParams();
    params.append("q", search); // Using 'q' as the server expects this parameter name
    navigate(`/discover?${params.toString()}`);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setFilters({
      location: "",
      curriculum: "",
      gradeLevel: "",
      features: [],
      minRating: 0,
      hasFinancialAid: false,
      useLocationDistance: false,
      radius: 10,
      category: "",
      showVerifiedOnly: false
    });
  };
  
  // Get user's current location
  const getUserLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Enable location-based search
          setFilters({
            ...filters,
            useLocationDistance: true
          });
        },
        (error) => {
          console.error("Error finding location:", error);
          setLocationError(`Location error: ${error.message}`);
          setFilters({
            ...filters,
            useLocationDistance: false
          });
        }
      );
    } else {
      setLocationError("Your browser doesn't support geolocation");
      setFilters({
        ...filters,
        useLocationDistance: false
      });
    }
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

  // Helper function to calculate active filters count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.curriculum) count++;
    if (filters.gradeLevel) count++;
    if (filters.features && filters.features.length > 0) count += filters.features.length;
    if (filters.minRating && filters.minRating > 0) count++;
    if (filters.hasFinancialAid) count++;
    if (filters.useLocationDistance) count++;
    if (filters.showVerifiedOnly) count++;
    if (filters.category) count++;
    
    return count;
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100 to-blue-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-blue-200 transition-all duration-300 hover:shadow-blue-100/40">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-full">
              <School className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center">
              <span className="mr-2">Smart School Search</span>
              <SimpleTooltip content="Our advanced search feature helps you discover schools based on your exact preferences">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </SimpleTooltip>
            </h2>
            <div className="p-2 bg-blue-50 rounded-full">
              <Building className="h-7 w-7 text-primary" />
            </div>
          </div>
          
          {/* Main search area - simplified version */}
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 mb-4">
            <div className="w-full md:w-3/4">
              <div className="relative rounded-md shadow-sm h-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={handleKeyPress}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pl-10 pr-12 py-3 h-full"
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
                            <TrendingUp className="h-3 w-3 text-yellow-400" />
                            <span className="truncate">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/4">
              <Button 
                onClick={handleSearch}
                className="w-full h-full bg-primary hover:bg-primary/90 transition-all duration-300"
              >
                <Search className="h-4 w-4 mr-2" /> 
                Search Schools
              </Button>
            </div>
          </div>
          
          {/* Location and filter options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={showAdvanced ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-sm flex items-center",
                  showAdvanced ? "" : "text-gray-600 hover:bg-blue-50"
                )}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Filter className="h-3 w-3 mr-1" />
                {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
                {!showAdvanced && getActiveFilterCount() > 0 && (
                  <Badge className="ml-1 bg-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-sm flex items-center",
                  filters.useLocationDistance ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-600"
                )}
                onClick={getUserLocation}
                disabled={filters.useLocationDistance}
              >
                <MapPinned className="h-3 w-3 mr-1" />
                {filters.useLocationDistance ? "Using Your Location" : "Use My Location"}
              </Button>
              
              {locationError && (
                <span className="text-xs text-red-500">
                  {locationError}
                </span>
              )}
              
              {(searchQuery || getActiveFilterCount() > 0) && (
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
            
            {filters.features && filters.features.length > 0 && (
              <div className="flex items-center text-sm text-gray-500">
                <Badge variant="outline" className="bg-gray-50">
                  {filters.features.length} filter{filters.features.length > 1 ? 's' : ''} applied
                </Badge>
              </div>
            )}
          </div>
          
          {/* Advanced filters section */}
          {showAdvanced && (
            <div 
              ref={filtersRef}
              className="mt-4 bg-blue-50/50 p-4 sm:p-6 rounded-lg animate-in fade-in duration-200 border border-blue-100"
            >
              <Tabs defaultValue={filterView} onValueChange={(v) => setFilterView(v as 'simple' | 'advanced')}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full max-w-xs grid-cols-2">
                    <TabsTrigger value="simple">Basic Filters</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
                  </TabsList>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset All
                  </Button>
                </div>
                
                <TabsContent value="simple" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <Select
                          value={filters.location}
                          onValueChange={(value) => handleFilterChange("location", value)}
                        >
                          <option value="">All locations</option>
                          {LOCATIONS.map((loc) => (
                            <option key={loc.value} value={loc.value}>
                              {loc.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Curriculum
                        </label>
                        <Select
                          value={filters.curriculum}
                          onValueChange={(value) => handleFilterChange("curriculum", value)}
                        >
                          <option value="">All curricula</option>
                          {SCHOOL_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade Level
                        </label>
                        <Select
                          value={filters.gradeLevel}
                          onValueChange={(value) => handleFilterChange("gradeLevel", value)}
                        >
                          <option value="">All grades</option>
                          {GRADE_LEVELS.map((grade) => (
                            <option key={grade.value} value={grade.value}>
                              {grade.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Verified Schools Only
                          </label>
                          <Switch
                            checked={filters.showVerifiedOnly}
                            onCheckedChange={(checked) => handleFilterChange("showVerifiedOnly", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Financial Aid Available
                          </label>
                          <Switch
                            checked={filters.hasFinancialAid}
                            onCheckedChange={(checked) => handleFilterChange("hasFinancialAid", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-6">
                  {/* Location with distance settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 flex justify-between">
                          <span>Minimum Rating</span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                            {filters.minRating}/5
                          </span>
                        </label>
                        <Slider
                          defaultValue={[filters.minRating || 0]}
                          min={0}
                          max={5}
                          step={0.5}
                          className="mt-2"
                          onValueChange={(value) => handleFilterChange("minRating", value[0])}
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Use Current Location
                          </label>
                          <Switch
                            checked={filters.useLocationDistance}
                            onCheckedChange={(checked) => {
                              handleFilterChange("useLocationDistance", checked);
                              if (checked && !userCoordinates) {
                                getUserLocation();
                              }
                            }}
                          />
                        </div>
                        
                        {locationError && (
                          <p className="text-xs text-red-500 mb-2">{locationError}</p>
                        )}
                        
                        {filters.useLocationDistance && (
                          <div className="mt-2">
                            <label className="text-xs text-gray-600 flex justify-between">
                              <span>Distance (miles): {filters.radius}</span>
                            </label>
                            <Slider
                              defaultValue={[filters.radius || 10]}
                              min={1}
                              max={50}
                              step={1}
                              className="mt-2"
                              onValueChange={(value) => handleFilterChange("radius", value[0])}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {schoolCategories && schoolCategories.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            School Categories
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {schoolCategories.map((category: any) => (
                              <Badge 
                                key={category.id}
                                variant={filters.features?.includes(`category_${category.id}`) ? "default" : "outline"}
                                className={cn(
                                  "transition-all duration-300 py-1.5",
                                  filters.features?.includes(`category_${category.id}`) 
                                    ? 'bg-primary/90 hover:bg-primary' 
                                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-200'
                                )}
                                style={category.color ? {
                                  borderColor: filters.features?.includes(`category_${category.id}`) ? undefined : category.color,
                                  color: filters.features?.includes(`category_${category.id}`) ? undefined : category.color
                                } : undefined}
                                clickable
                                onClick={() => handleFeatureToggle(`category_${category.id}`)}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Verified Schools Only
                          </label>
                          <Switch
                            checked={filters.showVerifiedOnly}
                            onCheckedChange={(checked) => handleFilterChange("showVerifiedOnly", checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Financial Aid Available
                          </label>
                          <Switch
                            checked={filters.hasFinancialAid}
                            onCheckedChange={(checked) => handleFilterChange("hasFinancialAid", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Features
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {FEATURES.map((feature) => (
                        <div 
                          key={feature.value} 
                          className={cn(
                            "border rounded-md p-2 flex items-center space-x-2 cursor-pointer transition-all",
                            filters.features?.includes(feature.value) 
                              ? "bg-primary/10 border-primary/30 text-primary" 
                              : "hover:bg-gray-50 border-gray-200"
                          )}
                          onClick={() => handleFeatureToggle(feature.value)}
                        >
                          {filters.features?.includes(feature.value) ? (
                            <CircleCheck className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <CircleDashed className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          )}
                          <SimpleTooltip content={feature.description}>
                            <span className="text-sm truncate">{feature.label}</span>
                          </SimpleTooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
                
                <Button 
                  onClick={handleSearch}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 shadow-sm"
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

export default EnhancedSearchBanner;