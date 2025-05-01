import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon, Download, BarChart, PieChart, LineChart, Users, 
  School, Star, TrendingUp, TrendingDown, Bookmark, List, Map, 
  ArrowUpRight, MoveRight
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart, 
  Area
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Mock data for the charts
const dailyVisits = [
  { name: 'Mon', users: 340 },
  { name: 'Tue', users: 280 },
  { name: 'Wed', users: 390 },
  { name: 'Thu', users: 430 },
  { name: 'Fri', users: 470 },
  { name: 'Sat', users: 320 },
  { name: 'Sun', users: 240 },
];

const monthlyUsers = [
  { name: 'Jan', users: 1200, schools: 12 },
  { name: 'Feb', users: 1400, schools: 16 },
  { name: 'Mar', users: 1650, schools: 18 },
  { name: 'Apr', users: 1800, schools: 22 },
  { name: 'May', users: 2100, schools: 24 },
  { name: 'Jun', users: 2400, schools: 28 },
];

const usersByRole = [
  { name: 'Regular Users', value: 1180 },
  { name: 'School Admins', value: 59 },
  { name: 'Platform Admins', value: 2 },
];

const schoolsByType = [
  { name: 'STEM', value: 12 },
  { name: 'International', value: 8 },
  { name: 'Montessori', value: 10 },
  { name: 'Arts', value: 6 },
  { name: 'Special Education', value: 5 },
];

const userJourneyStats = [
  { name: 'Visitors', value: 24500 },
  { name: 'Registrations', value: 3200 },
  { name: 'School Views', value: 18750 },
  { name: 'Comparisons', value: 4250 },
  { name: 'Saved Schools', value: 6800 },
  { name: 'Inquiries', value: 1680 },
];

const conversionRates = [
  { name: 'Homepage Views', value: 100, baseline: true },
  { name: 'Search Usage', value: 78 },
  { name: 'School Profile Views', value: 64 },
  { name: 'Account Registration', value: 42 },
  { name: 'School Comparisons', value: 36 },
  { name: 'Saved Schools', value: 25 },
  { name: 'School Inquiries', value: 18 },
];

