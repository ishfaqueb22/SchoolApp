import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Settings, Save, Grid, Lock, BellRing, Users, Mail, GraduationCap, FileText,
  LineChart, Database, AlertTriangle, Shield, RefreshCw, Trash, Check, X, User,
  School, Star, BookText
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const settingsFormSchema = z.object({
  siteName: z.string().min(2, "Site name must be at least 2 characters"),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address"),
  supportEmail: z.string().email("Please enter a valid email address"),
  maxSchoolsPerSearch: z.coerce.number().min(1).max(100),
  maxFeaturedSchools: z.coerce.number().min(1).max(20),
  enableUserRegistration: z.boolean().default(true),
  enableSchoolRegistration: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  autoApproveSchools: z.boolean().default(false),
  autoApproveReviews: z.boolean().default(false),
  maintenanceMode: z.boolean().default(false),
});

const apiSettingsSchema = z.object({
  geminiApiKey: z.string().min(1, "API key is required"),
  enableAI: z.boolean().default(true),
  mapApiKey: z.string().min(1, "API key is required"),
  enableMap: z.boolean().default(true),
  analyticsId: z.string().optional(),
  enableAnalytics: z.boolean().default(true),
});

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Form for general settings
  const settingsForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteName: "SmartSchool Finder",
      siteDescription: "Find the perfect school for your child with intelligent matching and comprehensive information",
      contactEmail: "admin@smartschoolfinder.pk",
      supportEmail: "support@smartschoolfinder.pk",
      maxSchoolsPerSearch: 20,
      maxFeaturedSchools: 6,
      enableUserRegistration: true,
      enableSchoolRegistration: true,
      requireEmailVerification: true,
      autoApproveSchools: false,
      autoApproveReviews: false,
      maintenanceMode: false,
    }
  });
  
  // Form for API settings
  const apiSettingsForm = useForm<z.infer<typeof apiSettingsSchema>>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
      enableAI: true,
      mapApiKey: import.meta.env.VITE_MAP_API_KEY || "",
      enableMap: true,
      analyticsId: "",
      enableAnalytics: false,
    }
  });
  
  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsFormSchema>) => {
      // In a real app, this would send the settings to the API
      console.log("Updating settings:", data);
      
      // Simulate API call
      return new Promise(resolve => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings. Please try again.",
      });
    }
  });
  
  // API settings update mutation
  const updateApiSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof apiSettingsSchema>) => {
      // In a real app, this would send the API settings to the backend
      console.log("Updating API settings:", data);
      
      // Simulate API call
      return new Promise(resolve => setTimeout(() => resolve(data), 1000));
    },
    onSuccess: () => {
      toast({
        title: "API settings updated",
        description: "Your API configuration has been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update API settings. Please try again.",
      });
    }
  });
  
  // Handle general settings form submission
  const onSubmitSettings = (data: z.infer<typeof settingsFormSchema>) => {
    updateSettingsMutation.mutate(data);
  };
  
  // Handle API settings form submission
  const onSubmitApiSettings = (data: z.infer<typeof apiSettingsSchema>) => {
    updateApiSettingsMutation.mutate(data);
  };
  
  return (
    <>
      <Helmet>
        <title>Platform Settings | Admin Dashboard</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
              <p className="text-muted-foreground">
                Configure and customize your SmartSchool Finder platform
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="api">
                <GraduationCap className="h-4 w-4 mr-2" />
                API & Integrations
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="backup">
                <Database className="h-4 w-4 mr-2" />
                Backup & Restore
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
            
            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure basic platform settings and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Platform Information</h3>
                        <FormField
                          control={settingsForm.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                The name displayed across the platform and in emails
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="siteDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormDescription>
                                Brief description used in meta tags and social sharing
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={settingsForm.control}
                            name="contactEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Main contact email displayed on the site
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="supportEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Support Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Email for user support inquiries
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Content Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={settingsForm.control}
                            name="maxSchoolsPerSearch"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Schools Per Search</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Maximum number of schools to display in search results
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="maxFeaturedSchools"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Featured Schools</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Maximum number of featured schools on homepage
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Registration Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={settingsForm.control}
                            name="enableUserRegistration"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Enable User Registration
                                  </FormLabel>
                                  <FormDescription>
                                    Allow new users to register accounts
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="enableSchoolRegistration"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Enable School Registration
                                  </FormLabel>
                                  <FormDescription>
                                    Allow new schools to register on the platform
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="requireEmailVerification"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Require Email Verification
                                  </FormLabel>
                                  <FormDescription>
                                    Users must verify email before full access
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Moderation Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={settingsForm.control}
                            name="autoApproveSchools"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Auto-Approve Schools
                                  </FormLabel>
                                  <FormDescription>
                                    Automatically approve new school registrations
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="autoApproveReviews"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Auto-Approve Reviews
                                  </FormLabel>
                                  <FormDescription>
                                    Automatically approve new school reviews
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="maintenanceMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-full bg-yellow-50 border-yellow-200">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                                    Maintenance Mode
                                  </FormLabel>
                                  <FormDescription>
                                    Put the platform in maintenance mode (only administrators can access)
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          className="ml-auto"
                          disabled={updateSettingsMutation.isPending}
                        >
                          {updateSettingsMutation.isPending ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* API Settings Tab */}
            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>API & Integrations</CardTitle>
                  <CardDescription>
                    Manage third-party API keys and integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiSettingsForm}>
                    <form onSubmit={apiSettingsForm.handleSubmit(onSubmitApiSettings)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">AI Features</h3>
                        <FormField
                          control={apiSettingsForm.control}
                          name="enableAI"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable AI Features
                                </FormLabel>
                                <FormDescription>
                                  Use AI for school matching, recommendations, and chat assistance
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={apiSettingsForm.control}
                          name="geminiApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gemini API Key</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                API key for Google Gemini AI integration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Maps Integration</h3>
                        <FormField
                          control={apiSettingsForm.control}
                          name="enableMap"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable Maps
                                </FormLabel>
                                <FormDescription>
                                  Show interactive maps for school locations
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={apiSettingsForm.control}
                          name="mapApiKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maps API Key</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                API key for map integration (Google Maps or equivalent)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Analytics Integration</h3>
                        <FormField
                          control={apiSettingsForm.control}
                          name="enableAnalytics"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Enable Analytics
                                </FormLabel>
                                <FormDescription>
                                  Track user interactions and platform usage
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={apiSettingsForm.control}
                          name="analyticsId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Analytics ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Tracking ID for analytics integration
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <CardFooter className="px-0 pb-0">
                        <Button 
                          type="submit" 
                          className="ml-auto"
                          disabled={updateApiSettingsMutation.isPending}
                        >
                          {updateApiSettingsMutation.isPending ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save API Settings
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure platform security and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Authentication Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Require 2FA for administrator accounts
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            CAPTCHA Protection
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Enable CAPTCHA on login and registration forms
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Login Attempt Limits
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Lock accounts after 5 failed login attempts
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Password Complexity
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Require strong passwords (min 8 chars, mixed case, numbers)
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Session Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <Input id="session-timeout" type="number" defaultValue="30" />
                        <p className="text-sm text-muted-foreground">
                          Time before an inactive session is automatically logged out
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-sessions">Maximum Sessions Per User</Label>
                        <Input id="max-sessions" type="number" defaultValue="5" />
                        <p className="text-sm text-muted-foreground">
                          Maximum number of concurrent sessions per user
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Content Moderation
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically scan uploaded content for inappropriate material
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Image Scanning
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Scan uploaded images for inappropriate content
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                  
                  <CardFooter className="px-0 pb-0">
                    <Button 
                      className="ml-auto"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Security Settings
                    </Button>
                  </CardFooter>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Backup & Restore Tab */}
            <TabsContent value="backup">
              <Card>
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>
                    Manage platform data backups and restoration options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Database Backups</h3>
                    <div className="border rounded-md">
                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Automatic Daily Backups</h4>
                          <p className="text-sm text-muted-foreground">System performs backups automatically each night</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                      </div>
                      <Separator />
                      <div className="p-4">
                        <div className="flex justify-between mb-4">
                          <h4 className="font-medium">Recent Backups</h4>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center">
                              <Database className="h-4 w-4 mr-2 text-primary" />
                              <span>Backup_20250417_040000.sql</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">105 MB</Badge>
                              <Button variant="ghost" size="sm">Download</Button>
                              <Button variant="ghost" size="sm">Restore</Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center">
                              <Database className="h-4 w-4 mr-2 text-primary" />
                              <span>Backup_20250416_040000.sql</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">103 MB</Badge>
                              <Button variant="ghost" size="sm">Download</Button>
                              <Button variant="ghost" size="sm">Restore</Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center">
                              <Database className="h-4 w-4 mr-2 text-primary" />
                              <span>Backup_20250415_040000.sql</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">102 MB</Badge>
                              <Button variant="ghost" size="sm">Download</Button>
                              <Button variant="ghost" size="sm">Restore</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Manual Backup</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">Create manual backup</h4>
                            <p className="text-sm text-muted-foreground">
                              Generate a complete backup of the platform data
                            </p>
                          </div>
                          <Button>
                            <Database className="h-4 w-4 mr-2" />
                            Create Backup Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Import & Export</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <h4 className="font-medium">Export Platform Data</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Export specific data categories as CSV
                          </p>
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                              <User className="h-4 w-4 mr-2" />
                              Export Users
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <School className="h-4 w-4 mr-2" />
                              Export Schools
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Star className="h-4 w-4 mr-2" />
                              Export Reviews
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <h4 className="font-medium">Import Data</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Import data from CSV files
                          </p>
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                              <User className="h-4 w-4 mr-2" />
                              Import Users
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <School className="h-4 w-4 mr-2" />
                              Import Schools
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Import Content
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Advanced Tab */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Warning: These settings can significantly impact platform functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center bg-red-50/50 border border-red-200 p-4 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-700">
                        These settings are for advanced users only. Changes made here can significantly impact the operation of your platform.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">System Maintenance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto p-4 justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Clear Cache</span>
                            <span className="text-sm text-muted-foreground">
                              Clear application cache files
                            </span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Rebuild Indexes</span>
                            <span className="text-sm text-muted-foreground">
                              Rebuild database search indexes
                            </span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Test System Email</span>
                            <span className="text-sm text-muted-foreground">
                              Send a test email to verify configuration
                            </span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">View System Logs</span>
                            <span className="text-sm text-muted-foreground">
                              Access system and error logs
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Database Operations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto p-4 justify-start">
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Optimize Database</span>
                            <span className="text-sm text-muted-foreground">
                              Optimize database tables and improve performance
                            </span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 justify-start" disabled>
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Reset Database</span>
                            <span className="text-sm text-muted-foreground">
                              Reset database to initial state (irreversible)
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        Danger Zone
                      </h3>
                      <div className="border border-red-200 rounded-md divide-y divide-red-200">
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="font-medium">Clear All Platform Data</h4>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete all data except user accounts
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash className="h-4 w-4 mr-2" />
                                Clear Data
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete all platform data except user accounts.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => setShowDeleteDataDialog(true)}
                                >
                                  Delete Data
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="font-medium">Reset Platform</h4>
                            <p className="text-sm text-muted-foreground">
                              Reset the entire platform to factory settings
                            </p>
                          </div>
                          <Button variant="destructive" disabled>
                            <Trash className="h-4 w-4 mr-2" />
                            Reset Platform
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDataDialog} onOpenChange={setShowDeleteDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Final Confirmation Required
            </DialogTitle>
            <DialogDescription>
              To confirm deletion, please type "DELETE ALL DATA" below. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Confirmation:</Label>
              <Input id="confirm-delete" placeholder="Type DELETE ALL DATA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDataDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive">
              <Trash className="h-4 w-4 mr-2" />
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsPage;