import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SchoolAdminLayout } from "@/components/layouts/school-admin-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { School, SchoolCategory, SchoolMedia } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  School as SchoolIcon,
  Users,
  FileText,
  MessageSquare,
  Star,
  Calendar,
  Map,
  Image,
  Upload,
  Plus,
  RefreshCw,
  Filter,
  Tag,
  Edit,
  Trash2,
  AlertCircle,
  Check,
  X,
  Info,
  ExternalLink,
  Building,
  Phone,
  Mail,
  Globe,
  BookOpen,
  Layers,
  Briefcase,
  PlayCircle as Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types for metrics
interface SchoolMetrics {
  stats: {
    totalCampuses: number;
    totalFaculty: number;
    activeFacultyCount: number;
    totalInquiries: number;
    newInquiriesCount: number;
    totalReviews: number;
    averageRating: number;
    totalPosts: number;
    publishedPostsCount: number;
  };
  trends: {
    inquiries: {
      labels: string[];
      data: number[];
    };
    reviews: {
      labels: string[];
      data: number[];
    };
  };
  recentInquiries: any[];
  recentReviews: any[];
  recentPosts: any[];
}

// School details form schema
const schoolDetailsSchema = z.object({
  name: z.string().min(3, { message: "School name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  type: z.string().min(1, { message: "School type is required" }),
  location: z.string().min(2, { message: "Location is required" }),
  address: z.string().min(5, { message: "Full address is required" }),
  curriculumType: z.string().min(1, { message: "Curriculum type is required" }),
  gradeRange: z.string().min(1, { message: "Grade range is required" }),
  classSize: z.string().optional(),
  website: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
  contactEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  establishedYear: z.string().optional(),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).optional(),
  multiCampus: z.boolean().optional(),
  hasFinancialAid: z.boolean().optional(),
});

// School media form schema
const schoolMediaSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  type: z.string().min(1, { message: "Media type is required" }),
  url: z.string().url({ message: "Must be a valid URL" }),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  isPublic: z.boolean().default(true),
});

// Post form schema
const postFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  type: z.string().min(1, { message: "Post type is required." }),
  campusId: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  eventDate: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

// Post types
const postTypes = [
  "announcement",
  "event",
  "news",
  "update",
  "featured"
];

const SchoolAdminDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SchoolMedia | null>(null);
  const [isDeleteMediaDialogOpen, setIsDeleteMediaDialogOpen] = useState(false);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [quickPostType, setQuickPostType] = useState("announcement");
  
  // Fetch schools administered by the current user
  const { 
    data: adminSchools, 
    isLoading: isLoadingSchools,
    error: schoolsError 
  } = useQuery<School[]>({
    queryKey: ['/api/admin/schools'],
    queryFn: async () => {
      const response = await fetch('/api/admin/schools', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch admin schools');
      }
      return response.json();
    },
    retry: 1,
  });

  // Set selected school on initial load
  useEffect(() => {
    if (adminSchools && adminSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(adminSchools[0].id);
    }
  }, [adminSchools, selectedSchoolId]);

  // Fetch dashboard data for the selected school
  const { 
    data: dashboardData,
    isLoading: isLoadingDashboard
  } = useQuery<{
    school: School;
    stats: SchoolMetrics['stats'];
    trends: SchoolMetrics['trends'];
    recentInquiries: any[];
    recentReviews: any[];
    recentPosts: any[];
  }>({
    queryKey: ['/api/admin/dashboard', selectedSchoolId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/dashboard/${selectedSchoolId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
    enabled: !!selectedSchoolId,
    retry: 1,
  });

  // Fetch school categories
  const {
    data: categories,
    isLoading: isLoadingCategories
  } = useQuery<SchoolCategory[]>({
    queryKey: ['/api/school-categories'],
    queryFn: async () => {
      const response = await fetch('/api/school-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch school categories');
      }
      return response.json();
    }
  });

  // Fetch categories assigned to this school
  const {
    data: schoolCategories,
    isLoading: isLoadingSchoolCategories
  } = useQuery<SchoolCategory[]>({
    queryKey: ['/api/schools', selectedSchoolId, 'categories'],
    queryFn: async () => {
      const response = await fetch(`/api/schools/${selectedSchoolId}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch school categories');
      }
      return response.json();
    },
    enabled: !!selectedSchoolId,
  });

  // Fetch school media
  const {
    data: schoolMedia,
    isLoading: isLoadingSchoolMedia
  } = useQuery<SchoolMedia[]>({
    queryKey: ['/api/schools', selectedSchoolId, 'media'],
    queryFn: async () => {
      const response = await fetch(`/api/schools/${selectedSchoolId}/media`);
      if (!response.ok) {
        throw new Error('Failed to fetch school media');
      }
      return response.json();
    },
    enabled: !!selectedSchoolId,
  });

  // School details form
  const detailsForm = useForm<z.infer<typeof schoolDetailsSchema>>({
    resolver: zodResolver(schoolDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      location: "",
      address: "",
      curriculumType: "",
      gradeRange: "",
      classSize: "",
      website: "",
      contactEmail: "",
      contactPhone: "",
      establishedYear: "",
      imageUrl: "",
      features: [],
      multiCampus: false,
      hasFinancialAid: false,
    }
  });

  // Media form
  const mediaForm = useForm<z.infer<typeof schoolMediaSchema>>({
    resolver: zodResolver(schoolMediaSchema),
    defaultValues: {
      title: "",
      type: "image",
      url: "",
      description: "",
      thumbnail: "",
      isPublic: true,
    }
  });

  // Update form when school details change
  useEffect(() => {
    if (dashboardData?.school) {
      const school = dashboardData.school;
      detailsForm.reset({
        name: school.name || "",
        description: school.description || "",
        type: school.type || "",
        location: school.location || "",
        address: school.address || "",
        curriculumType: school.curriculumType || "",
        gradeRange: school.gradeRange || "",
        classSize: school.classSize || "",
        website: school.website || "",
        contactEmail: school.contactEmail || "",
        contactPhone: school.contactPhone || "",
        establishedYear: school.establishedYear || "",
        imageUrl: school.imageUrl || "",
        features: school.features || [],
        multiCampus: school.multiCampus || false,
        hasFinancialAid: school.hasFinancialAid || false,
      });
    }
  }, [dashboardData, detailsForm]);

  // Update media form when editing media
  useEffect(() => {
    if (selectedMedia) {
      mediaForm.reset({
        title: selectedMedia.title,
        type: selectedMedia.type,
        url: selectedMedia.url,
        description: selectedMedia.description || "",
        thumbnail: selectedMedia.thumbnail || "",
        isPublic: selectedMedia.isPublic,
      });
    } else {
      mediaForm.reset({
        title: "",
        type: "image",
        url: "",
        description: "",
        thumbnail: "",
        isPublic: true,
      });
    }
  }, [selectedMedia, mediaForm]);

  // Mutation to update school details
  const updateSchoolMutation = useMutation({
    mutationFn: async (schoolData: z.infer<typeof schoolDetailsSchema>) => {
      const response = await fetch(`/api/admin/dashboard/${selectedSchoolId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(schoolData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update school details');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "School updated",
        description: "School details have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard', selectedSchoolId] });
      setIsDetailsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to add or update school media
  const upsertMediaMutation = useMutation({
    mutationFn: async (mediaData: z.infer<typeof schoolMediaSchema>) => {
      const url = selectedMedia 
        ? `/api/schools/${selectedSchoolId}/media/${selectedMedia.id}` 
        : `/api/schools/${selectedSchoolId}/media`;
      
      const method = selectedMedia ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...mediaData,
          schoolId: selectedSchoolId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save media');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: selectedMedia ? "Media updated" : "Media added",
        description: `Media has been ${selectedMedia ? "updated" : "added"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schools', selectedSchoolId, 'media'] });
      setIsMediaDialogOpen(false);
      setSelectedMedia(null);
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to delete school media
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await fetch(`/api/schools/${selectedSchoolId}/media/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete media');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Media deleted",
        description: "Media has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/schools', selectedSchoolId, 'media'] });
      setIsDeleteMediaDialogOpen(false);
      setSelectedMedia(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to add category to school
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/schools/${selectedSchoolId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ categoryId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools', selectedSchoolId, 'categories'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to remove category from school
  const removeCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/schools/${selectedSchoolId}/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools', selectedSchoolId, 'categories'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle school details form submission
  const onSubmitSchoolDetails = (data: z.infer<typeof schoolDetailsSchema>) => {
    updateSchoolMutation.mutate(data);
  };

  // Handle media form submission
  const onSubmitMedia = (data: z.infer<typeof schoolMediaSchema>) => {
    upsertMediaMutation.mutate(data);
  };
  
  // Handle post form submission
  const onSubmitPost = (data: z.infer<typeof postFormSchema>) => {
    createPostMutation.mutate(data);
  };

  // Handle opening the create post dialog with specific type
  const handleCreatePost = (type: string = "announcement") => {
    setQuickPostType(type);
    postForm.reset({
      title: "",
      content: "",
      type: type,
      campusId: null,
      imageUrl: "",
      eventDate: type === "event" ? new Date().toISOString().split('T')[0] : "",
      isPublished: true,
    });
    setIsCreatePostDialogOpen(true);
  };


  // Post form
  const postForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "announcement",
      campusId: null,
      imageUrl: "",
      eventDate: "",
      isPublished: true,
    }
  });

  // Mutation to create post
  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof postFormSchema>) => {
      const response = await apiRequest('POST', `/api/admin/schools/${selectedSchoolId}/posts`, {
        ...data,
        schoolId: selectedSchoolId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/dashboard', selectedSchoolId],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', selectedSchoolId, 'posts'],
      });
      postForm.reset({
        title: "",
        content: "",
        type: quickPostType,
        campusId: null,
        imageUrl: "",
        eventDate: "",
        isPublished: true,
      });
      setIsCreatePostDialogOpen(false);
      toast({
        title: "Post created",
        description: "Your post has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle adding a new media item
  const handleAddMedia = () => {
    setSelectedMedia(null);
    mediaForm.reset({
      title: "",
      type: "image",
      url: "",
      description: "",
      thumbnail: "",
      isPublic: true,
    });
    setIsMediaDialogOpen(true);
  };

  // Handle editing media
  const handleEditMedia = (media: SchoolMedia) => {
    setSelectedMedia(media);
    setIsMediaDialogOpen(true);
  };

  // Handle deleting media
  const handleDeleteMedia = (media: SchoolMedia) => {
    setSelectedMedia(media);
    setIsDeleteMediaDialogOpen(true);
  };

  // Handle confirming media deletion
  const confirmDeleteMedia = () => {
    if (selectedMedia) {
      deleteMediaMutation.mutate(selectedMedia.id);
    }
  };

  // Check if a category is assigned to the school
  const isCategoryAssigned = (categoryId: number) => {
    return schoolCategories?.some(cat => cat.id === categoryId) || false;
  };

  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    if (isCategoryAssigned(categoryId)) {
      removeCategoryMutation.mutate(categoryId);
    } else {
      addCategoryMutation.mutate(categoryId);
    }
  };

  // Format metrics data for charts
  const formatMetricsData = () => {
    if (!dashboardData?.trends) return { inquiriesData: [], reviewsData: [] };
    
    const { inquiries, reviews } = dashboardData.trends;
    
    const inquiriesData = inquiries.labels.map((label, index) => ({
      name: label,
      value: inquiries.data[index] || 0,
    }));
    
    const reviewsData = reviews.labels.map((label, index) => ({
      name: label,
      value: reviews.data[index] || 0,
    }));
    
    return { inquiriesData, reviewsData };
  };

  // Extract metrics from the dashboard data
  const metrics = dashboardData?.stats || {
    totalCampuses: 0,
    totalFaculty: 0,
    activeFacultyCount: 0,
    totalInquiries: 0,
    newInquiriesCount: 0,
    totalReviews: 0,
    averageRating: 0,
    totalPosts: 0,
    publishedPostsCount: 0,
  };

  // Prepare chart data
  const { inquiriesData, reviewsData } = formatMetricsData();
  
  // Get the selected school
  const selectedSchool = dashboardData?.school;
  
  // Current date for dashboard
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");

  // Check if user has no schools yet
  const hasNoSchools = !isLoadingSchools && (!adminSchools || adminSchools.length === 0);
  
  // Loading states
  const isLoading = isLoadingSchools || isLoadingDashboard || isLoadingCategories || isLoadingSchoolCategories || isLoadingSchoolMedia;

  // Generate pie chart data for inquiries status
  const inquiryStatusData = [
    { name: 'New', value: metrics.newInquiriesCount },
    { name: 'Pending', value: metrics.totalInquiries - metrics.newInquiriesCount },
  ];

  // Generate pie chart data for posts status
  const postsStatusData = [
    { name: 'Published', value: metrics.publishedPostsCount },
    { name: 'Drafts', value: metrics.totalPosts - metrics.publishedPostsCount },
  ];

  // Generate colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"];

  return (
    <>
      <Helmet>
        <title>School Admin Dashboard | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">School Dashboard</h2>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
            
            {adminSchools && adminSchools.length > 0 && (
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedSchoolId?.toString()} 
                  onValueChange={(val) => setSelectedSchoolId(parseInt(val))}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* No schools message */}
          {hasNoSchools && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 text-center">
                <div className="mb-4 flex justify-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Schools Found</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  You don't have any schools registered yet. Add your first school to get started.
                </p>
                <Button onClick={() => navigate("/admin/school-registration")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register School
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Dashboard content when schools exist */}
          {!hasNoSchools && selectedSchoolId && (
            <>
              {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <Skeleton className="h-[180px] w-full" />
                  <Skeleton className="h-[180px] w-full" />
                  <Skeleton className="h-[180px] w-full" />
                </div>
              ) : (
                <>
                  {/* School profile card */}
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="flex items-center">
                          <SchoolIcon className="mr-2 h-5 w-5 text-primary" />
                          {selectedSchool?.name || "School Profile"}
                        </CardTitle>
                        <CardDescription>
                          {selectedSchool?.type} • {selectedSchool?.location}
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setIsDetailsDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
                        <div className="lg:col-span-2">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                              <p className="text-sm line-clamp-3">{selectedSchool?.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">{selectedSchool?.curriculumType}</span>
                              </div>
                              <div className="flex items-center">
                                <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">{selectedSchool?.gradeRange}</span>
                              </div>
                              {selectedSchool?.website && (
                                <div className="flex items-center">
                                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <a 
                                    href={selectedSchool.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center"
                                  >
                                    Website
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </div>
                              )}
                              {selectedSchool?.contactEmail && (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="text-sm">{selectedSchool.contactEmail}</span>
                                </div>
                              )}
                              {selectedSchool?.contactPhone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="text-sm">{selectedSchool.contactPhone}</span>
                                </div>
                              )}
                              {selectedSchool?.establishedYear && (
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="text-sm">Est. {selectedSchool.establishedYear}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Categories */}
                            {schoolCategories && schoolCategories.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                  {schoolCategories.map(category => (
                                    <Badge 
                                      key={category.id} 
                                      variant="secondary"
                                      style={{ backgroundColor: category.color, color: '#fff' }}
                                    >
                                      {category.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* School image */}
                        <div className="relative h-40 lg:h-auto overflow-hidden rounded-md border">
                          {selectedSchool?.imageUrl ? (
                            <img 
                              src={selectedSchool.imageUrl} 
                              alt={selectedSchool.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <SchoolIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="media">Media Gallery</TabsTrigger>
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>
                    
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                      {/* Quick Actions */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Quick Actions</CardTitle>
                          <CardDescription>Create and manage school content</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Button 
                              onClick={() => handleCreatePost("announcement")}
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 space-y-2"
                            >
                              <AlertCircle className="h-8 w-8 text-orange-500" />
                              <span>Announcement</span>
                            </Button>
                            <Button 
                              onClick={() => handleCreatePost("event")}
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 space-y-2"
                            >
                              <Calendar className="h-8 w-8 text-blue-500" />
                              <span>Event</span>
                            </Button>
                            <Button 
                              onClick={() => handleCreatePost("news")}
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 space-y-2"
                            >
                              <FileText className="h-8 w-8 text-green-500" />
                              <span>News</span>
                            </Button>
                            <Button 
                              onClick={() => handleCreatePost("update")}
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 space-y-2"
                            >
                              <RefreshCw className="h-8 w-8 text-purple-500" />
                              <span>Update</span>
                            </Button>
                            <Button 
                              onClick={() => handleCreatePost("featured")}
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 space-y-2"
                            >
                              <Star className="h-8 w-8 text-amber-500" />
                              <span>Featured</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Key metrics */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Total Inquiries
                            </CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalInquiries}</div>
                            <p className="text-xs text-muted-foreground">
                              {metrics.newInquiriesCount} new inquiries
                            </p>
                            <Progress 
                              value={metrics.totalInquiries > 0 ? (metrics.newInquiriesCount / metrics.totalInquiries) * 100 : 0} 
                              className="mt-2" 
                            />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Faculty
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalFaculty}</div>
                            <p className="text-xs text-muted-foreground">
                              {metrics.activeFacultyCount} active members
                            </p>
                            <Progress 
                              value={metrics.totalFaculty > 0 ? (metrics.activeFacultyCount / metrics.totalFaculty) * 100 : 0} 
                              className="mt-2" 
                            />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Reviews
                            </CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalReviews}</div>
                            <p className="text-xs text-muted-foreground">
                              {metrics.averageRating.toFixed(1)} avg. rating
                            </p>
                            <Progress 
                              value={(metrics.averageRating / 5) * 100} 
                              className="mt-2" 
                            />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Content
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalPosts}</div>
                            <p className="text-xs text-muted-foreground">
                              {metrics.publishedPostsCount} published posts
                            </p>
                            <Progress 
                              value={metrics.totalPosts > 0 ? (metrics.publishedPostsCount / metrics.totalPosts) * 100 : 0} 
                              className="mt-2" 
                            />
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Charts row */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Inquiries Over Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inquiriesData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <RechartsTooltip />
                                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Reviews Over Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reviewsData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <RechartsTooltip />
                                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Status distribution charts */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Inquiry Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={inquiryStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {inquiryStatusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Content Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={postsStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {postsStatusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Recent items */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Inquiries</CardTitle>
                            <CardDescription>
                              Latest inquiries from prospective students/parents
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {dashboardData?.recentInquiries && dashboardData.recentInquiries.length > 0 ? (
                              <div className="space-y-4">
                                {dashboardData.recentInquiries.map((inquiry) => (
                                  <div key={inquiry.id} className="flex items-start space-x-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback>{inquiry.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium">{inquiry.name}</h4>
                                        <Badge variant={inquiry.status === 'new' ? 'default' : 'outline'} className="text-xs">
                                          {inquiry.status}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{inquiry.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                                <p>No recent inquiries</p>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <Link to={`/admin/schools/${selectedSchoolId}/inquiries`}>View All Inquiries</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Reviews</CardTitle>
                            <CardDescription>
                              Latest reviews from the community
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {dashboardData?.recentReviews && dashboardData.recentReviews.length > 0 ? (
                              <div className="space-y-4">
                                {dashboardData.recentReviews.map((review) => (
                                  <div key={review.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{review.userName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{review.userName || 'Anonymous'}</span>
                                      </div>
                                      <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3.5 w-3.5 ${
                                              i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <Star className="mx-auto h-8 w-8 mb-2" />
                                <p>No reviews yet</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Recent Posts</CardTitle>
                            <CardDescription>
                              Latest content published for your school
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {dashboardData?.recentPosts && dashboardData.recentPosts.length > 0 ? (
                              <div className="space-y-4">
                                {dashboardData.recentPosts.map((post) => (
                                  <div key={post.id} className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <Badge variant="outline" className="mt-0.5">
                                        {post.type}
                                      </Badge>
                                      <div>
                                        <h4 className="text-sm font-medium line-clamp-1">{post.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(post.createdAt), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    </div>
                                    {post.content && (
                                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <FileText className="mx-auto h-8 w-8 mb-2" />
                                <p>No posts yet</p>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <Link to={`/admin/schools/${selectedSchoolId}/posts`}>Manage Content</Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    {/* Media Gallery Tab */}
                    <TabsContent value="media" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Media Gallery</h3>
                        <Button onClick={handleAddMedia}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Media
                        </Button>
                      </div>
                      
                      {schoolMedia && schoolMedia.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {schoolMedia.map((media) => (
                            <Card key={media.id} className="overflow-hidden">
                              <div className="aspect-video w-full relative group">
                                {media.type === 'image' ? (
                                  <img
                                    src={media.url}
                                    alt={media.title}
                                    className="object-cover w-full h-full"
                                  />
                                ) : media.type === 'video' ? (
                                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                                    {media.thumbnail ? (
                                      <img
                                        src={media.thumbnail}
                                        alt={media.title}
                                        className="object-cover w-full h-full opacity-70"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-muted/80" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="h-12 w-12 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Map className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Overlay with actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="secondary"
                                          onClick={() => handleEditMedia(media)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handleDeleteMedia(media)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          asChild
                                        >
                                          <a 
                                            href={media.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <h4 className="font-medium">{media.title}</h4>
                                    {media.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {media.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant={media.isPublic ? "default" : "outline"}>
                                    {media.isPublic ? "Public" : "Private"}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="bg-muted/50">
                          <CardContent className="pt-6 text-center">
                            <div className="mb-4 flex justify-center">
                              <Image className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No Media Found</h3>
                            <p className="text-muted-foreground mt-2 mb-4">
                              Add images, videos or virtual tours to showcase your school.
                            </p>
                            <Button onClick={handleAddMedia}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Media
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    {/* Categories Tab */}
                    <TabsContent value="categories" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">School Categories</h3>
                      </div>
                      
                      {categories && categories.length > 0 ? (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Assigned Categories</CardTitle>
                              <CardDescription>
                                Categories help students and parents find your school when searching
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map((category) => {
                                  const isAssigned = isCategoryAssigned(category.id);
                                  return (
                                    <div 
                                      key={category.id} 
                                      className={`flex items-center justify-between p-3 rounded-md border ${
                                        isAssigned ? 'bg-primary/10 border-primary/20' : 'bg-background'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div 
                                          className="w-4 h-4 rounded-full" 
                                          style={{ backgroundColor: category.color || '#3498db' }} 
                                        />
                                        <div>
                                          <p className="font-medium text-sm">{category.name}</p>
                                          {category.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                              {category.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Button 
                                        variant={isAssigned ? "default" : "outline"} 
                                        size="sm"
                                        onClick={() => toggleCategory(category.id)}
                                      >
                                        {isAssigned ? <Check className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                                        {isAssigned ? "Assigned" : "Add"}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card className="bg-muted/50">
                          <CardContent className="pt-6 text-center">
                            <div className="mb-4 flex justify-center">
                              <Tag className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No Categories Available</h3>
                            <p className="text-muted-foreground mt-2 mb-4">
                              Categories are managed by platform administrators.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                    
                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Analytics</CardTitle>
                          <CardDescription>
                            Track key metrics to understand how your school is performing
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                              <div className="bg-muted rounded-md p-3">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Inquiries</h4>
                                <p className="text-2xl font-bold">{metrics.totalInquiries}</p>
                              </div>
                              <div className="bg-muted rounded-md p-3">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Average Rating</h4>
                                <div className="flex items-center">
                                  <p className="text-2xl font-bold mr-2">{metrics.averageRating.toFixed(1)}</p>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.round(metrics.averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-muted rounded-md p-3">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Faculty</h4>
                                <p className="text-2xl font-bold">{metrics.totalFaculty}</p>
                              </div>
                              <div className="bg-muted rounded-md p-3">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Content Posts</h4>
                                <p className="text-2xl font-bold">{metrics.totalPosts}</p>
                              </div>
                            </div>
                            
                            <div className="h-[300px] mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={[...inquiriesData]}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <RechartsTooltip />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Inquiries"
                                    stroke="#0088FE"
                                    activeDot={{ r: 8 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </>
          )}

          {/* School Details Dialog */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit School Profile</DialogTitle>
                <DialogDescription>
                  Update your school's information to keep it accurate and showcase its best features.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...detailsForm}>
                <form onSubmit={detailsForm.handleSubmit(onSubmitSchoolDetails)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Type</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select school type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Public">Public</SelectItem>
                              <SelectItem value="Private">Private</SelectItem>
                              <SelectItem value="Charter">Charter</SelectItem>
                              <SelectItem value="International">International</SelectItem>
                              <SelectItem value="Montessori">Montessori</SelectItem>
                              <SelectItem value="Religious">Religious</SelectItem>
                              <SelectItem value="Boarding">Boarding</SelectItem>
                              <SelectItem value="Special Education">Special Education</SelectItem>
                              <SelectItem value="Alternative">Alternative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={detailsForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your school..." 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (City, State)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. New York, NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="curriculumType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curriculum Type</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select curriculum" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Common Core">Common Core</SelectItem>
                              <SelectItem value="IB">International Baccalaureate</SelectItem>
                              <SelectItem value="Montessori">Montessori</SelectItem>
                              <SelectItem value="Waldorf">Waldorf</SelectItem>
                              <SelectItem value="STEM">STEM-focused</SelectItem>
                              <SelectItem value="Arts">Arts-focused</SelectItem>
                              <SelectItem value="Language Immersion">Language Immersion</SelectItem>
                              <SelectItem value="Special Education">Special Education</SelectItem>
                              <SelectItem value="Religious">Religious</SelectItem>
                              <SelectItem value="Cambridge">Cambridge</SelectItem>
                              <SelectItem value="Advanced Placement">Advanced Placement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="gradeRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Range</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Preschool">Preschool</SelectItem>
                              <SelectItem value="K-5">K-5 (Elementary)</SelectItem>
                              <SelectItem value="K-8">K-8 (Elementary & Middle)</SelectItem>
                              <SelectItem value="6-8">6-8 (Middle School)</SelectItem>
                              <SelectItem value="9-12">9-12 (High School)</SelectItem>
                              <SelectItem value="K-12">K-12 (All Levels)</SelectItem>
                              <SelectItem value="Preschool-5">Preschool-5</SelectItem>
                              <SelectItem value="Preschool-8">Preschool-8</SelectItem>
                              <SelectItem value="Preschool-12">Preschool-12</SelectItem>
                              <SelectItem value="6-12">6-12 (Middle & High School)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourschool.edu" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the full URL including https://
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="establishedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Year</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. 1985" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="info@yourschool.edu" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. (123) 456-7890" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={detailsForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/school-image.jpg" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of your school's main image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={detailsForm.control}
                    name="classSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Class Size</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 15-20 students" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={detailsForm.control}
                      name="multiCampus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Multiple Campuses</FormLabel>
                            <FormDescription>
                              Check if your school has multiple campuses
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="hasFinancialAid"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Financial Aid Available</FormLabel>
                            <FormDescription>
                              Check if your school offers financial aid or scholarships
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
                      onClick={() => setIsDetailsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateSchoolMutation.isPending}
                    >
                      {updateSchoolMutation.isPending && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Media Dialog */}
          <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedMedia ? "Edit Media" : "Add Media"}</DialogTitle>
                <DialogDescription>
                  {selectedMedia 
                    ? "Update this media item's details" 
                    : "Add images, videos, or virtual tours to showcase your school."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...mediaForm}>
                <form onSubmit={mediaForm.handleSubmit(onSubmitMedia)} className="space-y-4">
                  <FormField
                    control={mediaForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Media title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mediaForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Type</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select media type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="virtualTour">Virtual Tour</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mediaForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Direct link to the media content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mediaForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description" 
                            rows={3}
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {(mediaForm.watch("type") === "video" || mediaForm.watch("type") === "virtualTour") && (
                    <FormField
                      control={mediaForm.control}
                      name="thumbnail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thumbnail URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://..." 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Preview image for videos or virtual tours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={mediaForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Public</FormLabel>
                          <FormDescription>
                            Make this media visible to the public
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsMediaDialogOpen(false);
                        setSelectedMedia(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={upsertMediaMutation.isPending}
                    >
                      {upsertMediaMutation.isPending && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {selectedMedia ? "Update" : "Add"} Media
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Media Confirmation Dialog */}
          <AlertDialog open={isDeleteMediaDialogOpen} onOpenChange={setIsDeleteMediaDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this media item? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedMedia(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteMedia}
                  disabled={deleteMediaMutation.isPending}
                >
                  {deleteMediaMutation.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SchoolAdminLayout>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickPostType === "announcement" && <AlertCircle className="h-5 w-5 text-orange-500" />}
              {quickPostType === "event" && <Calendar className="h-5 w-5 text-blue-500" />}
              {quickPostType === "news" && <FileText className="h-5 w-5 text-green-500" />}
              {quickPostType === "update" && <RefreshCw className="h-5 w-5 text-purple-500" />}
              {quickPostType === "featured" && <Star className="h-5 w-5 text-amber-500" />}
              Create {quickPostType.charAt(0).toUpperCase() + quickPostType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Create and publish a new {quickPostType} for your school.
            </DialogDescription>
          </DialogHeader>

          <Form {...postForm}>
            <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-6">
              <FormField
                control={postForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Type</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                      <SelectContent>
                        {postTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={postForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={postForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter post content" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={postForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to an image for this post
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {postForm.watch("type") === "event" && (
                <FormField
                  control={postForm.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={postForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Publish immediately</FormLabel>
                      <FormDescription>
                        If unchecked, post will be saved as a draft
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreatePostDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPostMutation.isPending}>
                  {createPostMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Post'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchoolAdminDashboard;