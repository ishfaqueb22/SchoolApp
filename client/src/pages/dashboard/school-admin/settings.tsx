import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  User,
  Mail,
  Key,
  Loader2,
  Image,
  Upload,
  CheckCircle,
  Building2,
  MapPin,
  Phone,
  Globe,
  Calendar,
  BookOpen,
  DollarSign,
  Users,
  Save,
  Info,
  School,
  GraduationCap,
  FileText,
  Check,
  Plus,
  X
} from 'lucide-react';

// Constants for dropdown options
const SCHOOL_TYPES = [
  "Public",
  "Private",
  "Semi-Government",
  "International",
  "Religious",
  "Military",
  "Montessori",
  "Waldorf",
  "Special Education"
];

const CURRICULUM_TYPES = [
  "National Curriculum",
  "Cambridge International",
  "International Baccalaureate (IB)",
  "American Curriculum",
  "British Curriculum",
  "Montessori",
  "Religious Curriculum",
  "Technical/Vocational"
];

const GRADE_RANGES = [
  "Pre-Primary Only",
  "Pre-Primary to Primary",
  "Pre-Primary to Middle",
  "Pre-Primary to Secondary",
  "Primary to Middle",
  "Primary to Secondary",
  "Middle to Secondary",
  "Secondary Only",
  "All Levels (Pre-Primary to Higher Secondary)"
];

const CLASS_SIZES = [
  "Small (Less than 15 students)",
  "Medium (15-25 students)",
  "Large (26-35 students)",
  "Very Large (More than 35 students)"
];

const TUITION_RANGES = [
  "Free / Government Supported",
  "Low (Less than 10,000 PKR monthly)",
  "Moderate (10,000 - 25,000 PKR monthly)",
  "High (25,000 - 50,000 PKR monthly)",
  "Premium (More than 50,000 PKR monthly)"
];

const SCHOOL_FEATURES = [
  "Computer Lab",
  "Science Lab",
  "Library",
  "Sports Ground",
  "Swimming Pool",
  "Music Room",
  "Art Studio",
  "Cafeteria",
  "Prayer Hall",
  "Transport Service",
  "Boarding Facilities",
  "Smart Classrooms",
  "Auditorium",
  "Medical Facility",
  "Counseling Services",
  "Special Needs Support",
  "Extracurricular Activities",
  "Digital Learning Tools",
  "Scholarships Available"
];

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SchoolAdminLayout } from '@/components/layouts/school-admin-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// Profile update schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  avatarUrl: z.string().nullable().optional(),
});

// Password update schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// School information schema
const schoolFormSchema = z.object({
  name: z.string().min(2, { message: "School name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  location: z.string().min(2, { message: "Location is required." }),
  address: z.string().min(5, { message: "Full address is required." }),
  type: z.string({ required_error: "School type is required" }),
  curriculumType: z.string({ required_error: "Curriculum type is required" }),
  gradeRange: z.string({ required_error: "Grade range is required" }),
  classSize: z.string().optional(),
  tuitionRange: z.string().optional(),
  hasFinancialAid: z.boolean().default(false),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }).optional().nullable(),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }).optional(),
  contactPhone: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional(),
  establishedYear: z.string().optional(),
  multiCampus: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type SchoolFormValues = z.infer<typeof schoolFormSchema>;

