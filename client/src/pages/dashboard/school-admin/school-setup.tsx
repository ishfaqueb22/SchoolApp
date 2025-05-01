import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Loader2,
  CheckCircle,
  School,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Mail,
  Building2,
  Info,
  FileText,
  SquareCheck,
  AlertCircle,
  Image,
  Film,
  X,
  Upload,
  Plus,
  Tag,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminLayout } from '@/components/layouts/school-admin-layout';
import { Progress } from '@/components/ui/progress';

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
  imageUrl: z.string().optional().nullable(),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }).optional(),
  contactPhone: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional(),
  establishedYear: z.string().optional(),
  multiCampus: z.boolean().default(false),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  // New fields for school categories and media
  categories: z.array(z.number()).default([]),
  mediaGallery: z.array(z.object({
    type: z.enum(["image", "video", "virtualTour"]),
    title: z.string(),
    description: z.string().optional(),
    url: z.string(),
    thumbnail: z.string().optional(),
    order: z.number().optional(),
    isPublic: z.boolean().default(true),
  })).default([]),
});

type SchoolFormValues = z.infer<typeof schoolFormSchema>;

// Interface for the school category
interface SchoolCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// Interface for the media item
interface MediaItem {
  type: "image" | "video" | "virtualTour";
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  order?: number;
  isPublic: boolean;
}

const SchoolSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isUploadingSchoolImage, setIsUploadingSchoolImage] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [newMediaItem, setNewMediaItem] = useState<Partial<MediaItem>>({
    type: "image",
    title: "",
    description: "",
    url: "",
    isPublic: true,
  });
  const [activeStep, setActiveStep] = useState(1);
  
  // Fetch school categories
  const { data: schoolCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/school-categories'],
    queryFn: async () => {
      const response = await fetch('/api/school-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch school categories');
      }
      return await response.json() as SchoolCategory[];
    }
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
      contactEmail: user?.email || "",
      contactPhone: "",
      website: "",
      establishedYear: "",
      multiCampus: false,
      coordinates: {
        lat: undefined,
        lng: undefined,
      },
      // New fields
      categories: [],
      mediaGallery: [],
    },
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: async (data: SchoolFormValues) => {
      const response = await apiRequest('POST', '/api/schools/register', data);
      return await response.json();
    },
    onSuccess: (createdSchool) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "School created successfully",
        description: "Your school has been registered and is pending approval.",
        variant: "default",
      });
      
      // Redirect to the school admin dashboard
      navigate("/admin");
    },
    onError: (error: any) => {
      console.error("Failed to create school:", error);
      
      toast({
        title: "Failed to create school",
        description: error?.message || "There was an error creating your school. Please try again.",
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
            description: "Your school image has been uploaded.",
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
  
  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    const currentCategories = [...selectedCategories];
    if (currentCategories.includes(categoryId)) {
      const updatedCategories = currentCategories.filter(id => id !== categoryId);
      setSelectedCategories(updatedCategories);
      schoolForm.setValue('categories', updatedCategories);
    } else {
      const updatedCategories = [...currentCategories, categoryId];
      setSelectedCategories(updatedCategories);
      schoolForm.setValue('categories', updatedCategories);
    }
  };
  
  // Handle media upload
  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!(file.type.includes('image/') || file.type.includes('video/'))) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingMedia(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const mediaUrl = e.target.result as string;
          
          // Simulate server delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the media form
          setNewMediaItem(prev => ({
            ...prev,
            url: mediaUrl,
            type: file.type.includes('image/') ? 'image' : 'video',
            thumbnail: file.type.includes('image/') ? mediaUrl : '',
          }));
          
          setIsUploadingMedia(false);
          
          toast({
            title: "Media uploaded",
            description: "Your media has been uploaded. Please add a title to add it to your gallery.",
            variant: "default",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload media:", error);
      setIsUploadingMedia(false);
      
      toast({
        title: "Failed to upload media",
        description: "There was an error uploading your media. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Add media to gallery
  const addMediaToGallery = () => {
    if (!newMediaItem.title || !newMediaItem.url) {
      toast({
        title: "Missing information",
        description: "Please provide a title and upload a media file.",
        variant: "destructive",
      });
      return;
    }
    
    const newMedia = {
      ...newMediaItem,
      title: newMediaItem.title!,
      url: newMediaItem.url!,
      isPublic: newMediaItem.isPublic ?? true,
      type: newMediaItem.type as "image" | "video" | "virtualTour",
      order: mediaGallery.length,
    } as MediaItem;
    
    const updatedGallery = [...mediaGallery, newMedia];
    setMediaGallery(updatedGallery);
    schoolForm.setValue('mediaGallery', updatedGallery);
    
    // Reset the new media form
    setNewMediaItem({
      type: "image",
      title: "",
      description: "",
      url: "",
      isPublic: true,
    });
    
    toast({
      title: "Media added",
      description: "The media has been added to your school gallery.",
      variant: "default",
    });
  };
  
  // Remove media from gallery
  const removeMediaFromGallery = (index: number) => {
    const updatedGallery = [...mediaGallery];
    updatedGallery.splice(index, 1);
    
    // Update order for remaining items
    updatedGallery.forEach((item, i) => {
      item.order = i;
    });
    
    setMediaGallery(updatedGallery);
    schoolForm.setValue('mediaGallery', updatedGallery);
    
    toast({
      title: "Media removed",
      description: "The media has been removed from your school gallery.",
      variant: "default",
    });
  };

  // Setup effect to initialize categories and features from form values
  useEffect(() => {
    const formCategories = schoolForm.getValues('categories') || [];
    const formFeatures = schoolForm.getValues('features') || [];
    const formMediaGallery = schoolForm.getValues('mediaGallery') || [];
    
    setSelectedCategories(formCategories);
    setSelectedFeatures(formFeatures);
    setMediaGallery(formMediaGallery);
  }, [schoolForm]);

  // Handle school form submission
  const onSchoolSubmit = (data: SchoolFormValues) => {
    // Ensure categories and media are correctly set
    data.categories = selectedCategories;
    data.mediaGallery = mediaGallery;
    
    createSchoolMutation.mutate(data);
  };
  
  // Navigation between steps
  const nextStep = () => {
    // Validate the current step's fields
    if (activeStep === 1) {
      const basicInfoValid = schoolForm.trigger(['name', 'description', 'location', 'address']);
      if (!basicInfoValid) return;
    } else if (activeStep === 2) {
      const academicInfoValid = schoolForm.trigger(['type', 'curriculumType', 'gradeRange']);
      if (!academicInfoValid) return;
    }
    
    setActiveStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <>
      <Helmet>
        <title>Set Up Your School | SmartSchool Finder</title>
        <meta name="description" content="Create and configure your school profile on SmartSchool Finder." />
      </Helmet>
      
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold">Set Up Your School</h1>
          <p className="text-muted-foreground mt-2">
            Complete the following information to register your school on our platform
          </p>
          
          <div className="w-full max-w-3xl mt-6">
            <Progress value={(activeStep / 3) * 100} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className={`text-sm ${activeStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Basic Information</span>
              <span className={`text-sm ${activeStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Academic Details</span>
              <span className={`text-sm ${activeStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Additional Information</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <Form {...schoolForm}>
                <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-8">
                  {/* Step 1: Basic Information */}
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center space-y-3 mb-6">
                        <div className="border rounded-md overflow-hidden w-32 h-32 flex items-center justify-center bg-gray-50">
                          {schoolForm.watch("imageUrl") ? (
                            <img 
                              src={schoolForm.watch("imageUrl") || ""} 
                              alt={schoolForm.watch("name") || "School"} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <School className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <label 
                            htmlFor="school-image-upload" 
                            className="cursor-pointer text-sm text-primary hover:underline flex items-center"
                          >
                            {isUploadingSchoolImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                Upload School Logo
                              </>
                            )}
                          </label>
                          <input
                            id="school-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleSchoolImageUpload}
                            disabled={isUploadingSchoolImage}
                            className="hidden"
                          />
                          <span className="text-xs text-muted-foreground mt-1">
                            Recommended: Square image, max 5MB
                          </span>
                        </div>
                      </div>
                      
                      <FormField
                        control={schoolForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name *</FormLabel>
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
                            <FormLabel>School Description *</FormLabel>
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
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={schoolForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City/Location *</FormLabel>
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
                              <FormLabel>Full Address *</FormLabel>
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
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Academic Details */}
                  {activeStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={schoolForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School Type *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select school type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SCHOOL_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
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
                              <FormLabel>Curriculum Type *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select curriculum" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CURRICULUM_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={schoolForm.control}
                          name="gradeRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade Range *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select grade range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GRADE_RANGES.map((range) => (
                                    <SelectItem key={range} value={range}>
                                      {range}
                                    </SelectItem>
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
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select class size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CLASS_SIZES.map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={schoolForm.control}
                          name="tuitionRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tuition Range</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tuition range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TUITION_RANGES.map((range) => (
                                    <SelectItem key={range} value={range}>
                                      {range}
                                    </SelectItem>
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
                            <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4 mt-6">
                              <div className="space-y-1 leading-none">
                                <FormLabel>Financial Aid</FormLabel>
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
                  )}
                  
                  {/* Step 3: Additional Information */}
                  {activeStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
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
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
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
                                  <Input 
                                    className="pl-10"
                                    placeholder="e.g. 1980" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                      
                      <div>
                        <FormLabel>School Features</FormLabel>
                        <FormDescription className="mb-3">
                          Select the features and facilities your school offers
                        </FormDescription>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          {SCHOOL_FEATURES.map((feature) => {
                            const isSelected = selectedFeatures.includes(feature);
                            return (
                              <Badge
                                key={feature}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer flex justify-start gap-1 p-2"
                                onClick={() => toggleFeature(feature)}
                              >
                                {isSelected && <SquareCheck className="h-4 w-4" />}
                                {!isSelected && <div className="w-4" />}
                                <span>{feature}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <FormLabel>School Categories</FormLabel>
                        <FormDescription className="mb-3">
                          Select categories that best describe your school
                        </FormDescription>
                        
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center my-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading categories...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {schoolCategories?.map((category) => {
                              const isSelected = selectedCategories.includes(category.id);
                              return (
                                <Badge
                                  key={category.id}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer flex justify-start gap-1 p-2"
                                  style={{ backgroundColor: isSelected ? category.color || undefined : undefined }}
                                  onClick={() => toggleCategory(category.id)}
                                >
                                  {isSelected && <SquareCheck className="h-4 w-4" />}
                                  {!isSelected && <div className="w-4" />}
                                  <span>{category.name}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <FormLabel>Media Gallery</FormLabel>
                        <FormDescription className="mb-3">
                          Add images and videos to showcase your school
                        </FormDescription>
                        
                        <div className="space-y-4">
                          {/* Current media gallery */}
                          {mediaGallery.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                              {mediaGallery.map((media, index) => (
                                <div key={index} className="relative group border rounded-md overflow-hidden">
                                  {media.type === 'image' ? (
                                    <div className="aspect-square">
                                      <img 
                                        src={media.url} 
                                        alt={media.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                      <Film className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <button
                                      type="button"
                                      onClick={() => removeMediaFromGallery(index)}
                                      className="self-end bg-white/10 p-1 rounded-full hover:bg-white/20"
                                    >
                                      <X className="h-4 w-4 text-white" />
                                    </button>
                                    <div className="text-white text-sm font-medium truncate p-1 bg-black/50 rounded">
                                      {media.title}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Add new media form */}
                          <div className="border rounded-md p-4 space-y-4">
                            <h4 className="text-sm font-medium">Add New Media</h4>
                            
                            <div className="flex items-center space-x-2 mb-4">
                              <div className="border rounded-md overflow-hidden w-16 h-16 flex items-center justify-center bg-gray-50">
                                {newMediaItem.url ? (
                                  newMediaItem.type === 'image' ? (
                                    <img 
                                      src={newMediaItem.url} 
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Film className="h-8 w-8 text-muted-foreground" />
                                  )
                                ) : (
                                  <Image className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <label 
                                  htmlFor="media-upload" 
                                  className="cursor-pointer text-sm text-primary hover:underline flex items-center"
                                >
                                  {isUploadingMedia ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload Media
                                    </>
                                  )}
                                </label>
                                <input
                                  id="media-upload"
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={handleMediaUpload}
                                  disabled={isUploadingMedia}
                                  className="hidden"
                                />
                                <span className="text-xs text-muted-foreground mt-1 block">
                                  Upload images or videos, max 10MB
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid gap-4">
                              <div>
                                <label htmlFor="media-title" className="text-sm font-medium">Title</label>
                                <Input
                                  id="media-title"
                                  value={newMediaItem.title || ''}
                                  onChange={(e) => setNewMediaItem(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="Enter media title"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="media-description" className="text-sm font-medium">Description (Optional)</label>
                                <Textarea
                                  id="media-description"
                                  value={newMediaItem.description || ''}
                                  onChange={(e) => setNewMediaItem(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Enter media description"
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="media-public"
                                    checked={newMediaItem.isPublic}
                                    onCheckedChange={(checked) => setNewMediaItem(prev => ({ ...prev, isPublic: checked }))}
                                  />
                                  <label htmlFor="media-public" className="text-sm">Public</label>
                                </div>
                                
                                <Button
                                  type="button"
                                  onClick={addMediaToGallery}
                                  disabled={!newMediaItem.title || !newMediaItem.url || isUploadingMedia}
                                  className="ml-auto"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add to Gallery
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    {activeStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={prevStep}
                      >
                        Previous
                      </Button>
                    )}
                    
                    {activeStep < 3 && (
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        className={activeStep === 1 ? "ml-auto" : ""}
                      >
                        Next
                      </Button>
                    )}
                    
                    {activeStep === 3 && (
                      <Button 
                        type="submit" 
                        disabled={createSchoolMutation.isPending}
                        className="ml-auto"
                      >
                        {createSchoolMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Register School
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {createSchoolMutation.isSuccess && (
            <Alert className="mt-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your school has been registered successfully. It is now pending approval from our team.
              </AlertDescription>
            </Alert>
          )}
          
          {createSchoolMutation.isError && (
            <Alert className="mt-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {createSchoolMutation.error instanceof Error
                  ? createSchoolMutation.error.message
                  : "There was an error registering your school. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  );
};

export default SchoolSetup;