import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

// Campus features list
const CAMPUS_FEATURES = [
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
  "Gymnasium",
  "Playground",
  "Special Ed Resources",
  "Language Lab",
  "Robotics Lab",
  "3D Printing Facilities"
];

// Form schema
const campusFormSchema = z.object({
  name: z.string().min(3, "Campus name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  address: z.string().min(5, "Full address is required"),
  imageUrl: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  establishedYear: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number should be at least 10 digits"),
  contactPerson: z.string().min(3, "Contact person name is required"),
  studentCount: z.string().optional().nullable(),
  facultyCount: z.string().optional().nullable(),
  specialPrograms: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

type CampusFormValues = z.infer<typeof campusFormSchema>;

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

export default function CampusRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const schoolId = params.schoolId ? parseInt(params.schoolId) : null;
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch parent school details
  const { 
    data: school, 
    isLoading: isLoadingSchool, 
    error: schoolError 
  } = useQuery({
    queryKey: ['/api/admin/schools', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error("School ID is required");
      
      const response = await fetch(`/api/admin/schools/${schoolId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch school details");
      }
      return response.json();
    },
    enabled: !!schoolId,
    retry: 1,
  });

  const form = useForm<CampusFormValues>({
    resolver: zodResolver(campusFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: school?.location || "",
      address: "",
      imageUrl: null,
      features: [],
      coordinates: { lat: 0, lng: 0 },
      establishedYear: "",
      contactEmail: "",
      contactPhone: "",
      contactPerson: "",
      studentCount: "",
      facultyCount: "",
      specialPrograms: "",
      isPrimary: false,
    },
  });

  // Update form location when school data loads
  useEffect(() => {
    if (school && form) {
      form.setValue('location', school.location || '');
    }
  }, [school, form]);

  // Function to handle form submission
  async function onSubmit(values: CampusFormValues) {
    if (!schoolId) {
      toast({
        title: "Error",
        description: "No school ID provided",
        variant: "destructive",
      });
      return;
    }

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
      
      // Add school ID and admin ID
      const campusData = {
        ...values,
        schoolId,
        adminId: user?.id,
      };
      
      // Send to approval queue instead of directly creating
      const response = await apiRequest("POST", `/api/admin/schools/${schoolId}/campus-requests`, campusData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit campus for approval");
      }
      
      const result = await response.json();
      
      toast({
        title: "Campus Submitted",
        description: "Your campus has been submitted for approval. You'll be notified once it's reviewed.",
      });
      
      // Redirect to admin dashboard
      navigate("/admin");
    } catch (error) {
      console.error("Error submitting campus:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit campus",
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

  if (isLoadingSchool) {
    return (
      <SchoolAdminLayout>
        <div className="container mx-auto p-6">
          <div className="mb-8 flex items-center space-x-2">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="space-y-6">
            <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </SchoolAdminLayout>
    );
  }

  if (schoolError || !school) {
    return (
      <SchoolAdminLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load school information. Please try again or contact support.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate("/admin")} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </SchoolAdminLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Register Campus | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Register Campus</h1>
            <p className="text-muted-foreground mt-2">
              Add a new campus for {school.name}
            </p>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Approval Required</AlertTitle>
            <AlertDescription>
              New campus registrations require approval from platform administrators before becoming visible to users.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide the essential details about this campus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campus Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campus name" {...field} />
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
                      name="isPrimary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 mt-6">
                          <div className="space-y-0.5">
                            <FormLabel>Primary Campus</FormLabel>
                            <FormDescription>
                              Is this the main campus of the school?
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
                        <FormLabel>Campus Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe this campus, its facilities, and unique aspects" 
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
                  <CardTitle>Campus Location</CardTitle>
                  <CardDescription>
                    Select this campus's precise location on the map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Click on the map to place a marker at the campus's location
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
                        * Please select the campus location on the map
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Provide contact details specific to this campus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of contact person" {...field} />
                          </FormControl>
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
                            <Input placeholder="e.g. 2005" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="campus@example.com" 
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+92 123 4567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campus Details</CardTitle>
                  <CardDescription>
                    Additional information about this campus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Count</FormLabel>
                          <FormControl>
                            <Input placeholder="Approximate number of students" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="facultyCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faculty Count</FormLabel>
                          <FormControl>
                            <Input placeholder="Number of faculty members" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="specialPrograms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Programs</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any special programs offered at this campus" 
                            className="min-h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="features"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Campus Features</FormLabel>
                          <FormDescription>
                            Select all facilities and features available at this campus
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {CAMPUS_FEATURES.map((feature) => (
                            <FormField
                              key={feature}
                              control={form.control}
                              name="features"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={feature}
                                    className="flex flex-row items-start space-x-3 space-y-0"
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
                                    <FormLabel className="font-normal">
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

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SchoolAdminLayout>
    </>
  );
}