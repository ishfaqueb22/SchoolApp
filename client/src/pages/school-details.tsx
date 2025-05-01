import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useRoute, Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { School, Review } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FEATURED_SCHOOLS } from "@/lib/mock-data";
import { 
  Heart, MapPin, Phone, Globe, Calendar, Users, DollarSign, Star, 
  Shield, Clock, UserCheck, Home, BookOpen, Award, FileText, Building, MessageCircle,
  Loader2, Trash, ChevronDown, UserPlus, Building2, Mail, CalendarDays, ShieldCheck,
  ClipboardCheck, CheckCircle, SearchX, Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Set default icon globally
L.Marker.prototype.options.icon = DefaultIcon;

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  forGrade: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message cannot exceed 1000 characters"),
});

// Define contact form type
type ContactFormValues = z.infer<typeof contactFormSchema>;

const SchoolDetails = () => {
  const [match, params] = useRoute<{ id: string }>("/schools/:id");
  const schoolId = match ? parseInt(params.id, 10) : null;
  const { isAuthenticated, user: auth } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  
  // Setup form for contact submission
  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: auth?.fullName || "",
      email: auth?.email || "",
      phone: "",
      forGrade: "",
      message: "",
    },
  });
  
  // Initialize form values when user data changes
  useEffect(() => {
    if (auth) {
      contactForm.setValue("name", auth.fullName || "");
      contactForm.setValue("email", auth.email || "");
    }
  }, [auth, contactForm]);
  
  // Setup mutation for contact form submission
  const contactMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      return apiRequest("POST", `/api/schools/${schoolId}/inquiries`, values);
    },
    onSuccess: () => {
      setIsContactDialogOpen(false);
      contactForm.reset();
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${schoolData.name}. They will contact you soon.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Create form schema for the review
  const reviewFormSchema = z.object({
    rating: z.number().min(1, "Please select a rating").max(5, "Rating cannot be higher than 5"),
    comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment cannot exceed 1000 characters"),
  });
  
  // Define form type
  type ReviewFormValues = z.infer<typeof reviewFormSchema>;

  // Fetch school details
  const { data: school, isLoading, error } = useQuery({
    queryKey: [`/api/schools/${schoolId}`],
    enabled: !!schoolId,
    staleTime: 300000, // 5 minutes
  });

  // Fetch school reviews
  const { data: reviews } = useQuery({
    queryKey: [`/api/schools/${schoolId}/reviews`],
    enabled: !!schoolId,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch faculty data
  const { data: facultyData, isLoading: isFacultyLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}/faculty`],
    enabled: !!schoolId,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch school posts data
  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}/posts`],
    enabled: !!schoolId,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch school campuses
  const { data: campusesData, isLoading: isCampusesLoading } = useQuery({
    queryKey: [`/api/schools/${schoolId}/campuses`],
    enabled: !!schoolId,
    staleTime: 300000, // 5 minutes
  });
  
  // Fetch similar schools (other approved schools)
  const { data: similarSchoolsData, isLoading: isSimilarSchoolsLoading } = useQuery({
    queryKey: ['/api/schools', 'similar', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      // Get schools with same curriculum type or type as the current school if available
      const curriculumType = school?.curriculumType;
      const schoolType = school?.type;
      
      const response = await apiRequest(
        'GET',
        `/api/schools/search?limit=3${curriculumType ? `&curriculumType=${encodeURIComponent(curriculumType)}` : ''}${schoolType ? `&type=${encodeURIComponent(schoolType)}` : ''}`,
        undefined
      );
      
      const data = await response.json();
      // Filter out the current school and get up to 3 similar schools
      return data.schools.filter((s: School) => s.id !== schoolId).slice(0, 3);
    },
    enabled: !!schoolId && !!school,
    staleTime: 300000, // 5 minutes
  });

  // Setup form for review submission
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: editingReview ? editingReview.rating / 10 : 0,
      comment: editingReview?.comment || "",
    },
  });
  
  // Update form values when editing review changes
  useEffect(() => {
    if (editingReview) {
      form.setValue("rating", editingReview.rating / 10);
      form.setValue("comment", editingReview.comment || "");
    } else {
      form.reset({
        rating: 0,
        comment: "",
      });
    }
  }, [editingReview, form]);
  
  // Setup mutation for review submission (create or update)
  const queryClient = useQueryClient();
  const reviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      // If editing an existing review, use PATCH
      if (editingReview) {
        return apiRequest("PATCH", `/api/schools/${schoolId}/reviews/${editingReview.id}`, {
          ...values,
          // Convert 5-star rating to 50-point scale
          rating: values.rating * 10,
        });
      }
      
      // Otherwise create a new review
      return apiRequest("POST", `/api/schools/${schoolId}/reviews`, {
        ...values,
        // Convert 5-star rating to 50-point scale
        rating: values.rating * 10,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schools/${schoolId}/reviews`] });
      setIsReviewDialogOpen(false);
      setEditingReview(null);
      form.reset();
      toast({
        title: editingReview ? "Review updated" : "Review submitted",
        description: editingReview 
          ? "Your review has been updated successfully." 
          : "Thank you for sharing your feedback about this school.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editingReview ? 'update' : 'submit'} review. Please try again.`,
        variant: "destructive",
      });
    },
  });
  
  // Setup mutation for deleting a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest("DELETE", `/api/schools/${schoolId}/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schools/${schoolId}/reviews`] });
      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSchool = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in or sign up to save schools.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (!isSaved) {
        await apiRequest("POST", "/api/user/saved-schools", { schoolId });
        setIsSaved(true);
        toast({
          title: "School saved",
          description: "School has been added to your saved list."
        });
      } else {
        await apiRequest("DELETE", `/api/user/saved-schools/${schoolId}`);
        setIsSaved(false);
        toast({
          title: "School removed",
          description: "School has been removed from your saved list."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update saved schools. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If school is not found or loading error occurred, show error message
  if (!isLoading && (!school || error)) {
    // Try to find school in featured schools as fallback
    const fallbackSchool = FEATURED_SCHOOLS.find(s => s.id === schoolId);
    
    if (!fallbackSchool) {
      return (
        <>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">School Not Found</h1>
              <p className="text-gray-600 mb-6">The school you're looking for could not be found.</p>
              <Link href="/discover">
                <Button>Browse Schools</Button>
              </Link>
            </div>
          </div>
          <Footer />
        </>
      );
    }
  }

  // Use fallback data if API fails
  const schoolData: School = school || FEATURED_SCHOOLS.find(s => s.id === schoolId) || {} as School;
  const reviewsData: Review[] = reviews || [];

  // Format rating to display with one decimal place
  const formattedRating = schoolData.rating ? (schoolData.rating).toFixed(1) : "N/A";

  return (
    <>
      <Helmet>
        <title>{schoolData.name ? `${schoolData.name} | SmartSchool Finder` : "School Details | SmartSchool Finder"}</title>
        <meta name="description" content={schoolData.description || "Detailed information about the school including curriculum, facilities, and admission requirements."} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow bg-gray-50">
          {isLoading ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-t-lg mb-8"></div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Hero Section */}
              <div 
                className="relative h-64 md:h-96 bg-cover bg-center"
                style={{ backgroundImage: `url(${schoolData.imageUrl})` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                          {schoolData.name}
                        </h1>
                        {schoolData.verificationStatus && (
                          <div className="bg-blue-100 text-blue-600 rounded-full px-3 py-1 flex items-center gap-1 text-sm font-medium">
                            <ShieldCheck className="h-4 w-4" />
                            Verified
                          </div>
                        )}
                      </div>
                      <div className="flex items-center mb-4">
                        <MapPin className="h-5 w-5 text-white mr-1" />
                        <span className="text-white">{schoolData.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge 
                          className="bg-accent-400 hover:bg-accent-500 text-white border-0"
                        >
                          {schoolData.curriculumType}
                        </Badge>
                        <Badge 
                          className="bg-white text-primary-700 hover:bg-gray-100 border-0"
                        >
                          {schoolData.gradeRange}
                        </Badge>
                        {schoolData.hasFinancialAid && (
                          <Badge 
                            className="bg-secondary-500 hover:bg-secondary-600 text-white border-0"
                          >
                            Financial Aid Available
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSaveSchool}
                          variant="outline"
                          className="bg-white hover:bg-gray-100 border-0"
                        >
                          <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current text-red-500" : ""}`} />
                          {isSaved ? "Saved" : "Save School"}
                        </Button>
                        <Link href={`/compare?schools=${schoolId}`}>
                          <Button 
                            variant="outline"
                            className="bg-white hover:bg-gray-100 border-0"
                          >
                            Add to Compare
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main content with tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="px-6 pt-6">
                          <TabsList className="w-full max-w-md grid grid-cols-5 mb-2">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="campuses">Campuses</TabsTrigger>
                            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                            <TabsTrigger value="news">News & Events</TabsTrigger>
                            <TabsTrigger value="admissions">Admissions</TabsTrigger>
                          </TabsList>
                        </div>
                        
                        <TabsContent value="overview" className="p-6 pt-2">
                          <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold mb-4">About {schoolData.name}</h2>
                            <p className="mb-6">{schoolData.description}</p>
                            
                            {/* Accreditation & Approval Status Section */}
                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                              <h3 className="text-xl font-bold mb-3 flex items-center">
                                <Award className="h-5 w-5 text-primary-600 mr-2" />
                                Accreditation & Approval Status
                              </h3>
                              
                              <div className="space-y-4">
                                {schoolData.verificationStatus && (
                                  <div className="flex">
                                    <div className="mr-3 mt-1">
                                      <ShieldCheck className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-blue-800">Verified School</h4>
                                      <p className="text-sm text-gray-600">
                                        This school has completed our verification process. We've confirmed 
                                        the accuracy of their information, credentials, and accreditation status.
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Verified on:</span> {new Date().toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex">
                                  <div className="mr-3 mt-1">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-green-800">Approved School</h4>
                                    <p className="text-sm text-gray-600">
                                      This school has been approved to list on our platform after meeting our 
                                      basic quality and information standards.
                                    </p>
                                  </div>
                                </div>
                                
                                {schoolData.accreditations && schoolData.accreditations?.length > 0 ? (
                                  <div className="flex">
                                    <div className="mr-3 mt-1">
                                      <ClipboardCheck className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-amber-800">Accreditations</h4>
                                      <ul className="list-disc ml-5 mt-1 text-sm text-gray-600 space-y-1">
                                        {schoolData.accreditations?.map((accreditation, index) => (
                                          <li key={index}>{accreditation}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-3">Key Features</h3>
                            {schoolData.features && schoolData.features.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 mb-6">
                                {schoolData.features.map((feature, index) => (
                                  <div key={index} className="flex items-center">
                                    <Shield className="h-5 w-5 text-primary-500 mr-2" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic mb-6">No specific features listed</p>
                            )}
                            
                            <h3 className="text-xl font-bold mb-3">Facilities</h3>
                            <p className="mb-6">
                              Information about the school facilities will be displayed here, including
                              classrooms, sports facilities, library, and technology resources.
                            </p>
                            
                            <h3 className="text-xl font-bold mb-3">Faculty</h3>
                            {/* Faculty list */}
                            <div className="mb-6">
                              {isFacultyLoading ? (
                                <div className="animate-pulse space-y-3">
                                  {[1, 2, 3].map(idx => (
                                    <div key={idx} className="flex items-center space-x-4">
                                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                      <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : !facultyData || facultyData.length === 0 ? (
                                <p className="text-gray-500 italic">
                                  No faculty information available at this time.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {facultyData.map(member => (
                                    <div key={member.id} className="border rounded-lg p-4 flex items-start space-x-4">
                                      <div className="flex-shrink-0">
                                        {member.imageUrl ? (
                                          <img 
                                            src={member.imageUrl} 
                                            alt={member.name} 
                                            className="h-16 w-16 rounded-full object-cover border"
                                          />
                                        ) : (
                                          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                                            {member.name.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                                        <p className="text-sm text-primary-600">{member.position}</p>
                                        {member.department && (
                                          <p className="text-sm text-gray-500">{member.department}</p>
                                        )}
                                        {member.qualifications && (
                                          <p className="text-xs text-gray-500">{member.qualifications}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <h3 className="text-xl font-bold mb-3">News & Announcements</h3>
                            <div className="mb-6">
                              {isPostsLoading ? (
                                <div className="animate-pulse space-y-4">
                                  {[1, 2].map(idx => (
                                    <div key={idx} className="border rounded-lg p-4">
                                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                      <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    </div>
                                  ))}
                                </div>
                              ) : !postsData || postsData.length === 0 ? (
                                <p className="text-gray-500 italic">
                                  No announcements or news available at this time.
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {postsData.map(post => (
                                    <div key={post.id} className="border rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                                        <Badge 
                                          className={`${
                                            post.type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                                            post.type === 'event' ? 'bg-purple-100 text-purple-800' :
                                            post.type === 'news' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-sm text-gray-500 mb-2">
                                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                        {post.eventDate && (
                                          <span className="ml-2 font-medium">
                                            Event date: {new Date(post.eventDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </p>
                                      
                                      <div className="prose prose-sm max-w-none">
                                        <p>{post.content}</p>
                                      </div>
                                      
                                      {post.imageUrl && (
                                        <img 
                                          src={post.imageUrl} 
                                          alt={post.title} 
                                          className="mt-3 rounded-md w-full object-cover max-h-48"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="campuses" className="p-6 pt-2">
                          <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold mb-4">{schoolData.name} Campuses</h2>
                            <p className="mb-6">
                              View information about all campuses of {schoolData.name} across different locations.
                            </p>
                            
                            {/* Display campuses data */}
                            {isCampusesLoading ? (
                              <div className="animate-pulse space-y-4">
                                {[1, 2].map(idx => (
                                  <div key={idx} className="border rounded-lg p-4">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                  </div>
                                ))}
                              </div>
                            ) : !campusesData || campusesData.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                  <Building2 className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Campuses Available</h3>
                                <p className="text-gray-500">
                                  There are no campus details available for this school at this time.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {campusesData.map(campus => (
                                  <div key={campus.id} className="border rounded-lg shadow-sm overflow-hidden">
                                    {campus.imageUrl ? (
                                      <div className="h-48 overflow-hidden">
                                        <img 
                                          src={campus.imageUrl} 
                                          alt={campus.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                                        <Building2 className="h-12 w-12 text-gray-300" />
                                      </div>
                                    )}
                                    <div className="p-4">
                                      <h3 className="text-lg font-bold mb-2">{campus.name}</h3>
                                      <div className="flex items-center text-gray-600 mb-2">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{campus.location}</span>
                                      </div>
                                      {campus.description && (
                                        <p className="text-sm text-gray-600 mb-3">{campus.description}</p>
                                      )}
                                      <div className="space-y-2">
                                        {campus.contactPhone && (
                                          <div className="flex items-center text-sm">
                                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{campus.contactPhone}</span>
                                          </div>
                                        )}
                                        {campus.contactEmail && (
                                          <div className="flex items-center text-sm">
                                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{campus.contactEmail}</span>
                                          </div>
                                        )}
                                        {campus.studentCount && (
                                          <div className="flex items-center text-sm">
                                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{campus.studentCount} students</span>
                                          </div>
                                        )}
                                        {campus.establishedYear && (
                                          <div className="flex items-center text-sm">
                                            <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>Established in {campus.establishedYear}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-4 pt-3 border-t">
                                        <Button variant="outline" size="sm" className="w-full">
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="curriculum" className="p-6 pt-2">
                          <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold mb-4">{schoolData.curriculumType} Curriculum</h2>
                            <p className="mb-6">
                              Detailed information about the {schoolData.curriculumType} curriculum approach
                              and how it is implemented at {schoolData.name}.
                            </p>
                            
                            <h3 className="text-xl font-bold mb-3">Academic Programs</h3>
                            <p className="mb-6">
                              Overview of the academic programs offered, including specialized tracks,
                              electives, and advanced placement opportunities.
                            </p>
                            
                            <h3 className="text-xl font-bold mb-3">Extracurricular Activities</h3>
                            <p className="mb-6">
                              Information about clubs, sports teams, arts programs, and other activities
                              available to students outside the classroom.
                            </p>
                            
                            <h3 className="text-xl font-bold mb-3">Technology Integration</h3>
                            <p className="mb-6">
                              How technology is used in the classroom and throughout the curriculum to
                              enhance learning and prepare students for the future.
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="news" className="p-6 pt-2">
                          <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold mb-4">News & Announcements</h2>
                            <p className="mb-6">
                              Stay up-to-date with the latest news, events, and announcements from {schoolData.name}.
                            </p>
                            
                            {/* Display school posts data */}
                            {isPostsLoading ? (
                              <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(idx => (
                                  <div key={idx} className="border rounded-lg p-4">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                  </div>
                                ))}
                              </div>
                            ) : !postsData || postsData.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Posts Available</h3>
                                <p className="text-gray-500">
                                  There are no announcements or news available at this time. Check back later for updates.
                                </p>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const announcements = postsData && postsData.filter(post => post.type === 'announcement');
                                  const events = postsData && postsData.filter(post => post.type === 'event');
                                  const news = postsData && postsData.filter(post => post.type === 'news' || post.type === 'update');
                                  const featured = postsData && postsData.filter(post => post.type === 'featured');

                                  return (
                                    <div className="space-y-6">
                                      {featured && featured.length > 0 && (
                                        <div>
                                          <h3 className="text-xl font-bold mb-3">Featured</h3>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {featured.map(post => (
                                              <div key={post.id} className="border rounded-lg shadow-sm overflow-hidden">
                                                {post.imageUrl && (
                                                  <div className="h-48 overflow-hidden">
                                                    <img 
                                                      src={post.imageUrl} 
                                                      alt={post.title} 
                                                      className="w-full h-full object-cover"
                                                    />
                                                  </div>
                                                )}
                                                <div className="p-4">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-gray-900">{post.title}</h4>
                                                    <Badge className="bg-pink-100 text-pink-800">
                                                      Featured
                                                    </Badge>
                                                  </div>
                                                  <p className="text-sm text-gray-500 mb-2">
                                                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric'
                                                    })}
                                                  </p>
                                                  <div className="prose prose-sm max-w-none">
                                                    <p>{post.content}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {events && events.length > 0 && (
                                        <div>
                                          <h3 className="text-xl font-bold mb-3">Upcoming Events</h3>
                                          <div className="space-y-3">
                                            {events.map(post => (
                                              <div key={post.id} className="border rounded-lg p-4">
                                                <div className="flex items-start gap-4">
                                                  {post.eventDate && (
                                                    <div className="min-w-[60px] flex flex-col items-center justify-center bg-purple-100 text-purple-800 p-2 rounded-md">
                                                      <span className="text-sm font-medium">
                                                        {new Date(post.eventDate).toLocaleDateString('en-US', {
                                                          month: 'short'
                                                        })}
                                                      </span>
                                                      <span className="text-xl font-bold">
                                                        {new Date(post.eventDate).toLocaleDateString('en-US', {
                                                          day: 'numeric'
                                                        })}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div>
                                                    <div className="flex justify-between items-start">
                                                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                                                      <Badge className="bg-purple-100 text-purple-800 ml-2">
                                                        Event
                                                      </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-2">
                                                      {post.eventDate && (
                                                        <span className="font-medium">
                                                          {new Date(post.eventDate).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                          })}
                                                        </span>
                                                      )}
                                                    </p>
                                                    <div className="prose prose-sm max-w-none">
                                                      <p>{post.content}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {announcements && announcements.length > 0 && (
                                        <div>
                                          <h3 className="text-xl font-bold mb-3">Announcements</h3>
                                          <div className="space-y-3">
                                            {announcements.map(post => (
                                              <div key={post.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                  <h4 className="font-medium text-gray-900">{post.title}</h4>
                                                  <Badge className="bg-blue-100 text-blue-800">
                                                    Announcement
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">
                                                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                  })}
                                                </p>
                                                <div className="prose prose-sm max-w-none">
                                                  <p>{post.content}</p>
                                                </div>
                                                {post.imageUrl && (
                                                  <img 
                                                    src={post.imageUrl} 
                                                    alt={post.title} 
                                                    className="mt-3 rounded-md w-full object-cover h-40"
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {news && news.length > 0 && (
                                        <div>
                                          <h3 className="text-xl font-bold mb-3">News & Updates</h3>
                                          <div className="space-y-3">
                                            {news.map(post => (
                                              <div key={post.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                  <h4 className="font-medium text-gray-900">{post.title}</h4>
                                                  <Badge 
                                                    className={post.type === 'news' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                                                  >
                                                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                                                  </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">
                                                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                  })}
                                                </p>
                                                <div className="prose prose-sm max-w-none">
                                                  <p>{post.content}</p>
                                                </div>
                                                {post.imageUrl && (
                                                  <img 
                                                    src={post.imageUrl} 
                                                    alt={post.title} 
                                                    className="mt-3 rounded-md w-full object-cover h-40"
                                                  />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                          
                        <TabsContent value="admissions" className="p-6 pt-2">
                          <div className="prose max-w-none">
                            <h2 className="text-2xl font-bold mb-4">Admissions Process</h2>
                            <p className="mb-6">
                              Information about the admissions process, requirements, and timeline for
                              applying to {schoolData.name}.
                            </p>
                            
                            <h3 className="text-xl font-bold mb-3">Application Timeline</h3>
                            <div className="space-y-4 mb-6">
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-1" />
                                <div>
                                  <p className="font-medium">September - November</p>
                                  <p className="text-gray-600">Request information and tour the school</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-1" />
                                <div>
                                  <p className="font-medium">December - January</p>
                                  <p className="text-gray-600">Submit application and required documents</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-1" />
                                <div>
                                  <p className="font-medium">February - March</p>
                                  <p className="text-gray-600">Student assessments and family interviews</p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-1" />
                                <div>
                                  <p className="font-medium">April</p>
                                  <p className="text-gray-600">Admissions decisions sent to families</p>
                                </div>
                              </div>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-3">Tuition & Financial Aid</h3>
                            <p className="mb-3">
                              Tuition Range: <span className="font-medium">{schoolData.tuitionRange}</span>
                            </p>
                            {schoolData.hasFinancialAid ? (
                              <div className="mb-6">
                                <p className="text-secondary-600 flex items-center">
                                  <Shield className="h-5 w-5 mr-2" /> Financial aid is available for qualifying families
                                </p>
                                <p className="mt-2">
                                  Contact the admissions office for details about the financial aid application process.
                                </p>
                              </div>
                            ) : (
                              <p className="mb-6">
                                Contact the admissions office for details about payment plans and options.
                              </p>
                            )}
                            
                            <h3 className="text-xl font-bold mb-3">Contact Admissions</h3>
                            <div className="space-y-2 mb-6">
                              <p className="flex items-center">
                                <Phone className="h-5 w-5 text-primary-500 mr-2" />
                                <span>(123) 456-7890</span>
                              </p>
                              <p className="flex items-center">
                                <Globe className="h-5 w-5 text-primary-500 mr-2" />
                                <a href="#" className="text-primary-600 hover:underline">www.schoolwebsite.com</a>
                              </p>
                            </div>
                            
                            <div className="mt-8">
                              <Button size="lg">Request Information</Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    {/* Reviews Section */}
                    <div className="bg-white rounded-lg shadow-md mt-8 p-6">
                      <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <Star className="h-6 w-6 text-yellow-400 mr-2" />
                        Parent Reviews
                      </h2>
                      
                      {reviewsData && reviewsData.length > 0 ? (
                        <div className="space-y-6">
                          {reviewsData.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                                    <UserCheck className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < review.rating / 10 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="ml-2 text-sm text-gray-600">{(review.rating / 10).toFixed(1)}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      Parent • {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Show edit/delete buttons only for the user's own reviews */}
                                {isAuthenticated && auth && review.userId === auth.id && (
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingReview(review);
                                        setIsReviewDialogOpen(true);
                                      }}
                                      className="h-8"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to delete your review?")) {
                                          deleteReviewMutation.mutate(review.id);
                                        }
                                      }}
                                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      disabled={deleteReviewMutation.isPending && deleteReviewMutation.variables === review.id}
                                    >
                                      {deleteReviewMutation.isPending && deleteReviewMutation.variables === review.id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <Trash className="h-4 w-4 mr-1" />
                                      )}
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No reviews yet for this school.</p>
                          {isAuthenticated ? (
                            <Button onClick={() => setIsReviewDialogOpen(true)}>Write a Review</Button>
                          ) : (
                            <Link href="/login">
                              <Button variant="outline">Login to Write a Review</Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Award className="h-5 w-5 text-primary-600 mr-2" />
                        School Overview
                      </h3>
                      
                      {/* Verification Status Banner */}
                      {schoolData.verificationStatus && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
                          <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Verified School</p>
                            <p className="text-xs text-blue-600 mt-1">
                              This school has been verified by our platform administrators, confirming 
                              the accuracy of all information provided.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                            Type
                          </span>
                          <span className="font-medium">{schoolData.type}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                            Curriculum
                          </span>
                          <span className="font-medium">{schoolData.curriculumType}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            Class Size
                          </span>
                          <span className="font-medium">{schoolData.classSize}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                            Tuition
                          </span>
                          <span className="font-medium">{schoolData.tuitionRange}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <Star className="h-4 w-4 mr-2 text-gray-400" />
                            Rating
                          </span>
                          <span className="font-medium flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                            {formattedRating}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            After School
                          </span>
                          <span className="font-medium text-secondary-600">
                            {schoolData.hasFinancialAid ? "Available" : "Contact School"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <MapPin className="h-5 w-5 text-primary-600 mr-2" />
                        Location
                      </h3>
                      <div className="h-48 mb-3 rounded-md overflow-hidden">
                        {schoolData.coordinates && 
                         schoolData.coordinates.lat && 
                         schoolData.coordinates.lng ? (
                          <MapContainer
                            center={[schoolData.coordinates.lat, schoolData.coordinates.lng]}
                            zoom={15}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={false}
                            zoomControl={true}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker 
                              position={[schoolData.coordinates.lat, schoolData.coordinates.lng]}
                            >
                              <Popup>
                                <div className="p-1">
                                  <p className="font-semibold">{schoolData.name}</p>
                                  <p className="text-sm text-gray-600">{schoolData.address}</p>
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        ) : (
                          <div className="bg-gray-100 h-full flex items-center justify-center">
                            <p className="text-gray-500 text-sm p-4 text-center">
                              Location coordinates not available
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4">{schoolData.address}</p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          if (schoolData.coordinates) {
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${schoolData.coordinates.lat},${schoolData.coordinates.lng}`,
                              '_blank'
                            );
                          } else if (schoolData.address) {
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolData.address)}`,
                              '_blank'
                            );
                          }
                        }}
                      >
                        Get Directions
                      </Button>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Home className="h-5 w-5 text-primary-600 mr-2" />
                        Contact School
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Interested in {schoolData.name}? Contact them directly to learn more or schedule a tour.
                      </p>
                      <Button 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast({
                              title: "Authentication required",
                              description: "Please log in or sign up to contact schools.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setIsContactDialogOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4" />
                        Contact School
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Similar Schools */}
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Schools</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isSimilarSchoolsLoading ? (
                      // Loading state
                      Array(3).fill(0).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
                          <div className="h-40 bg-gray-200"></div>
                          <div className="p-4">
                            <div className="h-6 bg-gray-200 w-3/4 mb-2 rounded"></div>
                            <div className="h-4 bg-gray-200 w-1/2 mb-3 rounded"></div>
                            <div className="flex justify-between mb-3">
                              <div className="h-4 bg-gray-200 w-1/3 rounded"></div>
                              <div className="h-4 bg-gray-200 w-1/4 rounded"></div>
                            </div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))
                    ) : similarSchoolsData && similarSchoolsData.length > 0 ? (
                      similarSchoolsData.map(school => (
                        <div key={school.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
                          <div className="h-40 bg-gray-200 relative">
                            <img 
                              src={school.imageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop'} 
                              alt={school.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h3 className="font-bold text-lg">{school.name}</h3>
                              {school.verificationStatus && (
                                <div className="flex items-center">
                                  <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-100" />
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{school.location}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">{school.curriculumType}</span>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="ml-1 text-sm font-medium">{(school.rating || 0) / 10}</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Link href={`/schools/${school.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  View School
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 p-6 text-center bg-gray-50 rounded-lg">
                        <div className="flex flex-col items-center">
                          <SearchX className="h-12 w-12 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-1">No similar schools found</h3>
                          <p className="text-gray-500 text-sm mb-4">We couldn't find any similar approved schools at this time.</p>
                          <Link href="/discover">
                            <Button variant="outline" size="sm">
                              Explore All Schools
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Review Dialog */}
          <Dialog 
            open={isReviewDialogOpen} 
            onOpenChange={(open) => {
              setIsReviewDialogOpen(open);
              if (!open) {
                setEditingReview(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  {editingReview ? "Edit Your Review" : "Write a Review"}
                </DialogTitle>
                <DialogDescription>
                  Share your experience with {school?.name} to help other parents make informed decisions.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => reviewMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="text-2xl focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star 
                                  className={`h-8 w-8 ${
                                    star <= field.value 
                                      ? "text-yellow-400 fill-current" 
                                      : "text-gray-300"
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Experience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your experience with this school..."
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your honest feedback helps other parents make better decisions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="flex items-center justify-between">
                    <div>
                      {editingReview && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this review?")) {
                              deleteReviewMutation.mutate(editingReview.id);
                              setIsReviewDialogOpen(false);
                              setEditingReview(null);
                            }
                          }}
                          disabled={deleteReviewMutation.isPending}
                          className="mr-2"
                        >
                          {deleteReviewMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : "Delete Review"}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => {
                          setIsReviewDialogOpen(false);
                          setEditingReview(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={reviewMutation.isPending}
                      >
                        {reviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingReview ? "Updating..." : "Submitting..."}
                          </>
                        ) : editingReview ? "Update Review" : "Submit Review"}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Contact Dialog */}
          <Dialog 
            open={isContactDialogOpen} 
            onOpenChange={(open) => {
              setIsContactDialogOpen(open);
            }}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Send className="h-5 w-5 text-primary-600 mr-2" />
                  Contact {schoolData.name}
                </DialogTitle>
                <DialogDescription>
                  Send a message to {schoolData.name} to learn more about their programs or request a tour.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(data => contactMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Your email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={contactForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="forGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>For Grade (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Preschool">Preschool</SelectItem>
                              <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                              <SelectItem value="Grade 1">Grade 1</SelectItem>
                              <SelectItem value="Grade 2">Grade 2</SelectItem>
                              <SelectItem value="Grade 3">Grade 3</SelectItem>
                              <SelectItem value="Grade 4">Grade 4</SelectItem>
                              <SelectItem value="Grade 5">Grade 5</SelectItem>
                              <SelectItem value="Grade 6">Grade 6</SelectItem>
                              <SelectItem value="Grade 7">Grade 7</SelectItem>
                              <SelectItem value="Grade 8">Grade 8</SelectItem>
                              <SelectItem value="Grade 9">Grade 9</SelectItem>
                              <SelectItem value="Grade 10">Grade 10</SelectItem>
                              <SelectItem value="Grade 11">Grade 11</SelectItem>
                              <SelectItem value="Grade 12">Grade 12</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={contactForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your message or questions for the school..."
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific about what information you're looking for or if you'd like to schedule a tour.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <div className="flex space-x-2 w-full justify-end">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => setIsContactDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2"
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default SchoolDetails;
