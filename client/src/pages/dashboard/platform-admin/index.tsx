import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, School, Users, Star, FileText, Clock, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Skeleton UI component for dashboard loading state
const DashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="h-10 w-1/3 rounded-md bg-muted animate-pulse" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 w-1/2 rounded-md bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-1/3 rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-5 w-1/2 rounded-md bg-muted" />
            <div className="h-4 w-2/3 rounded-md bg-muted mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const PlatformAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/platform-admin/dashboard'],
    onError: (err) => {
      console.error('Failed to fetch dashboard data:', err);
    }
  });
  
  // Current date for dashboard
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
  
  // Extract data from API response
  const stats = dashboardData?.stats || {
    totalSchools: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    totalReviews: 0,
    reviewsNeedingModeration: 0
  };
  
  const recentActivity = dashboardData?.recentActivity || [];
  const pendingSchools = dashboardData?.pendingSchools || [];
  
  // Format relative time
  const formatRelativeTime = (dateInput: Date | string) => {
    const now = new Date();
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Ensure date is valid before proceeding
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return `${diffSec} sec ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  };
  
  if (isLoading) return (
    <PlatformAdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DashboardSkeleton />
      </div>
    </PlatformAdminLayout>
  );

  if (error) return (
    <PlatformAdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    </PlatformAdminLayout>
  );

  return (
    <>
      <Helmet>
        <title>Platform Admin Dashboard | SmartSchool Finder</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Platform Dashboard</h2>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSchools}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingApprovals > 0 ? (
                    <span className="text-amber-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {stats.pendingApprovals} pending approval
                    </span>
                  ) : (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All schools approved
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-xs text-green-500">18% increase</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Review Activity</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.reviewsNeedingModeration > 0 ? (
                    <span className="text-amber-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {stats.reviewsNeedingModeration} needs moderation
                    </span>
                  ) : (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      All reviews moderated
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-500 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Healthy
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                    <span>System load</span>
                    <span>12%</span>
                  </div>
                  <Progress value={12} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                    <CardDescription>
                      Summary of platform metrics and recent activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Total Schools by Type</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">STEM</div>
                              <div className="text-lg font-bold">12</div>
                            </div>
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">International</div>
                              <div className="text-lg font-bold">8</div>
                            </div>
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">Montessori</div>
                              <div className="text-lg font-bold">10</div>
                            </div>
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">Arts</div>
                              <div className="text-lg font-bold">6</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Users by Role</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">Regular Users</div>
                              <div className="text-lg font-bold">1180</div>
                            </div>
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">School Admins</div>
                              <div className="text-lg font-bold">59</div>
                            </div>
                            <div className="bg-primary/10 rounded p-2">
                              <div className="text-sm">Platform Admins</div>
                              <div className="text-lg font-bold">1</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Pending Tasks</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span className="text-sm">5 schools awaiting approval</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <span className="text-sm">8 reviews need moderation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">All user reports addressed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest actions on the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                          <div>
                            <div className="font-medium text-sm">{activity.action}</div>
                            <div className="text-sm text-muted-foreground">{activity.entityName}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        View all activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="pending-approvals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schools Awaiting Approval</CardTitle>
                  <CardDescription>
                    Review and approve school registration requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingSchools.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No pending school approvals</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingSchools.map((school) => (
                        <Card key={school.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{school.name}</h3>
                                <div className="text-sm text-muted-foreground">{school.location} • {school.type}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Submitted by {school.submittedBy} • {formatRelativeTime(school.submittedDate)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="destructive" size="sm">Reject</Button>
                                <Button variant="default" size="sm">Approve</Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity Log</CardTitle>
                  <CardDescription>
                    Recent actions and events across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 py-3 border-b last:border-0">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{activity.action}</div>
                              <div className="text-sm text-muted-foreground">{activity.entityName}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="text-muted-foreground">By:</span> {activity.user}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default PlatformAdminDashboard;