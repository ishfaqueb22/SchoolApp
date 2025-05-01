import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolCard from "@/components/schools/SchoolCard";
import SelectDropdown from "@/components/schools/SelectDropdown";
import { School, FilterOptions } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { LOCATIONS, SCHOOL_TYPES, GRADE_LEVELS, FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { 
  Search, Filter, MapPin, SlidersHorizontal, Grid, List, 
  ChevronLeft, ChevronRight, BadgeCheck, Star,
  ArrowUpDown, X, RefreshCw, Building, MapPinned, User,
  CircleCheck, CircleDashed, CircleX, Moon, Sun
} from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";

interface ExtendedFilterOptions extends FilterOptions {
  minRating?: number;
  maxTuition?: string;
  hasFinancialAid?: boolean;
  useLocationDistance?: boolean;
  radius?: number;
  category?: string;
  showVerifiedOnly?: boolean;
}

const Discover = () => {
  // Load URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearchQuery = urlParams.get('query') || "";
  const initialLocation = urlParams.get('location') || "";
  const initialCurriculum = urlParams.get('curriculum') || "";
  const initialGradeLevel = urlParams.get('gradeLevel') || "";
  const initialFeatures = urlParams.getAll('features') || [];
  
  // UI State
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [filterView, setFilterView] = useState<'simple' | 'advanced'>(
    initialFeatures.length > 0 ? 'advanced' : 'simple'
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating-desc"); // default sort by rating high to low
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [userCoordinates, setUserCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Advanced Filters
  const [filters, setFilters] = useState<ExtendedFilterOptions>({
    location: initialLocation,
    curriculum: initialCurriculum,
    gradeLevel: initialGradeLevel,
    features: initialFeatures,
    minRating: 0,
    hasFinancialAid: false,
    useLocationDistance: false,
    radius: 10,
    showVerifiedOnly: false
  });
  
  // Get school categories for filter options
  const { data: categories } = useQuery({
    queryKey: ['/api/school-categories'],
    staleTime: 300000, // 5 minutes
  });
  
  // Items per page
  const limit = 9;
  
  // Calculate offset for pagination
  const offset = (currentPage - 1) * limit;

  // Calculate number of active filters for badge display
  useEffect(() => {
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
    
    setActiveFilterCount(count);
  }, [filters]);

  // Get user's location if needed
  useEffect(() => {
    if (filters.useLocationDistance && !userCoordinates) {
      getUserLocation();
    }
  }, [filters.useLocationDistance]);

  // Prepare API query parameters based on filters
  const getQueryParams = () => {
    const params: Record<string, string> = {
      limit: limit.toString(),
      offset: offset.toString()
    };

    // Only add parameters with values
    if (searchQuery) params.q = searchQuery; // Using 'q' as the server expects this parameter name
    if (filters.location) params.location = filters.location;
    if (filters.curriculum) params.curriculum_type = filters.curriculum;
    if (filters.gradeLevel) params.grade_level = filters.gradeLevel;
    if (filters.minRating && filters.minRating > 0) params.min_rating = filters.minRating.toString();
    if (filters.hasFinancialAid) params.has_financial_aid = "true";
    if (filters.showVerifiedOnly) params.verification_status = "true";
    if (filters.category) params.category = filters.category;
    
    // Include features if any are selected
    if (filters.features && filters.features.length > 0) {
      params.features = filters.features.join(',');
    }
    
    // User location-based search
    if (filters.useLocationDistance && userCoordinates) {
      params.lat = userCoordinates.lat.toString();
      params.lng = userCoordinates.lng.toString();
      params.radius = filters.radius?.toString() || "10";
    }
    
    // Add sorting
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      params.sort_field = field;
      params.sort_direction = direction;
    }
    
    return params;
  };

  // Fetch schools data with filters
  const { 
    data, 
    isLoading, 
    error,
    isRefetching,
    refetch
  } = useQuery({
    queryKey: ['/api/schools/search', filters, searchQuery, currentPage, sortBy],
    queryFn: async () => {
      const queryParams = new URLSearchParams(getQueryParams());
      // Update URL with search parameters without navigating
      const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
      
      const response = await fetch(`/api/schools/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    keepPreviousData: true // Keep previous data while loading new data
  });

  // Extract schools and pagination metadata
  const schools = data?.schools || [];
  const totalSchools = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalSchools / limit);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  // Scroll to filters section when it opens
  useEffect(() => {
    if (showFilters && filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showFilters]);

  const handleFilterChange = (filterName: string, value: string | number | boolean) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
  };

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

  const handleRatingChange = (value: number[]) => {
    setFilters({
      ...filters,
      minRating: value[0]
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const resetFilters = () => {
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
    setSearchQuery("");
    setSortBy("rating-desc");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Get user's location
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

  // Helper function to calculate active filter badges
  const renderActiveFilterBadges = () => {
    const badges = [];
    
    if (filters.location) {
      badges.push(
        <Badge key="location" variant="secondary" className="bg-blue-100 text-blue-700 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {LOCATIONS.find(l => l.value === filters.location)?.label || filters.location}
          <button onClick={() => handleFilterChange("location", "")}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.curriculum) {
      badges.push(
        <Badge key="curriculum" variant="secondary" className="bg-purple-100 text-purple-700 flex items-center gap-1">
          <Building className="h-3 w-3" />
          {SCHOOL_TYPES.find(t => t.value === filters.curriculum)?.label || filters.curriculum}
          <button onClick={() => handleFilterChange("curriculum", "")}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.gradeLevel) {
      badges.push(
        <Badge key="gradeLevel" variant="secondary" className="bg-green-100 text-green-700 flex items-center gap-1">
          <User className="h-3 w-3" />
          {GRADE_LEVELS.find(g => g.value === filters.gradeLevel)?.label || filters.gradeLevel}
          <button onClick={() => handleFilterChange("gradeLevel", "")}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.minRating && filters.minRating > 0) {
      badges.push(
        <Badge key="rating" variant="secondary" className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <Star className="h-3 w-3" />
          Min Rating: {filters.minRating}
          <button onClick={() => handleFilterChange("minRating", 0)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.hasFinancialAid) {
      badges.push(
        <Badge key="financialAid" variant="secondary" className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
          Financial Aid
          <button onClick={() => handleFilterChange("hasFinancialAid", false)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.useLocationDistance) {
      badges.push(
        <Badge key="nearMe" variant="secondary" className="bg-indigo-100 text-indigo-700 flex items-center gap-1">
          <MapPinned className="h-3 w-3" />
          Within {filters.radius} miles
          <button onClick={() => handleFilterChange("useLocationDistance", false)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (filters.showVerifiedOnly) {
      badges.push(
        <Badge key="verified" variant="secondary" className="bg-blue-100 text-blue-700 flex items-center gap-1">
          <BadgeCheck className="h-3 w-3" />
          Verified Only
          <button onClick={() => handleFilterChange("showVerifiedOnly", false)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    // Add feature badges (limit to 3 visible)
    if (filters.features && filters.features.length > 0) {
      const featuresToShow = filters.features.slice(0, 2);
      featuresToShow.forEach(feature => {
        badges.push(
          <Badge key={feature} variant="secondary" className="bg-pink-100 text-pink-700 flex items-center gap-1">
            <CircleCheck className="h-3 w-3" />
            {FEATURES.find(f => f.value === feature)?.label || feature}
            <button onClick={() => handleFeatureToggle(feature)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      });
      
      // Add count badge if more features are selected
      if (filters.features.length > 2) {
        badges.push(
          <Badge key="more-features" variant="secondary" className="bg-gray-100 text-gray-700">
            +{filters.features.length - 2} more features
          </Badge>
        );
      }
    }
    
    return badges;
  };

  return (
    <>
      <Helmet>
        <title>Discover Schools | SmartSchool Finder</title>
        <meta name="description" content="Search and filter schools based on your preferences. Find the perfect educational match for your child." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow bg-gray-50">
          {/* Two-column layout with filters sidebar on large screens */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar filters - only visible on larger screens when enabled */}
              {filterSidebarOpen && (
                <div className="hidden md:block md:w-1/4 lg:w-1/5">
                  <div className="bg-white shadow-md rounded-lg p-4 sticky top-20">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-gray-800">Filters</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFilterSidebarOpen(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
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
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Near Me
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
                          <p className="text-xs text-red-500 mt-1">{locationError}</p>
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
                      
                      <div>
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
                      
                      <div>
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
                      
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Financial Aid Available
                        </label>
                        <Switch
                          checked={filters.hasFinancialAid}
                          onCheckedChange={(checked) => handleFilterChange("hasFinancialAid", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Verified Schools Only
                        </label>
                        <Switch
                          checked={filters.showVerifiedOnly}
                          onCheckedChange={(checked) => handleFilterChange("showVerifiedOnly", checked)}
                        />
                      </div>
                      
                      {categories && categories.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            School Categories
                          </label>
                          <Select
                            value={filters.category || ""}
                            onValueChange={(value) => handleFilterChange("category", value)}
                          >
                            <option value="">All categories</option>
                            {categories.map((category: any) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Features
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {FEATURES.map((feature) => (
                            <div key={feature.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sidebar-feature-${feature.value}`}
                                checked={filters.features?.includes(feature.value) || false}
                                onCheckedChange={() => handleFeatureToggle(feature.value)}
                              />
                              <label
                                htmlFor={`sidebar-feature-${feature.value}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {feature.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-6"
                        onClick={resetFilters}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main content area */}
              <div className={filterSidebarOpen ? "md:w-3/4 lg:w-4/5" : "w-full"}>
                {/* Search header */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Discover Schools</h1>
                    
                    {/* Filter sidebar toggle - only visible on larger screens */}
                    <Button
                      variant="outline"
                      className="hidden md:flex items-center gap-2"
                      onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {filterSidebarOpen ? "Hide Sidebar" : "Show Filters Sidebar"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1 flex">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Search schools by name, location, or curriculum"
                        className="pl-10 rounded-r-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            refetch();
                          }
                        }}
                      />
                      <Button 
                        className="rounded-l-none" 
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                      >
                        {isLoading || isRefetching ? (
                          <span className="inline-flex items-center">
                            <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                            Search
                          </span>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant={showFilters ? "default" : "outline"}
                        className="md:w-auto flex items-center justify-center"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? "Hide Filters" : "Filters"}
                        {activeFilterCount > 0 && !showFilters && (
                          <span className="ml-2 bg-primary-foreground text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                      
                      <div className="hidden sm:flex items-center space-x-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="icon"
                          onClick={() => setViewMode("grid")}
                          className="w-10 h-10"
                          title="Grid View"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "outline"}
                          size="icon"
                          onClick={() => setViewMode("list")}
                          className="w-10 h-10"
                          title="List View"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active filters section */}
                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {renderActiveFilterBadges()}
                      
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={resetFilters}
                          className="text-xs flex items-center gap-1 text-gray-600 h-6"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reset all
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Expandable filters panel */}
                  {showFilters && (
                    <div 
                      ref={filtersRef}
                      className="mt-6 bg-gray-50 p-5 rounded-lg animate-in fade-in duration-200 border border-gray-200"
                    >
                      <Tabs defaultValue={filterView} onValueChange={(v) => setFilterView(v as 'simple' | 'advanced')}>
                        <div className="flex items-center justify-between mb-4">
                          <TabsList className="grid w-full max-w-xs grid-cols-2">
                            <TabsTrigger asChild value="simple">
                              <button>Basic Filters</button>
                            </TabsTrigger>
                            <TabsTrigger asChild value="advanced">
                              <button>Advanced Filters</button>
                            </TabsTrigger>
                          </TabsList>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={resetFilters}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Reset All
                          </Button>
                        </div>
                        
                        <TabsContent value="simple" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <SelectDropdown
                                options={LOCATIONS}
                                value={filters.location || ""}
                                onChange={(value) => handleFilterChange("location", value)}
                                placeholder="Select location"
                                defaultOption="All locations"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Curriculum
                              </label>
                              <SelectDropdown
                                options={SCHOOL_TYPES}
                                value={filters.curriculum || ""}
                                onChange={(value) => handleFilterChange("curriculum", value)}
                                placeholder="Select curriculum"
                                defaultOption="All curricula"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grade Level
                              </label>
                              <SelectDropdown
                                options={GRADE_LEVELS}
                                value={filters.gradeLevel || ""}
                                onChange={(value) => handleFilterChange("gradeLevel", value)}
                                placeholder="Select grade level"
                                defaultOption="All grades"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full flex items-center justify-center gap-2",
                                  filters.useLocationDistance ? "bg-blue-50 border-blue-200 text-blue-700" : ""
                                )}
                                onClick={() => {
                                  if (!filters.useLocationDistance) {
                                    getUserLocation();
                                  } else {
                                    handleFilterChange("useLocationDistance", false);
                                  }
                                }}
                              >
                                <MapPinned className="h-4 w-4" />
                                {filters.useLocationDistance ? "Using Your Location" : "Use My Location"}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full flex items-center justify-center gap-2",
                                  filters.showVerifiedOnly ? "bg-green-50 border-green-200 text-green-700" : ""
                                )}
                                onClick={() => handleFilterChange("showVerifiedOnly", !filters.showVerifiedOnly)}
                              >
                                <BadgeCheck className="h-4 w-4" />
                                {filters.showVerifiedOnly ? "Showing Verified Only" : "Show Verified Schools"}
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="advanced" className="space-y-6">
                          {/* First row - Basic filters */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
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
                              
                              <div className="mt-3">
                                <div className="flex items-center justify-between">
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
                                  <p className="text-xs text-red-500 mt-1">{locationError}</p>
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
                              
                              <div className="mt-3">
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
                            </div>
                            
                            <div>
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
                              
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Financial Aid Available
                                  </label>
                                  <Switch
                                    checked={filters.hasFinancialAid}
                                    onCheckedChange={(checked) => handleFilterChange("hasFinancialAid", checked)}
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Verified Schools Only
                                  </label>
                                  <Switch
                                    checked={filters.showVerifiedOnly}
                                    onCheckedChange={(checked) => handleFilterChange("showVerifiedOnly", checked)}
                                  />
                                </div>
                              </div>
                              
                              {categories && categories.length > 0 && (
                                <div className="mt-3">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School Categories
                                  </label>
                                  <SelectDropdown
                                    options={categories.map((category: any) => ({
                                      value: String(category.id),
                                      label: category.name
                                    }))}
                                    value={filters.category || ""}
                                    onChange={(value) => handleFilterChange("category", value)}
                                    placeholder="Select category"
                                    defaultOption="All categories"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Features section */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              School Features
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                    </div>
                  )}
                  
                  {/* Results count and sorting */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6">
                    <p className="text-gray-600 mb-2 sm:mb-0 flex items-center">
                      {isLoading || isRefetching ? (
                        <span className="inline-flex items-center">
                          <span className="mr-2 h-4 w-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin"></span>
                          Searching...
                        </span>
                      ) : totalSchools > 0 ? (
                        <span>Found <strong>{totalSchools}</strong> schools</span>
                      ) : (
                        'No schools found'
                      )}
                    </p>
                    <div className="flex items-center">
                      <label htmlFor="sort" className="text-sm text-gray-600 mr-2">Sort by:</label>
                      <SelectDropdown
                        options={[
                          { value: "rating-desc", label: "Rating (High to Low)" },
                          { value: "rating-asc", label: "Rating (Low to High)" },
                          { value: "name-asc", label: "Name (A-Z)" },
                          { value: "name-desc", label: "Name (Z-A)" },
                          { value: "tuition-asc", label: "Tuition (Low to High)" },
                          { value: "tuition-desc", label: "Tuition (High to Low)" },
                          ...(filters.useLocationDistance ? [{ value: "distance-asc", label: "Distance (Nearest First)" }] : [])
                        ]}
                        value={sortBy}
                        onChange={handleSortChange}
                        placeholder="Select sort order"
                        defaultOption="Rating (High to Low)"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Schools grid/list */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
                ) : schools.length > 0 ? (
                  <>
                    <div className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "flex flex-col space-y-4"}>
                      {schools.map((school: School) => (
                        <SchoolCard key={school.id} school={school} />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-10">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || isLoading}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages || isLoading}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No schools found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Try adjusting your search or filter criteria to find schools that match your requirements.
                    </p>
                    <div className="mt-6">
                      <Button onClick={resetFilters}>
                        Reset all filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Discover;
