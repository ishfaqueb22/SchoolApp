import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import {
  Bell, BellPlus, Trash, Edit, MoreHorizontal, Check, XCircle, Users, School, 
  ShieldAlert, Clock, Info, AlertTriangle, Megaphone
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format, isAfter, parseISO, addDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

// Notification type for TypeScript
interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  targetGroup: string;
  isActive: boolean;
  createdBy: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Form schema for creating/editing notifications
const notificationFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must not exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(500, "Content must not exceed 500 characters"),
  type: z.string().min(1, "Notification type is required"),
  targetGroup: z.string().min(1, "Target audience is required"),
  isActive: z.boolean().default(true),
  expiresAt: z.date().nullable().optional()
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const NotificationsManagement = () => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Initialize form
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "system",
      targetGroup: "all",
      isActive: true,
      expiresAt: addDays(new Date(), 7)
    }
  });
  
  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/platform-admin/notifications'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching notifications",
        description: "There was a problem loading the notifications data."
      });
    }
  });
  
  // Create new notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: NotificationFormValues) => {
      const response = await fetch(`/api/platform-admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/notifications'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Notification created",
        description: "The notification has been created and will be shown to users."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Update notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, notificationData }: { id: number, notificationData: NotificationFormValues }) => {
      const response = await fetch(`/api/platform-admin/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/notifications'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Notification updated",
        description: "The notification has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/platform-admin/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete notification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/notifications'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Notification deleted",
        description: "The notification has been permanently deleted."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Toggle notification active status mutation
  const toggleNotificationStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/platform-admin/notifications/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification status');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/notifications'] });
      toast({
        title: variables.isActive ? "Notification activated" : "Notification deactivated",
        description: `The notification has been ${variables.isActive ? 'activated' : 'deactivated'} successfully.`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Use data from API
  const notificationsData = notifications || [];
  
  // Sort notifications by created date (newest first)
  const sortedNotifications = [...notificationsData].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Functions to handle dialogs
  const handleCreateNotification = () => {
    form.reset({
      title: "",
      content: "",
      type: "system",
      targetGroup: "all",
      isActive: true,
      expiresAt: addDays(new Date(), 7)
    });
    setIsCreateDialogOpen(true);
  };
  
  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    form.reset({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      targetGroup: notification.targetGroup,
      isActive: notification.isActive,
      expiresAt: notification.expiresAt ? parseISO(notification.expiresAt) : null
    });
    setIsEditDialogOpen(true);
  };
  
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewDialogOpen(true);
  };
  
  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDeleteDialogOpen(true);
  };
  
  const handleToggleStatus = (notification: Notification) => {
    toggleNotificationStatusMutation.mutate({
      id: notification.id,
      isActive: !notification.isActive
    });
  };
  
  const confirmDeleteNotification = () => {
    if (selectedNotification) {
      deleteNotificationMutation.mutate(selectedNotification.id);
    }
  };
  
  const onCreateSubmit = (data: NotificationFormValues) => {
    createNotificationMutation.mutate(data);
  };
  
  const onEditSubmit = (data: NotificationFormValues) => {
    if (!selectedNotification) return;
    
    updateNotificationMutation.mutate({ id: selectedNotification.id, notificationData: data });
  };
  
  // Helper functions for notification display
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'update':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case 'system':
        return <Badge className="bg-blue-500">{getNotificationTypeIcon(type)} System</Badge>;
      case 'update':
        return <Badge className="bg-green-500">{getNotificationTypeIcon(type)} Update</Badge>;
      case 'alert':
        return <Badge className="bg-amber-500">{getNotificationTypeIcon(type)} Alert</Badge>;
      case 'announcement':
        return <Badge className="bg-purple-500">{getNotificationTypeIcon(type)} Announcement</Badge>;
      default:
        return <Badge variant="outline">{getNotificationTypeIcon(type)} {type}</Badge>;
    }
  };
  
  const getTargetGroupIcon = (group: string) => {
    switch (group) {
      case 'all':
        return <Users className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'schoolAdmins':
        return <School className="h-4 w-4" />;
      case 'platformAdmins':
        return <ShieldAlert className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };
  
  const getTargetGroupBadge = (group: string) => {
    switch (group) {
      case 'all':
        return <Badge variant="outline">{getTargetGroupIcon(group)} All Users</Badge>;
      case 'users':
        return <Badge variant="outline">{getTargetGroupIcon(group)} Regular Users</Badge>;
      case 'schoolAdmins':
        return <Badge variant="outline">{getTargetGroupIcon(group)} School Admins</Badge>;
      case 'platformAdmins':
        return <Badge variant="outline">{getTargetGroupIcon(group)} Platform Admins</Badge>;
      default:
        return <Badge variant="outline">{getTargetGroupIcon(group)} {group}</Badge>;
    }
  };
  
  const getStatusBadge = (isActive: boolean, expiresAt: string | null) => {
    if (!isActive) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
    }
    
    if (expiresAt && isAfter(new Date(), parseISO(expiresAt))) {
      return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    
    return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Active</Badge>;
  };
  
  // Lists for form select fields
  const notificationTypes = [
    { value: "system", label: "System" },
    { value: "update", label: "Feature Update" },
    { value: "alert", label: "Alert" },
    { value: "announcement", label: "Announcement" }
  ];
  
  const targetGroups = [
    { value: "all", label: "All Users" },
    { value: "users", label: "Regular Users" },
    { value: "schoolAdmins", label: "School Administrators" },
    { value: "platformAdmins", label: "Platform Administrators" }
  ];
  
  return (
    <>
      <Helmet>
        <title>Platform Notifications | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Platform Notifications</h2>
              <p className="text-muted-foreground">
                Manage and send notifications to platform users
              </p>
            </div>
            <Button onClick={handleCreateNotification}>
              <BellPlus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Notifications</CardTitle>
              <CardDescription>
                Notifications currently being displayed to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedNotifications.filter(n => n.isActive).length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active notifications</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleCreateNotification}
                    >
                      <BellPlus className="mr-2 h-4 w-4" />
                      Create a Notification
                    </Button>
                  </div>
                ) : (
                  sortedNotifications.filter(n => n.isActive).map((notification) => (
                    <Card key={notification.id} className="overflow-hidden bg-muted/30 border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getNotificationTypeBadge(notification.type)}
                              {getTargetGroupBadge(notification.targetGroup)}
                              {getStatusBadge(notification.isActive, notification.expiresAt)}
                              
                              {notification.expiresAt && (
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expires: {format(parseISO(notification.expiresAt), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            
                            <div>
                              <h3 className="font-medium">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground">{notification.content}</p>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              Created: {format(parseISO(notification.createdAt), "MMMM d, yyyy")}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewNotification(notification)}>
                                <Info className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditNotification(notification)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(notification)}
                                className="text-amber-500"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteNotification(notification)}
                                className="text-red-500"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Past & Inactive Notifications</CardTitle>
              <CardDescription>
                Notifications that are no longer active or have expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedNotifications.filter(n => !n.isActive).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No inactive notifications</p>
                  </div>
                ) : (
                  sortedNotifications.filter(n => !n.isActive).map((notification) => (
                    <Card key={notification.id} className="overflow-hidden bg-muted/10">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getNotificationTypeBadge(notification.type)}
                              {getTargetGroupBadge(notification.targetGroup)}
                              {getStatusBadge(notification.isActive, notification.expiresAt)}
                            </div>
                            
                            <div>
                              <h3 className="font-medium">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground">{notification.content}</p>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              Created: {format(parseISO(notification.createdAt), "MMMM d, yyyy")}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewNotification(notification)}>
                                <Info className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditNotification(notification)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(notification)}
                                className="text-green-500"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteNotification(notification)}
                                className="text-red-500"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Create Notification Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Create a new notification to send to platform users.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter notification title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter notification content..." 
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Content will be displayed to users in the notification area.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {notificationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    {getNotificationTypeIcon(type.value)}
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {targetGroups.map((group) => (
                                <SelectItem key={group.value} value={group.value}>
                                  <div className="flex items-center gap-2">
                                    {getTargetGroupIcon(group.value)}
                                    {group.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiration Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>No expiration</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When the notification should expire. Leave empty for no expiration.
                          </FormDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-1"
                            onClick={() => field.onChange(null)}
                          >
                            Clear date
                          </Button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Activate Immediately
                            </FormLabel>
                            <FormDescription>
                              If checked, notification will be shown to users right away.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Notification</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Notification Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Notification</DialogTitle>
                <DialogDescription>
                  Update the notification details.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter notification title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter notification content..." 
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Content will be displayed to users in the notification area.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {notificationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    {getNotificationTypeIcon(type.value)}
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {targetGroups.map((group) => (
                                <SelectItem key={group.value} value={group.value}>
                                  <div className="flex items-center gap-2">
                                    {getTargetGroupIcon(group.value)}
                                    {group.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiration Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>No expiration</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When the notification should expire. Leave empty for no expiration.
                          </FormDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-1"
                            onClick={() => field.onChange(null)}
                          >
                            Clear date
                          </Button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Active Status
                            </FormLabel>
                            <FormDescription>
                              If checked, notification will be shown to users.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* View Notification Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Notification Details</DialogTitle>
                <DialogDescription>
                  View detailed information about this notification.
                </DialogDescription>
              </DialogHeader>
              
              {selectedNotification && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {getNotificationTypeBadge(selectedNotification.type)}
                    {getTargetGroupBadge(selectedNotification.targetGroup)}
                    {getStatusBadge(selectedNotification.isActive, selectedNotification.expiresAt)}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{selectedNotification.title}</h3>
                    <p className="text-muted-foreground">{selectedNotification.content}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {format(parseISO(selectedNotification.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {selectedNotification.updatedAt && (
                      <div>
                        <p className="font-medium">Updated</p>
                        <p className="text-muted-foreground">
                          {format(parseISO(selectedNotification.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    )}
                    {selectedNotification.expiresAt && (
                      <div>
                        <p className="font-medium">Expires</p>
                        <p className="text-muted-foreground">
                          {format(parseISO(selectedNotification.expiresAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                {selectedNotification && (
                  <>
                    <Button 
                      variant={selectedNotification.isActive ? "ghost" : "outline"}
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleToggleStatus(selectedNotification);
                      }}
                    >
                      {selectedNotification.isActive ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditNotification(selectedNotification);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete Notification Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the notification
                  and remove it from all users' notification feeds.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedNotification && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{selectedNotification.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedNotification.content}</p>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground"
                  onClick={confirmDeleteNotification}
                >
                  Delete Notification
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default NotificationsManagement;