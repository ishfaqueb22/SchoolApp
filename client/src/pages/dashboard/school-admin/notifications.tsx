import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { SchoolAdminLayout } from "@/components/layouts/school-admin-layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { UserNotification } from "@shared/schema";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const { 
    notifications, 
    isLoading, 
    markAsRead,
    markAllAsRead,
    refetch
  } = useNotifications();
  const [filteredNotifications, setFilteredNotifications] = useState<UserNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Format relative time for notifications
  const formatRelativeTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Format absolute time for notifications
  const formatAbsoluteTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "PPP p"); // e.g., Apr 29, 2023, 3:45 PM
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejection':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get notification badge color based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'approval':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approval</Badge>;
      case 'rejection':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejection</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">System</Badge>;
      default:
        return <Badge variant="outline">Notification</Badge>;
    }
  };

  // Filter notifications based on search query and active tab
  useEffect(() => {
    if (!notifications) {
      setFilteredNotifications([]);
      return;
    }
    
    let filtered = [...notifications];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(query) || 
        notification.message.toLowerCase().includes(query)
      );
    }
    
    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter(notification => !notification.isRead);
    } else if (activeTab === "read") {
      filtered = filtered.filter(notification => notification.isRead);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  if (isLoading) {
    return (
      <SchoolAdminLayout>
        <div className="container mx-auto py-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-80" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </SchoolAdminLayout>
    );
  }

  return (
    <SchoolAdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              View and manage your notifications
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={!notifications || notifications.length === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <TabsContent value={activeTab} className="mt-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {searchQuery 
                        ? "No notifications match your search" 
                        : activeTab === "unread" 
                          ? "You have no unread notifications" 
                          : activeTab === "read" 
                            ? "You have no read notifications"
                            : "You have no notifications"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={notification.isRead ? "" : "border-l-4 border-l-primary"}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div>
                              <CardTitle className="text-base">{notification.title}</CardTitle>
                              <CardDescription className="text-xs">
                                {formatAbsoluteTime(notification.createdAt)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getNotificationBadge(notification.type)}
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{notification.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SchoolAdminLayout>
  );
}