import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { School } from "@/lib/types";
import { 
  Heart, School as SchoolIcon, FileBarChart, Star, Clock, RefreshCcw, 
  Search, MapPin, UserCheck, MessageSquare, Eye
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved-schools");

  // Fetch saved schools
  const { 
    data: savedSchools, 
    isLoading: isLoadingSavedSchools,
    error: savedSchoolsError
  } = useQuery({
    queryKey: ['/api/user/saved-schools'],
    staleTime: 60000, // 1 minute
  });

  // Fetch comparisons
  const {
    data: comparisons,
    isLoading: isLoadingComparisons,
    error: comparisonsError
  } = useQuery({
    queryKey: ['/api/user/comparisons'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch user inquiries
  const {
    data: inquiries,
    isLoading: isLoadingInquiries,
    error: inquiriesError
  } = useQuery({
    queryKey: ['/api/user/inquiries'],
    staleTime: 60000, // 1 minute
  });

  // Handle removing a saved school
  const handleRemoveSavedSchool = async (schoolId: number) => {
    try {
      await apiRequest("DELETE", `/api/user/saved-schools/${schoolId}`);
      // Invalidate the saved schools query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/user/saved-schools'] });
    } catch (error) {
      console.error("Failed to remove school:", error);
    }
  };

  // Handle deleting a comparison
  const handleDeleteComparison = async (comparisonId: number) => {
    try {
      await apiRequest("DELETE", `/api/user/comparisons/${comparisonId}`);
      // Invalidate the comparisons query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/user/comparisons'] });
    } catch (error) {
      console.error("Failed to delete comparison:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Please log in to view your dashboard.</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | SmartSchool Finder</title>
        <meta name="description" content="Access your saved schools, comparisons, and account settings in your SmartSchool Finder dashboard." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {user.fullName}! Manage your saved schools, comparisons, and account.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Saved Schools</CardTitle>
                  <Heart className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{savedSchools?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Schools in your saved list
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Comparisons</CardTitle>
                  <FileBarChart className="h-5 w-5 text-primary-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparisons?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    School comparison sets
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">School Inquiries</CardTitle>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inquiries?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Pending school inquiries
                  </p>
                  <Link href="/dashboard/my-inquiries" className="inline-block mt-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      View All Inquiries
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                <TabsTrigger value="saved-schools">Saved Schools</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="saved-schools" className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Your Saved Schools</h2>
                  
                  {isLoadingSavedSchools ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 animate-pulse h-24 rounded-lg"></div>
                      ))}
                    </div>
                  ) : savedSchools && savedSchools.length > 0 ? (
                    <div className="space-y-4">
                      {savedSchools.map((school: School) => (
                        <div 
                          key={school.id} 
                          className="flex items-center border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div 
                            className="w-16 h-16 bg-gray-200 rounded overflow-hidden mr-4 flex-shrink-0"
                          >
                            {school.imageUrl && (
                              <img 
                                src={school.imageUrl} 
                                alt={school.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{school.name}</h3>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {school.location}
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full">
                                {school.curriculumType}
                              </span>
                              <span className="mx-2 text-gray-300">|</span>
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-xs ml-1 font-medium">
                                  {school.rating ? (school.rating).toFixed(1) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Link href={`/schools/${school.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleRemoveSavedSchool(school.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                        <Heart className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No saved schools</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        You haven't saved any schools yet. Start exploring to find schools you're interested in.
                      </p>
                      <div className="mt-6">
                        <Link href="/discover">
                          <Button>
                            <Search className="h-4 w-4 mr-2" />
                            Explore Schools
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="inquiries" className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Your School Inquiries</h2>
                  
                  {isLoadingInquiries ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 animate-pulse h-24 rounded-lg"></div>
                      ))}
                    </div>
                  ) : inquiries && inquiries.length > 0 ? (
                    <div className="space-y-4">
                      {inquiries.map((inquiry: any) => (
                        <div 
                          key={inquiry.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900">
                              {inquiry.schoolName || 'School Inquiry'}
                            </h3>
                            <div className="text-xs">
                              {inquiry.status && (
                                <span className={`
                                  px-2 py-1 rounded-full text-xs font-medium 
                                  ${inquiry.status.toLowerCase() === 'new' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${inquiry.status.toLowerCase() === 'pending' ? 'bg-purple-100 text-purple-800' : ''}
                                  ${inquiry.status.toLowerCase() === 'in progress' ? 'bg-amber-100 text-amber-800' : ''}
                                  ${inquiry.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                `}>
                                  {inquiry.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 font-medium mb-1">
                            {inquiry.subject}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Submitted {new Date(inquiry.createdAt).toLocaleDateString()}
                          </p>
                          {inquiry.response ? (
                            <div className="bg-gray-50 p-3 rounded-md mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">School Response:</p>
                              <p className="text-sm text-gray-600">
                                {inquiry.response.length > 100 
                                  ? `${inquiry.response.substring(0, 100)}...` 
                                  : inquiry.response
                                }
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic mb-3">
                              Awaiting response from school
                            </p>
                          )}
                          <div className="flex justify-end">
                            <Link href="/dashboard/my-inquiries">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-center mt-4">
                        <Link href="/dashboard/my-inquiries">
                          <Button>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View All Inquiries
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No inquiries yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        You haven't sent any inquiries to schools yet. Explore schools and reach out with your questions.
                      </p>
                      <div className="mt-6">
                        <Link href="/discover">
                          <Button>
                            <Search className="h-4 w-4 mr-2" />
                            Explore Schools
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comparisons" className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Your School Comparisons</h2>
                  
                  {isLoadingComparisons ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-50 animate-pulse h-32 rounded-lg"></div>
                      ))}
                    </div>
                  ) : comparisons && comparisons.length > 0 ? (
                    <div className="space-y-4">
                      {comparisons.map((comparison: any) => (
                        <div 
                          key={comparison.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-gray-900">
                              Comparison #{comparison.id}
                            </h3>
                            <div className="text-sm text-gray-500">
                              Created {new Date(comparison.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Comparing {comparison.schoolIds.length} schools
                          </p>
                          <div className="flex items-center justify-between">
                            <Link href={`/compare?schools=${comparison.schoolIds.join(',')}`}>
                              <Button size="sm">View Comparison</Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteComparison(comparison.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
                        <FileBarChart className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No comparisons</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        You haven't created any school comparisons yet. Compare schools to find the best fit.
                      </p>
                      <div className="mt-6">
                        <Link href="/compare">
                          <Button>
                            <FileBarChart className="h-4 w-4 mr-2" />
                            Compare Schools
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-6">Account Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="md:w-1/3">
                        <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                      </div>
                      <div className="md:w-2/3 mt-1 md:mt-0">
                        <p className="text-gray-900">{user.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="md:w-1/3">
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      </div>
                      <div className="md:w-2/3 mt-1 md:mt-0">
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="md:w-1/3">
                        <h3 className="text-sm font-medium text-gray-500">Username</h3>
                      </div>
                      <div className="md:w-2/3 mt-1 md:mt-0">
                        <p className="text-gray-900">{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="md:w-1/3">
                        <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                      </div>
                      <div className="md:w-2/3 mt-1 md:mt-0">
                        <p className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="md:w-1/3">
                        <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                      </div>
                      <div className="md:w-2/3 mt-1 md:mt-0">
                        <p className="text-gray-900 capitalize">{user.role}</p>
                      </div>
                    </div>
                    
                    <div className="pt-5 border-t border-gray-200">
                      <div className="flex justify-end">
                        <Button variant="outline" className="mr-3">Change Password</Button>
                        <Button>Edit Profile</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive emails about school updates and matches</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="email-notifications"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="email-notifications" className="ml-2 text-sm text-gray-900 sr-only">
                          Email Notifications
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-500">Receive text messages for important updates</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="sms-notifications"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sms-notifications" className="ml-2 text-sm text-gray-900 sr-only">
                          SMS Notifications
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Marketing Communications</h3>
                        <p className="text-sm text-gray-500">Receive news and special offers</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="marketing-communications"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="marketing-communications" className="ml-2 text-sm text-gray-900 sr-only">
                          Marketing Communications
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-5 border-t border-gray-200">
                      <div className="flex justify-end">
                        <Button>Save Preferences</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