const topSearchedSchools = [
  { name: 'Roots Millennium School', searches: 890 },
  { name: 'Beaconhouse School System', searches: 745 },
  { name: 'The City School', searches: 670 },
  { name: 'Lahore Grammar School', searches: 580 },
  { name: 'Karachi Grammar School', searches: 520 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  // Helper to handle date range updates safely
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Analytics | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
              <p className="text-muted-foreground">
                Monitor platform usage, user growth, and engagement metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : 'Select date'}</span>
                    {dateRange.to && (
                      <>
                        <span>-</span>
                        <span>{format(dateRange.to, 'MMM d, yyyy')}</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => range && handleDateRangeChange(range)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                User Analytics
              </TabsTrigger>
              <TabsTrigger value="schools">
                <School className="h-4 w-4 mr-2" />
                School Analytics
              </TabsTrigger>
              <TabsTrigger value="engagement">
                <Star className="h-4 w-4 mr-2" />
                Engagement
              </TabsTrigger>
              <TabsTrigger value="funnel">
                <List className="h-4 w-4 mr-2" />
                Conversion Funnel
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3,240</div>
                    <div className="flex items-center pt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs text-green-500">+18% from last month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                    <School className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">89</div>
                    <div className="flex items-center pt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs text-green-500">+5 new schools this month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">School Searches</CardTitle>
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24,650</div>
                    <div className="flex items-center pt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs text-green-500">+32% from last month</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Review Activity</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142</div>
                    <div className="flex items-center pt-1">
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                      <span className="text-xs text-red-500">-4% from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Daily Visits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily User Activity</CardTitle>
                  <CardDescription>
                    Unique visitors over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={dailyVisits}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Growth Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>
                      Monthly user registration trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyUsers}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of users and schools by type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                          <Pie
                            data={schoolsByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {schoolsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Top Searches */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Searched Schools</CardTitle>
                  <CardDescription>
                    Most popular schools based on search volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {topSearchedSchools.map((school, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            {index + 1}
                          </div>
                          <span className="font-medium">{school.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-2">{school.searches} searches</span>
                          <Progress value={(school.searches / topSearchedSchools[0].searches) * 100} className="h-2 w-24" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* User Analytics Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>User Trends</CardTitle>
                    <CardDescription>
                      Monthly user growth and engagement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={monthlyUsers}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="users"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                          />
                          <Line yAxisId="right" type="monotone" dataKey="schools" stroke="#82ca9d" />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Roles</CardTitle>
                    <CardDescription>
                      Distribution of users by role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                          <Pie
                            data={usersByRole}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {usersByRole.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                  <CardDescription>
                    User distribution by region and user type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-medium mb-2">User Location Distribution</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted rounded-md p-3">
                          <div className="text-xl font-bold">42%</div>
                          <div className="text-sm text-muted-foreground">Islamabad</div>
                        </div>
                        <div className="bg-muted rounded-md p-3">
                          <div className="text-xl font-bold">27%</div>
                          <div className="text-sm text-muted-foreground">Lahore</div>
                        </div>
                        <div className="bg-muted rounded-md p-3">
                          <div className="text-xl font-bold">18%</div>
                          <div className="text-sm text-muted-foreground">Karachi</div>
                        </div>
                        <div className="bg-muted rounded-md p-3">
                          <div className="text-xl font-bold">13%</div>
                          <div className="text-sm text-muted-foreground">Other</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">User Access by Device</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Mobile</span>
                            <span>64%</span>
                          </div>
                          <Progress value={64} className="h-2" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Desktop</span>
                            <span>28%</span>
                          </div>
                          <Progress value={28} className="h-2" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Tablet</span>
                            <span>8%</span>
                          </div>
                          <Progress value={8} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* School Analytics Tab */}
            <TabsContent value="schools" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>School Registration Trends</CardTitle>
                    <CardDescription>
                      Monthly school onboarding statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={monthlyUsers}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="schools" fill="#82ca9d" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>School Categories</CardTitle>
                    <CardDescription>
                      Distribution by school type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                          <Pie
                            data={schoolsByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {schoolsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">89</div>
                      <p className="text-xs text-muted-foreground">Across all categories</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Most Reviewed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Roots Millennium</div>
                      <p className="text-xs text-muted-foreground">48 verified reviews</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Verified Schools</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">72</div>
                      <p className="text-xs text-muted-foreground">81% verification rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Highest Rated</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Beaconhouse</div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Islamabad</span>
                        <Badge variant="outline">32 schools</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>Lahore</span>
                        <Badge variant="outline">24 schools</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>Karachi</span>
                        <Badge variant="outline">18 schools</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>Peshawar</span>
                        <Badge variant="outline">8 schools</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>Quetta</span>
                        <Badge variant="outline">7 schools</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Journey</CardTitle>
                    <CardDescription>
                      Key user engagement metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userJourneyStats.map((stat, index) => (
                        <div key={index} className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{stat.name}</span>
                            <span className="text-sm text-muted-foreground">{stat.value.toLocaleString()}</span>
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={(stat.value / userJourneyStats[0].value) * 100}
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                    <CardDescription>
                      Most popular platform features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          layout="vertical"
                          data={[
                            { name: 'School Search', value: 98 },
                            { name: 'Profile Views', value: 86 },
                            { name: 'Compare Tool', value: 64 },
                            { name: 'Reviews Reading', value: 58 },
                            { name: 'Map View', value: 45 },
                            { name: 'Review Writing', value: 24 },
                          ]}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>
                    Weekly returning user rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={[
                          { week: 'Week 1', retention: 100 },
                          { week: 'Week 2', retention: 68 },
                          { week: 'Week 3', retention: 52 },
                          { week: 'Week 4', retention: 42 },
                          { week: 'Week 5', retention: 38 },
                          { week: 'Week 6', retention: 35 },
                          { week: 'Week 7', retention: 32 },
                          { week: 'Week 8', retention: 30 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="retention"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Conversion Funnel Tab */}
            <TabsContent value="funnel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Conversion Funnel</CardTitle>
                  <CardDescription>
                    User journey conversion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {conversionRates.map((step, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${step.baseline ? 'bg-green-50 text-green-700' : ''}`}
                            >
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{step.name}</span>
                          </div>
                          <span className="font-bold">{step.value}%</span>
                        </div>
                        <Progress value={step.value} className="h-2" />
                        {index < conversionRates.length - 1 && (
                          <div className="flex justify-center my-2">
                            <ArrowUpRight className="h-5 w-5 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t">
                    <h4 className="font-medium mb-4">Conversion Opportunities</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 border rounded-md bg-muted/20">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Improve Registration Rate</h5>
                          <p className="text-sm text-muted-foreground">
                            Adding social sign-up options could improve conversion from school viewing to registration by up to 15%.
                          </p>
                          <Button variant="link" className="p-0 h-auto mt-1 text-sm">
                            View Recommendations
                            <MoveRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 border rounded-md bg-muted/20">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Boost School Inquiry Rate</h5>
                          <p className="text-sm text-muted-foreground">
                            Simplifying the inquiry form could potentially increase the inquiry rate by 8%.
                          </p>
                          <Button variant="link" className="p-0 h-auto mt-1 text-sm">
                            View Recommendations
                            <MoveRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
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

export default AnalyticsPage;