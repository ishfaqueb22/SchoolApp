import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import SelectDropdown from "@/components/schools/SelectDropdown";
import { 
  Bookmark, 
  CheckCircle2, 
  Filter, 
  MapPin, 
  Star, 
  School, 
  DollarSign,
  BookOpen
} from "lucide-react";

interface CategoryFiltersProps {
  onFilterChange: (filters: CategoryFilters) => void;
  clearFilters: () => void;
  filters: CategoryFilters;
  categoryId?: number;
}

export interface CategoryFilters {
  q?: string;               // Search term
  curriculum_type?: string; // Curriculum type
  max_tuition?: string;     // Maximum tuition
  min_rating?: string;      // Minimum rating
  has_financial_aid?: string; // Financial aid availability
  location?: string;        // School location
  grade_level?: string;     // Grade level 
  type?: string;            // School type
  verification_status?: string; // Verification status
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({ 
  onFilterChange, 
  clearFilters, 
  filters,
  categoryId
}) => {
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Calculate active filters
  useEffect(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.curriculum_type) count++;
    if (filters.max_tuition) count++;
    if (filters.min_rating) count++;
    if (filters.has_financial_aid) count++;
    if (filters.location) count++;
    if (filters.grade_level) count++;
    if (filters.type) count++;
    if (filters.verification_status) count++;
    setActiveFilterCount(count);
  }, [filters]);

  // Fetch curriculum types from the database
  const { data: curriculumTypes } = useQuery({
    queryKey: ['/api/filter-data/curriculum-types'],
    select: (data) => {
      return data || defaultCurriculumTypes;
    },
    // Fallback to default options if API not available yet
    onError: () => {
      console.warn("Couldn't fetch curriculum types, using defaults");
      return defaultCurriculumTypes;
    }
  });

  // Fetch locations from the database
  const { data: locations } = useQuery({
    queryKey: ['/api/filter-data/locations'],
    select: (data) => {
      return data || defaultLocations;
    },
    // Fallback to default options if API not available yet
    onError: () => {
      console.warn("Couldn't fetch locations, using defaults");
      return defaultLocations;
    }
  });

  // Fetch grade levels from the database
  const { data: gradeLevels } = useQuery({
    queryKey: ['/api/filter-data/grade-levels'],
    select: (data) => {
      return data || defaultGradeLevels;
    },
    // Fallback to default options if API not available yet
    onError: () => {
      console.warn("Couldn't fetch grade levels, using defaults");
      return defaultGradeLevels;
    }
  });

  // Fetch school types from the database
  const { data: schoolTypes } = useQuery({
    queryKey: ['/api/filter-data/school-types'],
    select: (data) => {
      return data || defaultSchoolTypes;
    },
    // Fallback to default options if API not available yet
    onError: () => {
      console.warn("Couldn't fetch school types, using defaults");
      return defaultSchoolTypes;
    }
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  // Handle checkbox/switch change
  const handleSwitchChange = (name: string, checked: boolean) => {
    onFilterChange({
      ...filters,
      [name]: checked ? "true" : undefined
    });
  };

  // Apply filter quick action
  const applyQuickFilter = (filterType: string, value: string) => {
    onFilterChange({
      ...filters,
      [filterType]: value
    });
  };

  // Remove a single filter by name
  const removeFilter = (filterName: string) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[filterName as keyof CategoryFilters];
    onFilterChange(updatedFilters);
  };

  // Default curriculum options if API data is not available
  const defaultCurriculumTypes = [
    { value: "Cambridge", label: "Cambridge" },
    { value: "International Baccalaureate", label: "International Baccalaureate" },
    { value: "National", label: "National" },
    { value: "Montessori", label: "Montessori" }
  ];

  // Default location options if API data is not available
  const defaultLocations = [
    { value: "Lahore", label: "Lahore" },
    { value: "Karachi", label: "Karachi" },
    { value: "Islamabad", label: "Islamabad" },
    { value: "Rawalpindi", label: "Rawalpindi" }
  ];

  // Default grade level options if API data is not available
  const defaultGradeLevels = [
    { value: "preschool", label: "Preschool" },
    { value: "elementary", label: "Elementary" },
    { value: "middle", label: "Middle School" },
    { value: "high", label: "High School" },
    { value: "college", label: "College" }
  ];

  // Default school type options if API data is not available
  const defaultSchoolTypes = [
    { value: "Montessori", label: "Montessori" },
    { value: "STEM", label: "STEM" },
    { value: "Arts", label: "Arts" },
    { value: "International", label: "International" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Quick actions bar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-primary-600" />
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="outline" className="ml-2 bg-primary-50 text-primary-700 border-primary-200">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </Button>
      </div>

      {/* Quick filter chips */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={filters.min_rating === "4" ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => filters.min_rating === "4" ? removeFilter('min_rating') : applyQuickFilter('min_rating', "4")}
          >
            <Star className="h-3 w-3 mr-1 fill-current" /> 4+ Stars
          </Badge>
          
          <Badge 
            variant={filters.has_financial_aid === "true" ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => filters.has_financial_aid === "true" ? removeFilter('has_financial_aid') : applyQuickFilter('has_financial_aid', "true")}
          >
            <DollarSign className="h-3 w-3 mr-1" /> Financial Aid
          </Badge>
          
          <Badge 
            variant={filters.verification_status === "true" ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => filters.verification_status === "true" ? removeFilter('verification_status') : applyQuickFilter('verification_status', "true")}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
          </Badge>
          
          <Badge 
            variant={filters.grade_level === "elementary" ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => filters.grade_level === "elementary" ? removeFilter('grade_level') : applyQuickFilter('grade_level', "elementary")}
          >
            <School className="h-3 w-3 mr-1" /> Elementary
          </Badge>
          
          <Badge 
            variant={filters.type === "Montessori" ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => filters.type === "Montessori" ? removeFilter('type') : applyQuickFilter('type', "Montessori")}
          >
            <BookOpen className="h-3 w-3 mr-1" /> Montessori
          </Badge>
        </div>
      </div>

      <div className="p-4">
        {/* Search input */}
        <div className="mb-4">
          <Label htmlFor="searchTerm" className="text-sm font-medium">
            Search by name or keywords
          </Label>
          <div className="relative mt-1">
            <Input
              id="q"
              name="q"
              value={filters.q || ""}
              onChange={handleInputChange}
              placeholder="E.g., international, grammar..."
              className="pr-8"
            />
            {filters.q && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => removeFilter('q')}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="advanced-filters">
          <AccordionItem value="advanced-filters" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2">
              Advanced Filters
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Curriculum Type */}
                <div>
                  <Label htmlFor="curriculum" className="text-sm font-medium flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-primary-600" />
                    Curriculum
                  </Label>
                  <SelectDropdown
                    options={curriculumTypes || defaultCurriculumTypes}
                    value={filters.curriculum_type || ""}
                    onChange={(value) => handleSelectChange("curriculum_type", value)}
                    placeholder="Select curriculum"
                    defaultOption="Any Curriculum"
                  />
                </div>

                {/* School Type */}
                <div>
                  <Label htmlFor="type" className="text-sm font-medium flex items-center">
                    <School className="h-4 w-4 mr-1 text-primary-600" />
                    School Type
                  </Label>
                  <SelectDropdown
                    options={schoolTypes || defaultSchoolTypes}
                    value={filters.type || ""}
                    onChange={(value) => handleSelectChange("type", value)}
                    placeholder="Select school type"
                    defaultOption="Any Type"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary-600" />
                    Location
                  </Label>
                  <SelectDropdown
                    options={locations || defaultLocations}
                    value={filters.location || ""}
                    onChange={(value) => handleSelectChange("location", value)}
                    placeholder="Select location"
                    defaultOption="Any Location"
                  />
                </div>

                {/* Grade Level */}
                <div>
                  <Label htmlFor="gradeLevel" className="text-sm font-medium flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-primary-600" />
                    Grade Level
                  </Label>
                  <SelectDropdown
                    options={gradeLevels || defaultGradeLevels}
                    value={filters.grade_level || ""}
                    onChange={(value) => handleSelectChange("grade_level", value)}
                    placeholder="Select grade level"
                    defaultOption="Any Grade"
                  />
                </div>

                {/* Tuition Range */}
                <div>
                  <Label htmlFor="tuitionRange" className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-primary-600" />
                    Tuition Range
                  </Label>
                  <SelectDropdown
                    options={[
                      { value: "100000", label: "Below PKR 100,000" },
                      { value: "200000", label: "Below PKR 200,000" },
                      { value: "300000", label: "Below PKR 300,000" }
                    ]}
                    value={filters.max_tuition || ""}
                    onChange={(value) => handleSelectChange("max_tuition", value)}
                    placeholder="Select tuition range"
                    defaultOption="Any Tuition Range"
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label htmlFor="rating" className="text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1 text-primary-600" />
                    Minimum Rating
                  </Label>
                  <SelectDropdown
                    options={[
                      { value: "3", label: "3+ Stars" },
                      { value: "4", label: "4+ Stars" },
                      { value: "4.5", label: "4.5+ Stars" }
                    ]}
                    value={filters.min_rating || ""}
                    onChange={(value) => handleSelectChange("min_rating", value)}
                    placeholder="Select minimum rating"
                    defaultOption="Any Rating"
                  />
                </div>
                
                {/* Toggle Switches */}
                <div className="col-span-1 md:col-span-2 space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_financial_aid" className="text-sm font-medium flex items-center cursor-pointer">
                      <DollarSign className="h-4 w-4 mr-1 text-primary-600" />
                      Financial Aid Available
                    </Label>
                    <Switch
                      id="has_financial_aid"
                      checked={filters.has_financial_aid === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("has_financial_aid", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="verification_status" className="text-sm font-medium flex items-center cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-primary-600" />
                      Verified Schools Only
                    </Label>
                    <Switch
                      id="verification_status"
                      checked={filters.verification_status === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("verification_status", checked)}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end mt-4">
          <Button 
            onClick={clearFilters}
            variant="outline" 
            size="sm" 
            className="mr-2"
          >
            Reset
          </Button>
          <Button 
            type="submit"
            size="sm"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilters;