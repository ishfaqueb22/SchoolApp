import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSearchParams } from "../lib/use-search-params";
import SchoolCard from "@/components/schools/SchoolCard";
import PageHeader from "@/components/layout/PageHeader";
import CategoryFilters, { CategoryFilters as FiltersType } from "@/components/schools/CategoryFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { School } from "@/lib/types";

const CategoryPage = () => {
  const [location, navigate] = useLocation();
  const [urlParams, setUrlParams] = useSearchParams();
  const categoryName = urlParams.get("category") || "";
  const [categoryId, setCategoryId] = useState<number | null>(null);
  
  // State for filters with updated parameter names
  const [filters, setFilters] = useState<FiltersType>({});

  // Fetch all categories to find the ID of the selected category
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories-count'],
    onSuccess: (data) => {
      const category = data.find((cat: any) => cat.name === categoryName);
      if (category) {
        setCategoryId(category.id);
      }
    }
  });

  // Get the current category details
  const currentCategory = useMemo(() => {
    if (!categories) return null;
    return categories.find((cat: any) => cat.name === categoryName) || null;
  }, [categories, categoryName]);

  // Calculate search parameters for filtering
  const searchParams = useMemo(() => {
    return {
      category: categoryId,
      ...filters,
      // Always include approved status
      approvalStatus: 'approved'
    };
  }, [filters, categoryId]);
  
  // Fetch schools in the selected category with filters
  const { 
    data: schoolsResponse, 
    isLoading: schoolsLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/schools/search', searchParams],
    queryFn: async () => {
      // Convert searchParams object to URLSearchParams
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      console.log("Searching with params:", Object.fromEntries(queryParams.entries()));
      
      const response = await fetch(`/api/schools/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      return response.json();
    },
    enabled: !!categoryId, // Only run the query if categoryId is available
    onSuccess: (data) => {
      console.log("Schools for category loaded:", data);
    },
    onError: (err) => {
      console.error("Error fetching schools for category:", err);
    }
  });
  
  // Extract the schools from the response
  const schoolsInCategory = schoolsResponse?.schools || [];

  // Loading state
  if (categoriesLoading || schoolsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-2/3 max-w-md mb-6" />
        <Skeleton className="h-6 w-full max-w-lg mb-10" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !categoryName) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Category Not Found" 
          subtitle="We couldn't find the category you're looking for. Please try another category or browse all schools."
        />
        <div className="mt-6">
          <Button onClick={() => navigate("/discover")}>
            Browse All Categories
          </Button>
        </div>
      </div>
    );
  }

  // No need to filter schools as filtering is done by the API
  const filteredSchools = useMemo(() => {
    return schoolsInCategory || [];
  }, [schoolsInCategory]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FiltersType) => {
    // Log filter changes for debugging
    console.log("Filter changed:", newFilters);
    setFilters(newFilters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    console.log("Clearing all filters");
    setFilters({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title={`${categoryName} Schools`} 
        subtitle={currentCategory?.description || `Browse schools offering ${categoryName} education`}
      />
      
      {/* Filter Component */}
      <CategoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        clearFilters={clearFilters}
        categoryId={categoryId}
      />
      
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredSchools.length} {filteredSchools.length === 1 ? 'school' : 'schools'}
        {(filters.q || filters.curriculum_type || filters.max_tuition || filters.min_rating || 
          filters.has_financial_aid || filters.location || filters.grade_level || 
          filters.type || filters.verification_status) && 
          ' matching your filters'}
      </div>
      
      {filteredSchools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schools Found</h3>
          <p className="text-gray-600 mb-6">
            {schoolsInCategory?.length > 0 
              ? "No schools match your current filters. Try adjusting or clearing your filters." 
              : "We don't have any schools in this category yet."}
          </p>
          {schoolsInCategory?.length > 0 ? (
            <Button onClick={clearFilters}>
              Clear All Filters
            </Button>
          ) : (
            <Button onClick={() => navigate("/discover")}>
              Browse Other Categories
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school: School) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;