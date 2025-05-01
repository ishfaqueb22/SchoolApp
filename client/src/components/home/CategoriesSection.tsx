import { Link } from "wouter";
import CategoryCard from "@/components/schools/CategoryCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryType } from "@/lib/types";

const CategoriesSection = () => {
  // Fetch categories with counts from API
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/categories-count'],
    select: (data) => {
      // Transform backend data to match CategoryType
      return data.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        image: category.icon ? `https://images.unsplash.com/photo-${category.icon}` : "https://images.unsplash.com/photo-1571260899304-425eee4c7efd",
        count: category.school_count || 0,
        color: category.color && category.color.startsWith('#') ? 
          ['#4285F4', '#EA4335', '#34A853', '#FBBC05'].indexOf(category.color) >= 0 ? 
            ['primary', 'blue', 'green', 'purple'][['#4285F4', '#EA4335', '#34A853', '#FBBC05'].indexOf(category.color)] : 
            'primary' : 
          category.color || 'primary'
      }));
    }
  });
  
  // For our vertical layout, show just top 4 categories
  const displayCategories = categories?.slice(0, 4) || [];
  
  // Loading state
  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </section>
    );
  }
  
  // Error state
  if (error) {
    console.error("Error fetching categories:", error);
    return (
      <section>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Unable to load categories. Please try again later.</p>
        </div>
      </section>
    );
  }
  
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Browse by Category</h3>
        <Link href="/discover" className="text-primary-600 hover:text-primary-500 text-sm font-medium flex items-center">
          All categories
        </Link>
      </div>
      
      <div className="space-y-3">
        {displayCategories.map((category: CategoryType) => (
          <CategoryCard key={category.id} category={category} compact={true} />
        ))}
        
        <div className="text-center mt-4">
          <Link href="/discover">
            <Button variant="outline" className="w-full">
              View All Categories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
