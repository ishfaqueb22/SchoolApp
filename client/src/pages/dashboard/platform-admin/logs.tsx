import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  BarChart, FileCog, Filter, CalendarIcon, Download, RefreshCw, 
  AlertCircle, RotateCw, GraduationCap, User, Settings, AlertTriangle, 
  Search, SearchIcon, Trash2, Eye
} from 'lucide-react';
import { format } from 'date-fns';

const ActivityLogsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
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
  
  const logs = [
    {
      id: 1,
      activityType: 'user_login',
      description: 'User login successful',
      entityType: 'user',
      entityId: 5,
      entityName: 'Ahmed Khan',
      userId: 5,
      userName: 'Ahmed Khan',
      userRole: 'user',
      ipAddress: '192.168.1.105',
      timestamp: new Date().toISOString(),
      details: { browser: 'Chrome', os: 'Windows 10' }
    },
    {
      id: 2,
      activityType: 'school_approved',
      description: 'School verified and approved',
      entityType: 'school',
      entityId: 12,
      entityName: 'Roots Millennium School',
      userId: 3,
      userName: 'Platform Administrator',
      userRole: 'platformAdmin',
      ipAddress: '192.168.1.100',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
      details: { notes: 'All documentation verified' }
    },
    {
      id: 3,
      activityType: 'review_moderated',
      description: 'Review approved after moderation',
      entityType: 'review',
      entityId: 28,
      entityName: 'Review #28',
      userId: 3,
      userName: 'Platform Administrator',
      userRole: 'platformAdmin',
      ipAddress: '192.168.1.100',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
      details: { schoolId: 12, schoolName: 'Roots Millennium School' }
    },
    {
      id: 4,
      activityType: 'school_updated',
      description: 'School details updated',
      entityType: 'school',
      entityId: 14,
      entityName: 'Beaconhouse School System',
      userId: 4,
      userName: 'Sarah Ali',
      userRole: 'schoolAdmin',
      ipAddress: '192.168.1.120',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 4)).toISOString(),
      details: { fields: ['description', 'contactInfo'] }
    },
    {
      id: 5,
      activityType: 'campus_added',
      description: 'New campus added to school',
      entityType: 'campus',
      entityId: 35,
      entityName: 'North Campus',
      userId: 4,
      userName: 'Sarah Ali',
      userRole: 'schoolAdmin',
      ipAddress: '192.168.1.120',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 8)).toISOString(),
      details: { schoolId: 14, schoolName: 'Beaconhouse School System' }
    },
    {
      id: 6,
      activityType: 'error',
      description: 'API Error: Rate limit exceeded',
      entityType: 'system',
      entityId: 0,
      entityName: 'System',
      userId: 0,
      userName: 'System',
      userRole: 'system',
      ipAddress: '127.0.0.1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      details: { errorCode: 429, endpoint: '/api/schools/search' }
    },
  ];
  
  function getActivityIcon(activityType: string) {
    switch (activityType) {
      case 'user_login':
      case 'user_logout':
      case 'user_registered':
        return <User className="h-4 w-4" />;
      case 'school_approved':
      case 'school_updated':
        return <GraduationCap className="h-4 w-4" />;
      case 'settings_changed':
        return <Settings className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileCog className="h-4 w-4" />;
    }
  }
  
  function getActivityBadgeColor(activityType: string) {
    if (activityType.includes('error')) return 'destructive';
    if (activityType.includes('approved') || activityType.includes('added')) return 'success';
    if (activityType.includes('updated') || activityType.includes('changed')) return 'warning';
    return 'default';
  }
  
  function formatDate(date: string) {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  }
  
  return (
    <>
      <Helmet>
        <title>Activity Logs | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">System Activity Logs</h2>
              <p className="text-muted-foreground">
                View and search system activities and events
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
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Activity Logs</CardTitle>
                  <CardDescription>
                    User actions and system events log
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search logs..."
                      className="pl-8 w-full md:w-[260px]"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      <SelectItem value="user">User Activities</SelectItem>
                      <SelectItem value="school">School Activities</SelectItem>
                      <SelectItem value="system">System Events</SelectItem>
                      <SelectItem value="error">Errors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {getActivityIcon(log.activityType)}
                            </div>
                            <div>
                              <div className="font-medium">{log.description}</div>
                              <div className="flex items-center">
                                <Badge variant={getActivityBadgeColor(log.activityType) as any} className="mr-2">
                                  {log.activityType.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.ipAddress}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.entityName}</div>
                          <div className="text-xs text-muted-foreground">{log.entityType}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userRole}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(log.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete log">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>6</strong> of <strong>230</strong> activities
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Error and warning statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                      <span className="font-medium">Critical Errors</span>
                    </div>
                    <Badge variant="destructive">2</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Warnings</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">5</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RotateCw className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">System Restarts</span>
                    </div>
                    <Badge variant="outline">1</Badge>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      View System Health Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
                <CardDescription>
                  Activity types breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">User Activities</span>
                      <span className="text-sm text-muted-foreground">35%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">School Management</span>
                      <span className="text-sm text-muted-foreground">28%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Content Management</span>
                      <span className="text-sm text-muted-foreground">18%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Review Moderation</span>
                      <span className="text-sm text-muted-foreground">15%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">System Events</span>
                      <span className="text-sm text-muted-foreground">4%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '4%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default ActivityLogsPage;