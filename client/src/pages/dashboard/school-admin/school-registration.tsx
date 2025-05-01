import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SchoolAdminLayout } from "@/components/layouts/school-admin-layout";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Helmet } from "react-helmet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

// Fix Leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// School features list
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

// School types
const SCHOOL_TYPES = [
  "Private",
  "Public",
  "Charter",
  "International",
  "Montessori",
  "Religious",
  "STEM-focused",
  "Arts-focused",
  "Language Immersion",
  "Special Education",
  "Vocational",
  "Boarding",
  "Other"
];

// Curriculum types
const CURRICULUM_TYPES = [
  "National Curriculum",
  "International Baccalaureate (IB)",
  "Cambridge (IGCSE/A-Level)",
  "American Curriculum",
  "British Curriculum",
  "Montessori",
  "Waldorf/Steiner",
  "Reggio Emilia",
  "Religious Curriculum",
  "STEM Curriculum",
  "Arts-Integrated",
  "Custom/Alternative",
  "Mixed/Hybrid",
  "Other"
];

// Grade ranges
const GRADE_RANGES = [
  "Pre-Primary Only (Ages 3-5)",
  "Primary Only (Grades 1-5/6)",
  "Middle School Only (Grades 6-8)",
  "High School Only (Grades 9-12)",
  "Pre-Primary and Primary (Ages 3-12)",
  "Primary and Middle (Grades 1-8)",
  "Middle and High School (Grades 6-12)",
  "K-12 (All levels)",
  "Other"
];

// Class size options
const CLASS_SIZE_OPTIONS = [
  "Small (<15 students)",
  "Medium (15-25 students)",
  "Large (25+ students)",
  "Varies by grade level"
];

// Form schema
const schoolFormSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  address: z.string().min(5, "Full address is required"),
  type: z.string().min(1, "School type is required"),
  imageUrl: z.string().optional().nullable(),
  curriculumType: z.string().min(1, "Curriculum type is required"),
  gradeRange: z.string().min(1, "Grade range is required"),
  classSize: z.string().optional().nullable(),
  tuitionRange: z.string().optional().nullable(),
  hasFinancialAid: z.boolean().default(false),
  features: z.array(z.string()).optional().default([]),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  establishedYear: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number should be at least 10 digits"),
  website: z.string().url("Must be a valid URL").optional().nullable(),
  multiCampus: z.boolean().default(false),
});

type SchoolFormValues = z.infer<typeof schoolFormSchema>;

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition
}: { 
  position: L.LatLng | null; 
  setPosition: (pos: L.LatLng) => void 
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function SchoolRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      address: "",
      type: "",
      imageUrl: "",
      curriculumType: "",
      gradeRange: "",
      classSize: "",
      tuitionRange: "",
      hasFinancialAid: false,
      features: [],
      coordinates: { lat: 0, lng: 0 },
      establishedYear: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      multiCampus: false,
    },
  });

  // Function to handle form submission
  async function onSubmit(values: SchoolFormValues) {
    if (!position) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update coordinates from map position
      values.coordinates = {
        lat: position.lat,
        lng: position.lng,
      };
      
      // Add admin ID from the logged-in user and set approval status
      const schoolData = {
        ...values,
        adminId: user?.id,
        approvalStatus: "pending", // Schools require platform admin approval
      };
      
      // Submit to approval queue instead of creating directly
      const response = await apiRequest("POST", "/api/admin/school-requests", schoolData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit school for approval");
      }
      
      const result = await response.json();
      
      toast({
        title: "School Submitted",
        description: "Your school has been submitted for approval. You'll be notified once it's reviewed.",
      });
      
      // If multiCampus, redirect to campus registration
      if (values.multiCampus) {
        navigate(`/admin/campus-registration/${result.requestId}`);
      } else {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error creating school:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create school",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Set marker position when coordinates change
  const updatePosition = (latlng: L.LatLng) => {
    setPosition(latlng);
  };

  return (
    <>
      <Helmet>
        <title>Register School | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Register Your School</h1>
            <p className="text-muted-foreground mt-2">
              Complete the form below to register your school in our platform.
            </p>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Approval Required</AlertTitle>
            <AlertDescription>
              New school registrations require approval from platform administrators before becoming visible to users.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide the essential details about your school
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/Town</FormLabel>
                          <FormControl>
                            <Input placeholder="City or town" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Type</FormLabel>
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your school, its mission, values, and unique aspects" 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>School Location</CardTitle>
                  <CardDescription>
                    Select your school's precise location on the map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Click on the map to place a marker at your school's location
                    </p>
                    <div className="h-[400px] w-full rounded-md border overflow-hidden">
                      <MapContainer
                        center={[24.8607, 67.0011]} // Initial center (Karachi)
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker 
                          position={position} 
                          setPosition={updatePosition} 
                        />
                      </MapContainer>
                    </div>
                    {!position && (
                      <p className="text-sm text-red-500 mt-2">
                        * Please select your school's location on the map
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>
                    Details about your curriculum and academic offerings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="curriculumType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curriculum Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select curriculum type" />
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
                    
                    <FormField
                      control={form.control}
                      name="gradeRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Range</FormLabel>
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="classSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Typical Class Size</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CLASS_SIZE_OPTIONS.map((size) => (
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
                    
                    <FormField
                      control={form.control}
                      name="establishedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Year</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Year when school was founded" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tuitionRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tuition Range</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., $5,000-$10,000 per year" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hasFinancialAid"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div>
                            <FormLabel>Financial Aid Available</FormLabel>
                            <FormDescription>
                              Does your school offer scholarships or financial assistance?
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features & Facilities</CardTitle>
                  <CardDescription>
                    Select the features available at your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="features"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {SCHOOL_FEATURES.map((feature) => (
                            <FormField
                              key={feature}
                              control={form.control}
                              name="features"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={feature}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(feature)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, feature])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== feature
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {feature}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    How parents and students can reach your school
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="admissions@school.edu" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="555-123-4567" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.yourschool.edu" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://your-image-host.com/school-image.jpg" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a URL to an image of your school. This will be displayed in search results.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multiple Campuses</CardTitle>
                  <CardDescription>
                    Let us know if your school has multiple campuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="multiCampus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
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
                  
                  {form.watch("multiCampus") && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        After creating the main school, you'll be able to add details for each campus individually.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating School..." : "Register School"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SchoolAdminLayout>
    </>
  );
}