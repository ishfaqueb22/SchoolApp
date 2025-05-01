import React, { useState, useEffect } from 'react';
import { useLocation, Link, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Rating } from '@/components/ui/rating';
import { School } from '@shared/schema';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { SearchIcon, BookOpenIcon, MapPinIcon, BuildingIcon, GraduationCapIcon } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 6;

export default function CategoryPage() {
  const [location, setLocation] = useLocation();
  // Check if we're using the new /category/:id route pattern
  const [matches, params] = useRoute('/category/:categoryId');
  
  // Get category ID if we're using the new route pattern
  const categoryId = matches ? params.categoryId : null;
  
  // Get category name if we're using the old querystring pattern
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const categoryNameFromQuery = queryParams.get('category') || '';
  
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState<string>(categoryNameFromQuery);
  
  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [categoryId, categoryNameFromQuery]);

  // Fetch all categories first
  const { data: allCategories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/school-categories'],
    queryFn: async () => {
      const res = await fetch('/api/school-categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Determine the current category based on either ID or name
  useEffect(() => {
    if (allCategories) {
      if (categoryId) {
        // If we have a category ID from the URL, find the category object
        const category = allCategories.find((cat: any) => cat.id.toString() === categoryId);
        if (category) {
          setCategoryName(category.name);
        }
      } else if (categoryNameFromQuery) {
        setCategoryName(categoryNameFromQuery);
      }
    }
  }, [allCategories, categoryId, categoryNameFromQuery]);

  const { data: schoolsData, isLoading, error } = useQuery({
    queryKey: ['/api/schools/category', categoryName, page],
    queryFn: async () => {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      // The API endpoint uses 'category' as parameter name, not 'categoryName'
      const res = await fetch(`/api/schools/category/${categoryName}?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
      if (!res.ok) throw new Error('Failed to fetch schools');
      return res.json();
    },
    enabled: !!categoryName,
  });

  // Get the current category data
  const currentCategory = allCategories?.find(
    (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );

  const totalPages = schoolsData ? Math.ceil(schoolsData.meta.total / ITEMS_PER_PAGE) : 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <MainLayout>
      <PageHeader
        title={`Schools with ${categoryName} Programs`}
        description={
          currentCategory
            ? currentCategory.description
            : `Discover schools that offer specialized ${categoryName} programs and curricula.`
        }
      />

      <div className="container mx-auto px-4 mb-12">
        {/* Category badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {loadingCategories ? (
            <>
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </>
          ) : (
            allCategories?.map((category: any) => (
              <Badge
                key={category.id}
                variant={category.name === categoryName ? 'default' : 'outline'}
                className="text-sm cursor-pointer py-2 px-4"
                style={{
                  backgroundColor: category.name === categoryName ? category.color : 'transparent',
                  borderColor: category.color,
                  color: category.name === categoryName ? 'white' : 'inherit',
                }}
                onClick={() => setLocation(`/category?category=${category.name}`)}
              >
                {category.name}
              </Badge>
            ))
          )}
        </div>

        {/* Schools grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(ITEMS_PER_PAGE)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="overflow-hidden flex flex-col">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-semibold text-red-500 mb-2">Error loading schools</h3>
            <p>Please try again later or contact support if the problem persists.</p>
          </div>
        ) : schoolsData?.schools.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p>There are no schools in this category yet. Please check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schoolsData?.schools.map((school: School) => (
                <Card key={school.id} className="overflow-hidden flex flex-col h-full">
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    {school.imageUrl ? (
                      <img
                        src={school.imageUrl}
                        alt={school.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <BookOpenIcon className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">{school.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{school.location}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Rating value={school.rating} max={5} readOnly />
                      <span className="ml-2 text-sm text-gray-600">{school.rating}/5</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-1">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {school.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {school.curriculumType}
                      </Badge>
                      {school.hasFinancialAid && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Financial Aid
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{school.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild className="w-full">
                      <Link to={`/school/${school.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}