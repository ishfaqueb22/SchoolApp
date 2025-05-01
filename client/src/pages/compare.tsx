import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { School, Comparison } from "@/lib/types";
import { FEATURED_SCHOOLS } from "@/lib/mock-data";
import { Check, X, ChevronDown, ChevronRight, Save, AlertCircle, LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Criteria categories for comparison
const comparisonCategories = [
  {
    name: "General Information",
    criteria: ["type", "curriculumType", "gradeRange", "location"]
  },
  {
    name: "Academics",
    criteria: ["classSize", "rating"]
  },
  {
    name: "Financial",
    criteria: ["tuitionRange", "hasFinancialAid"]
  },
  {
    name: "Features",
    criteria: ["features"]
  }
];

// Human-readable labels for criteria
const criteriaLabels: Record<string, string> = {
  type: "School Type",
  curriculumType: "Curriculum",
  gradeRange: "Grade Range",
  location: "Location",
  classSize: "Class Size",
  rating: "Rating",
  tuitionRange: "Tuition",
  hasFinancialAid: "Financial Aid",
  features: "Features"
};

const Compare = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<number[]>([]);
  const [compareSchools, setCompareSchools] = useState<School[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "General Information": true,
    "Academics": true,
    "Financial": true,
    "Features": true
  });

  // Parse school IDs from URL if present or retrieve from localStorage
  useEffect(() => {
    // First try to get IDs from URL
    const params = new URLSearchParams(window.location.search);
    const schoolsParam = params.get("schools");
    
    if (schoolsParam) {
      const ids = schoolsParam.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      setSelectedSchoolIds(ids);
      
      // Save to localStorage
      localStorage.setItem('comparisonSchoolIds', JSON.stringify(ids));
    } else {
      // If not in URL, try to retrieve from localStorage
      const savedIds = localStorage.getItem('comparisonSchoolIds');
      if (savedIds) {
        try {
          const ids = JSON.parse(savedIds);
          if (Array.isArray(ids) && ids.length > 0) {
            setSelectedSchoolIds(ids);
            
            // Update URL to match localStorage
            const searchParams = new URLSearchParams();
            searchParams.set("schools", ids.join(","));
            setLocation(`/compare?${searchParams.toString()}`);
          }
        } catch (e) {
          console.error("Failed to parse saved school IDs from localStorage:", e);
        }
      }
    }
  }, [setLocation]);

  // Fetch all schools data for dropdowns and comparison
  const { data: allSchools, isLoading: isLoadingAllSchools } = useQuery({
    queryKey: ['/api/schools'],
    staleTime: 60000, // 1 minute
  });

  // Fetch user's saved comparisons if user is logged in
  const { data: userComparisons, isLoading: isLoadingComparisons } = useQuery({
    queryKey: ['/api/user/comparisons'],
    staleTime: 60000, // 1 minute
    enabled: isAuthenticated,
  });

  // Save current comparison mutation
  const saveComparisonMutation = useMutation({
    mutationFn: (schoolIds: number[]) => {
      return apiRequest('/api/user/comparisons', 'POST', { schoolIds });
    },
    onSuccess: () => {
      toast({
        title: "Comparison saved",
        description: "You can access this comparison from your dashboard later.",
      });
      // Invalidate the comparisons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/user/comparisons'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save comparison",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Filter schools based on selected IDs
  useEffect(() => {
    if (allSchools && selectedSchoolIds.length > 0) {
      const filtered = allSchools.filter((school: School) => 
        selectedSchoolIds.includes(school.id)
      );
      setCompareSchools(filtered);
    } else if (selectedSchoolIds.length > 0) {
      // Fallback to featured schools if API fails
      const filtered = FEATURED_SCHOOLS.filter(school => 
        selectedSchoolIds.includes(school.id)
      );
      setCompareSchools(filtered);
    } else {
      setCompareSchools([]);
    }
  }, [allSchools, selectedSchoolIds]);

  // Handle saving the current comparison
  const handleSaveComparison = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to save comparisons.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSchoolIds.length < 2) {
      toast({
        title: "Cannot save comparison",
        description: "Please select at least two schools to compare.",
        variant: "destructive",
      });
      return;
    }

    saveComparisonMutation.mutate(selectedSchoolIds);
  };

  // Handle adding a school to comparison
  const handleAddSchool = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schoolId = parseInt(e.target.value, 10);
    if (schoolId && !selectedSchoolIds.includes(schoolId)) {
      const newIds = [...selectedSchoolIds, schoolId];
      setSelectedSchoolIds(newIds);
      
      // Save to localStorage
      localStorage.setItem('comparisonSchoolIds', JSON.stringify(newIds));
      
      // Update URL
      const searchParams = new URLSearchParams();
      searchParams.set("schools", newIds.join(","));
      setLocation(`/compare?${searchParams.toString()}`);
    }
  };

  // Handle loading a saved comparison
  const handleLoadComparison = (comparison: Comparison) => {
    const schoolIds = comparison.schoolIds;
    setSelectedSchoolIds(schoolIds);
    
    // Save to localStorage
    localStorage.setItem('comparisonSchoolIds', JSON.stringify(schoolIds));
    
    // Update URL
    const searchParams = new URLSearchParams();
    searchParams.set("schools", schoolIds.join(","));
    setLocation(`/compare?${searchParams.toString()}`);
    
    toast({
      title: "Comparison loaded",
      description: `Showing comparison of ${schoolIds.length} schools.`,
    });
  };

  // Handle removing a school from comparison
  const handleRemoveSchool = (schoolId: number) => {
    const newIds = selectedSchoolIds.filter(id => id !== schoolId);
    setSelectedSchoolIds(newIds);
    
    // Save to localStorage
    if (newIds.length > 0) {
      localStorage.setItem('comparisonSchoolIds', JSON.stringify(newIds));
    } else {
      localStorage.removeItem('comparisonSchoolIds');
    }
    
    // Update URL
    if (newIds.length > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set("schools", newIds.join(","));
      setLocation(`/compare?${searchParams.toString()}`);
    } else {
      setLocation("/compare");
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Helper to format rating display
  const formatRating = (rating?: number) => {
    if (!rating) return "N/A";
    return (rating / 10).toFixed(1);
  };

  // Render value based on criteria type
  const renderValue = (school: School, criteria: string) => {
    switch (criteria) {
      case "rating":
        return (
          <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-yellow-400 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{formatRating(school.rating)}</span>
          </div>
        );
      case "hasFinancialAid":
        return school.hasFinancialAid ? (
          <div className="flex justify-center">
            <Check className="h-5 w-5 text-secondary-500" />
          </div>
        ) : (
          <div className="flex justify-center">
            <X className="h-5 w-5 text-red-500" />
          </div>
        );
      case "features":
        return (
          <div className="text-xs">
            {school.features && school.features.length > 0 ? (
              <ul className="list-disc pl-4">
                {school.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            ) : (
              "No features listed"
            )}
          </div>
        );
      default:
        return (school as any)[criteria] || "N/A";
    }
  };

  return (
    <div>
      <Helmet>
        <title>Compare Schools | SmartSchool Finder</title>
        <meta name="description" content="Compare schools side by side to find the best educational fit for your child." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Compare Schools</h1>
              
              <div className="mb-8">
                <p className="text-gray-600 mb-4">
                  Select up to 4 schools to compare side by side. See how they stack up on curriculum, class size, tuition, and more.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-full sm:w-auto flex-1">
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value=""
                      onChange={handleAddSchool}
                      disabled={compareSchools.length >= 4 || isLoadingAllSchools}
                    >
                      <option value="">Add a school to compare</option>
                      {allSchools && Array.isArray(allSchools) && allSchools.map((school: School) => {
                        // Only show schools not already in comparison
                        if (!selectedSchoolIds.includes(school.id)) {
                          return (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          );
                        }
                        return null;
                      })}
                    </select>
                  </div>
                  
                  {isAuthenticated && selectedSchoolIds.length >= 2 && (
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={handleSaveComparison}
                      disabled={saveComparisonMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      {saveComparisonMutation.isPending ? 'Saving...' : 'Save Comparison'}
                    </Button>
                  )}
                  
                  {compareSchools.length === 0 && !isLoadingAllSchools && (
                    <div className="text-gray-500 text-sm">
                      No schools selected for comparison yet.
                    </div>
                  )}
                </div>
                
                {/* Saved comparisons section */}
                {isAuthenticated && userComparisons && userComparisons.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Your saved comparisons:</h3>
                    <div className="flex flex-wrap gap-2">
                      {userComparisons.map((comparison: Comparison) => (
                        <Button 
                          key={comparison.id}
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => handleLoadComparison(comparison)}
                        >
                          {comparison.schoolIds.length} schools • {new Date(comparison.createdAt).toLocaleDateString()}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Comparison table */}
              {compareSchools.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border-t border-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[150px]"></th>
                        {compareSchools.map(school => (
                          <th key={school.id} scope="col" className="px-3 py-3 text-center text-sm font-medium text-gray-900 min-w-[200px]">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-full flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-gray-700 p-1 h-auto -mr-1"
                                  onClick={() => handleRemoveSchool(school.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="h-24 w-24 rounded-md overflow-hidden bg-gray-100 mb-2">
                                <img
                                  src={school.imageUrl || "https://via.placeholder.com/96"}
                                  alt={school.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="font-bold text-base">{school.name}</div>
                              <div className="text-xs text-gray-500">{school.location}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comparisonCategories.map(category => (
                        <React.Fragment key={category.name}>
                          <tr className="bg-gray-50">
                            <td colSpan={compareSchools.length + 1} className="px-3 py-2">
                              <button
                                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none w-full text-left"
                                onClick={() => toggleCategory(category.name)}
                              >
                                {expandedCategories[category.name] ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                {category.name}
                              </button>
                            </td>
                          </tr>
                          {expandedCategories[category.name] && category.criteria.map(criteria => (
                            <tr key={criteria} className="hover:bg-gray-50">
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">
                                {criteriaLabels[criteria]}
                              </td>
                              {compareSchools.map(school => (
                                <td key={`${school.id}-${criteria}`} className="px-3 py-3 text-sm text-gray-600 text-center">
                                  {renderValue(school, criteria)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Empty state */}
              {compareSchools.length === 0 && !isLoadingAllSchools && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">No schools to compare</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Select schools to start comparing their features, curriculum, and more.
                  </p>
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation("/discover")}
                    >
                      Browse Schools
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Compare;
