import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLocation, useParams, useRoute } from 'wouter';
import { School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Interface for the school data
interface School {
  id: number;
  name: string;
  location: string;
  imageUrl?: string | null;
}

export function SchoolSelector() {
  const [location, setLocation] = useLocation();
  const { schoolId } = useParams();
  const currentSchoolId = schoolId || '';
  
  // Fetch schools that the current user has admin access to
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ['/api/admin/schools'],
    queryFn: async () => {
      const response = await fetch('/api/admin/schools', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      return response.json();
    }
  });
  
  // Get the currently selected school
  const currentSchool = schools?.find(school => school.id.toString() === currentSchoolId);
  
  // Handle school change
  const handleSchoolChange = (id: number) => {
    // Extract the current route pattern to determine what page we're on
    const pathSegments = location.split('/');
    const basePath = pathSegments.slice(0, 2).join('/'); // e.g., /admin
    
    // Check if we're on a school-specific page
    if (location.includes('/schools/')) {
      // We're already on a school-specific page, keep the same type of page but change school
      const currentPageType = pathSegments.slice(4).join('/'); // Get the page type (faculty, posts, etc.)
      
      if (currentPageType) {
        // Navigate to the same page type for the selected school
        setLocation(`${basePath}/schools/${id}/${currentPageType}`);
      } else {
        // We're on the school details page
        setLocation(`${basePath}/schools/${id}`);
      }
    } else {
      // We're not on a school-specific page, so just go to the school details page
      setLocation(`${basePath}/schools/${id}`);
    }
    
    // Refetch data for the new school
    queryClient.invalidateQueries({ queryKey: ['/api/admin/schools', id.toString()] });
    
    // Log for debugging
    console.log(`Switched to school ID: ${id}`);
  };
  
  if (isLoading || !schools || schools.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="ml-auto">
        <School className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }
  
  // If only one school, just show the school name
  if (schools.length === 1) {
    return (
      <Button variant="outline" size="sm" className="ml-auto">
        <School className="mr-2 h-4 w-4" />
        {schools[0].name}
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <School className="mr-2 h-4 w-4" />
          {currentSchool ? currentSchool.name : 'Select School'}
          <span className="sr-only">Toggle school menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Your Schools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {schools.map((school) => (
          <DropdownMenuItem
            key={school.id}
            onClick={() => handleSchoolChange(school.id)}
            className={school.id.toString() === currentSchoolId ? 'bg-accent' : ''}
          >
            {school.name}
            <span className="ml-2 text-xs text-muted-foreground">
              {school.location}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}