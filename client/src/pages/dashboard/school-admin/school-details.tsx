import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { School } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import { SchoolAdminLayout } from "@/components/layouts/school-admin-layout";

// Form validation schema
const schoolDetailsSchema = z.object({
  name: z.string().min(3, { message: "School name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  location: z.string().min(2, { message: "Location is required" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  type: z.string().min(1, { message: "School type is required" }),
  curriculum_type: z.string().optional(),
  grade_range: z.string().optional(),
  class_size: z.string().optional(),
  tuition_range: z.string().optional(),
  has_financial_aid: z.boolean().optional(),
  established_year: z.string().optional(),
  contact_email: z.string().email({ message: "Invalid email address" }).optional(),
  contact_phone: z.string().optional(),
  website: z.string().optional(),
});

type SchoolDetailsFormValues = z.infer<typeof schoolDetailsSchema>;

export default function SchoolDetails() {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: school, isLoading } = useQuery({
    queryKey: ['/api/admin/schools', schoolId],
    queryFn: () => apiRequest(`/api/admin/schools/${schoolId}`),
    enabled: !!schoolId,
  });
  
  const form = useForm<SchoolDetailsFormValues>({
    resolver: zodResolver(schoolDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      address: "",
      type: "",
      curriculum_type: "",
      grade_range: "",
      class_size: "",
      tuition_range: "",
      has_financial_aid: false,
      established_year: "",
      contact_email: "",
      contact_phone: "",
      website: "",
    },
  });
  
  // Update form values when school data is loaded
  React.useEffect(() => {
    if (school) {
      form.reset({
        name: school.name || "",
        description: school.description || "",
        location: school.location || "",
        address: school.address || "",
        type: school.type || "",
        curriculum_type: school.curriculum_type || "",
        grade_range: school.grade_range || "",
        class_size: school.class_size || "",
        tuition_range: school.tuition_range || "",
        has_financial_aid: school.has_financial_aid || false,
        established_year: school.established_year?.toString() || "",
        contact_email: school.contact_email || "",
        contact_phone: school.contact_phone || "",
        website: school.website || "",
      });
    }
  }, [school, form]);
  
  // Handle form submission to update school details
  const updateSchoolMutation = useMutation({
    mutationFn: (data: SchoolDetailsFormValues) => 
      apiRequest(`/api/admin/schools/${schoolId}`, {
        method: "PUT",
        data,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School details updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/schools', schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update school details",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SchoolDetailsFormValues) => {
    updateSchoolMutation.mutate(data);
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form to current school data
    if (school) {
      form.reset({
        name: school.name || "",
        description: school.description || "",
        location: school.location || "",
        address: school.address || "",
        type: school.type || "",
        curriculum_type: school.curriculum_type || "",
        grade_range: school.grade_range || "",
        class_size: school.class_size || "",
        tuition_range: school.tuition_range || "",
        has_financial_aid: school.has_financial_aid || false,
        established_year: school.established_year?.toString() || "",
        contact_email: school.contact_email || "",
        contact_phone: school.contact_phone || "",
        website: school.website || "",
      });
    }
    setIsEditing(false);
  };
  
  if (isLoading) {
    return (
      <SchoolAdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SchoolAdminLayout>
    );
  }
  
  if (!school) {
    return (
      <SchoolAdminLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              School not found or you don't have permission to access this school.
            </AlertDescription>
          </Alert>
        </div>
      </SchoolAdminLayout>
    );
  }
  
  return (
    <SchoolAdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <School className="h-8 w-8 mr-2 text-primary" />
            <h1 className="text-2xl font-bold">{school.name} Details</h1>
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit School Details
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="school-details-form"
                  disabled={updateSchoolMutation.isPending}
                >
                  {updateSchoolMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="academic">Academic Details</TabsTrigger>
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form id="school-details-form" onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                      Basic information about your school
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted" : ""}
                            />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted" : ""}
                              rows={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a detailed description of your school
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location (City)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                              />
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
                            <FormControl>
                              {isEditing ? (
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select school type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Public">Public</SelectItem>
                                    <SelectItem value="Private">Private</SelectItem>
                                    <SelectItem value="Charter">Charter</SelectItem>
                                    <SelectItem value="International">International</SelectItem>
                                    <SelectItem value="Montessori">Montessori</SelectItem>
                                    <SelectItem value="Religious">Religious</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input 
                                  value={field.value} 
                                  readOnly 
                                  className="bg-muted" 
                                />
                              )}
                            </FormControl>
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
                            <Textarea 
                              {...field} 
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted" : ""}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="established_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Year</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="academic">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Details about your school's academic offerings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="curriculum_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curriculum Type</FormLabel>
                          <FormControl>
                            {isEditing ? (
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value || ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select curriculum type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="National">National</SelectItem>
                                  <SelectItem value="International Baccalaureate (IB)">International Baccalaureate (IB)</SelectItem>
                                  <SelectItem value="Cambridge (IGCSE)">Cambridge (IGCSE)</SelectItem>
                                  <SelectItem value="American">American</SelectItem>
                                  <SelectItem value="British">British</SelectItem>
                                  <SelectItem value="Montessori">Montessori</SelectItem>
                                  <SelectItem value="STEM-focused">STEM-focused</SelectItem>
                                  <SelectItem value="Arts-focused">Arts-focused</SelectItem>
                                  <SelectItem value="Mixed/Other">Mixed/Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                value={field.value || ""} 
                                readOnly 
                                className="bg-muted" 
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="grade_range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade Range</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                                placeholder="e.g., K-12, 1-8, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="class_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Average Class Size</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                                placeholder="e.g., 15-20 students"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="tuition_range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tuition Range</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                                placeholder="e.g., $5,000-$10,000/year"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="has_financial_aid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Financial Aid Available
                              </FormLabel>
                              <FormDescription>
                                Does your school offer financial assistance?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!isEditing}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Contact details for your school
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
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
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted" : ""}
                              placeholder="https://www.example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </div>
    </SchoolAdminLayout>
  );
}