const SchoolAdminSettings = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploadingSchoolImage, setIsUploadingSchoolImage] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const { schoolId: paramSchoolId } = useParams();
  // Try to get schoolId from the URL first, then from the user object, then from the query string
  // School ID should come from one of these sources
  const schoolId = paramSchoolId || (user?.schoolId?.toString() || "");
  
  // Debug log to track schoolId resolution
  console.log("School Admin Settings - schoolId resolution:", { 
    paramSchoolId, 
    userSchoolId: user?.schoolId, 
    resolvedSchoolId: schoolId 
  });
  
  // School form
  const schoolForm = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      address: "",
      type: "",
      curriculumType: "",
      gradeRange: "",
      classSize: "",
      tuitionRange: "",
      hasFinancialAid: false,
      features: [],
      imageUrl: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      establishedYear: "",
      multiCampus: false,
    },
  });
  
  // Fetch school information
  const { data: schoolData, isLoading: isLoadingSchool } = useQuery({
    queryKey: [`/api/admin/schools/${schoolId}/settings`],
    queryFn: async () => {
      if (!schoolId) return null;
      const response = await apiRequest('GET', `/api/admin/schools/${schoolId}/settings`);
      return response.json();
    },
    enabled: !!schoolId && !!user,
    refetchOnWindowFocus: false,
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      avatarUrl: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest('PUT', `/api/auth/profile`, data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      // Invalidate queries that might use user data
      // This will trigger a refresh of the user data in AuthContext
      queryClient.invalidateQueries({
        queryKey: ['/api/auth/me'],
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast({
        title: "Failed to update profile",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('PUT', `/api/auth/password`, data);
      return await response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Failed to update password:", error);
      
      // Handle specific error for incorrect current password
      if (error.status === 401) {
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect",
        });
      } else {
        toast({
          title: "Failed to update password",
          description: "There was an error updating your password. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // In a real app, you would upload the file to a server or cloud storage
      // For this example, we'll simulate an upload delay and use a data URL
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const avatarUrl = e.target.result as string;
          
          // In a real implementation, you would upload the file and get a URL
          // Then update the form with the URL from the server
          
          // Simulate server delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the form
          profileForm.setValue('avatarUrl', avatarUrl);
          
          setIsUploading(false);
          
          toast({
            title: "Avatar uploaded",
            description: "Your avatar has been uploaded. Don't forget to save your profile.",
            variant: "default",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setIsUploading(false);
      
      toast({
        title: "Failed to upload avatar",
        description: "There was an error uploading your avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle profile submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };
  
  // Update school mutation
  const updateSchoolMutation = useMutation({
    mutationFn: async (data: SchoolFormValues) => {
      console.log("Updating school with ID:", schoolId, "and data:", data);
      
      if (!schoolId) {
        throw new Error("No school ID available. Please create a school first.");
      }
      
      try {
        const response = await apiRequest('PUT', `/api/admin/schools/${schoolId}/settings`, data);
        return await response.json();
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (updatedSchool) => {
      console.log("School updated successfully:", updatedSchool);
      
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/schools/${schoolId}/settings`],
      });
      
      toast({
        title: "School information updated",
        description: "Your school information has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update school information:", error);
      toast({
        title: "Failed to update school information",
        description: error instanceof Error ? error.message : "There was an error updating your school information. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle school image upload
  const handleSchoolImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingSchoolImage(true);
      
      // In a real app, you would upload the file to a server or cloud storage
      // For this example, we'll simulate an upload delay and use a data URL
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;
          
          // In a real implementation, you would upload the file and get a URL
          // Then update the form with the URL from the server
          
          // Simulate server delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the form
          schoolForm.setValue('imageUrl', imageUrl);
          
          setIsUploadingSchoolImage(false);
          
          toast({
            title: "School image uploaded",
            description: "Your school image has been uploaded. Don't forget to save your school information.",
            variant: "default",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload school image:", error);
      setIsUploadingSchoolImage(false);
      
      toast({
        title: "Failed to upload school image",
        description: "There was an error uploading your school image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Toggle feature selection
  const toggleFeature = (feature: string) => {
    const currentFeatures = schoolForm.getValues('features') || [];
    if (currentFeatures.includes(feature)) {
      const updatedFeatures = currentFeatures.filter(f => f !== feature);
      schoolForm.setValue('features', updatedFeatures);
      setSelectedFeatures(updatedFeatures);
    } else {
      const updatedFeatures = [...currentFeatures, feature];
      schoolForm.setValue('features', updatedFeatures);
      setSelectedFeatures(updatedFeatures);
    }
  };

  // Handle school form submission
  const onSchoolSubmit = (data: SchoolFormValues) => {
    updateSchoolMutation.mutate(data);
  };

  // Update user form values when user data is available
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, profileForm]);
  
  // Update school form values when school data is available
  useEffect(() => {
    if (schoolData && !isLoadingSchool) {
      const features = schoolData.features || [];
      schoolForm.reset({
        name: schoolData.name || "",
        description: schoolData.description || "",
        location: schoolData.location || "",
        address: schoolData.address || "",
        type: schoolData.type || "",
        curriculumType: schoolData.curriculumType || "",
        gradeRange: schoolData.gradeRange || "",
        classSize: schoolData.classSize || "",
        tuitionRange: schoolData.tuitionRange || "",
        hasFinancialAid: schoolData.hasFinancialAid || false,
        features: features,
        imageUrl: schoolData.imageUrl || "",
        contactEmail: schoolData.contactEmail || "",
        contactPhone: schoolData.contactPhone || "",
        website: schoolData.website || "",
        establishedYear: schoolData.establishedYear ? schoolData.establishedYear.toString() : "",
        multiCampus: schoolData.multiCampus || false,
      });
      setSelectedFeatures(features);
    }
  }, [schoolData, isLoadingSchool, schoolForm]);

  return (
    <>
      <Helmet>
        <title>Settings | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and profile information.
            </p>
          </div>
          
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="school">School Information</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile picture.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {authLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex flex-col items-center space-y-3">
                          <Avatar className="h-24 w-24">
                            <AvatarImage 
                              src={profileForm.watch("avatarUrl") || ""} 
                              alt={user?.fullName || "User"} 
                            />
                            <AvatarFallback className="text-2xl">
                              {user?.fullName?.substring(0, 2).toUpperCase() || "SC"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex flex-col items-center">
                            <label 
                              htmlFor="avatar-upload" 
                              className="cursor-pointer text-sm text-primary hover:underline flex items-center"
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-1" />
                              )}
                              {isUploading ? "Uploading..." : "Upload new image"}
                            </label>
                            <Input 
                              id="avatar-upload" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleAvatarUpload}
                              disabled={isUploading}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG or GIF. Max 5MB.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-10" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-10" {...field} type="email" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button 
                                type="submit" 
                                className="mt-2"
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Profile
                              </Button>
                            </form>
                          </Form>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {authLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters long.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="mt-2"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Password
                        </Button>
                        
                        {updatePasswordMutation.isSuccess && (
                          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>
                              Your password has been updated successfully.
                            </AlertDescription>
                          </Alert>
                        )}
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="school" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                  <CardDescription>
                    Update your school's details and information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSchool ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...schoolForm}>
                      <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="md:col-span-2 space-y-6">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="border rounded-md overflow-hidden w-48 h-48 flex items-center justify-center bg-gray-50">
                                {schoolForm.watch("imageUrl") ? (
                                  <img 
                                    src={schoolForm.watch("imageUrl") || ""} 
                                    alt={schoolForm.watch("name") || "School"} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <School className="h-16 w-16 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <label 
                                  htmlFor="school-image-upload" 
                                  className="cursor-pointer text-sm text-primary hover:underline flex items-center"
                                >
                                  {isUploadingSchoolImage ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Image className="h-4 w-4 mr-1" />
                                  )}
                                  {isUploadingSchoolImage ? "Uploading..." : "Upload school image"}
                                </label>
                                <Input 
                                  id="school-image-upload" 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleSchoolImageUpload}
                                  disabled={isUploadingSchoolImage}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  JPG, PNG or GIF. Max 5MB.
                                </p>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                              <div className="grid gap-4">
                                <FormField
                                  control={schoolForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>School Name</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <School className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>School Description</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          className="min-h-[120px]" 
                                          placeholder="Provide a detailed description of your school..."
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4">Location & Contact</h3>
                              <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                  control={schoolForm.control}
                                  name="location"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>City/Location</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="address"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Address</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="contactEmail"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Contact Email</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" type="email" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="contactPhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Contact Phone</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="website"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Website URL</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" type="url" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="establishedYear"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Established Year</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input className="pl-10" {...field} />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4">Academic Information</h3>
                              <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                  control={schoolForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>School Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a school type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {SCHOOL_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="curriculumType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Curriculum Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a curriculum type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {CURRICULUM_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="gradeRange"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Grade Range</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select grade range" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {GRADE_RANGES.map((range) => (
                                            <SelectItem key={range} value={range}>{range}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="classSize"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Class Size</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select class size" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {CLASS_SIZES.map((size) => (
                                            <SelectItem key={size} value={size}>{size}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                              <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                  control={schoolForm.control}
                                  name="tuitionRange"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tuition Range</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select tuition range" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {TUITION_RANGES.map((range) => (
                                            <SelectItem key={range} value={range}>{range}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={schoolForm.control}
                                  name="hasFinancialAid"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Financial Aid Available</FormLabel>
                                        <FormDescription>
                                          Does your school offer financial aid or scholarships?
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
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4">School Features</h3>
                              <FormField
                                control={schoolForm.control}
                                name="features"
                                render={() => (
                                  <FormItem>
                                    <div className="mb-4">
                                      <FormLabel>Select All Applicable Features</FormLabel>
                                      <FormDescription>
                                        Choose the facilities and features available at your school.
                                      </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {SCHOOL_FEATURES.map((feature) => (
                                        <Badge
                                          key={feature}
                                          variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                                          className="mr-1 mb-1 cursor-pointer hover:bg-muted-foreground/10 px-3 py-2"
                                          onClick={() => toggleFeature(feature)}
                                        >
                                          {selectedFeatures.includes(feature) && (
                                            <Check className="h-3 w-3 mr-1" />
                                          )}
                                          <span>{feature}</span>
                                        </Badge>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator />
                            
                            <FormField
                              control={schoolForm.control}
                              name="multiCampus"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Multiple Campuses</FormLabel>
                                    <FormDescription>
                                      Does your school have multiple campuses?
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
                        
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto" 
                          disabled={updateSchoolMutation.isPending}
                        >
                          {updateSchoolMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save School Information
                        </Button>
                        
                        {updateSchoolMutation.isSuccess && (
                          <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>
                              Your school information has been updated successfully.
                            </AlertDescription>
                          </Alert>
                        )}
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SchoolAdminLayout>
    </>
  );
};

export default SchoolAdminSettings;