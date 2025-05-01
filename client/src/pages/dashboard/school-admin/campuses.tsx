import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Check,
  ChevronsUpDown,
  Edit,
  Building,
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
  X,
  Map
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminLayout } from '@/components/layouts/school-admin-layout';

// Form schema for campus
const campusFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location is required." }),
  address: z.string().min(2, { message: "Address is required." }),
  description: z.string().nullable().optional(),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }).nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  establishedYear: z.string().nullable().optional(),
  isMainCampus: z.boolean().default(false),
  facilities: z.array(z.string()).nullable().optional(),
  studentCount: z.number().nullable().optional(),
});

type CampusFormValues = z.infer<typeof campusFormSchema>;

interface Campus {
  id: number;
  name: string;
  location: string;
  address: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  imageUrl: string | null;
  isMainCampus: boolean | null;
  facilities: string[] | null;
  establishedYear: string | null;
  studentCount: number | null;
  createdAt: string;
  schoolId: number;
}

const facilities = [
  "Auditorium",
  "Library",
  "Computer Lab",
  "Science Lab",
  "Sports Ground",
  "Swimming Pool",
  "Cafeteria",
  "Health Center",
  "Music Room",
  "Art Studio",
  "Gymnasium",
  "Prayer Hall",
];

const SchoolAdminCampuses = () => {
  const { schoolId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  // Fetch campuses for this school
  const { data: campuses, isLoading } = useQuery<Campus[]>({
    queryKey: ['/api/admin/schools', schoolId, 'campuses'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/campuses`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campuses');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Interface for campus change requests
  interface CampusChangeRequest {
    id: number;
    campusId: number | null;
    schoolId: number;
    requestedById: number;
    requestType: 'create' | 'update' | 'delete';
    status: 'pending' | 'approved' | 'rejected';
    requestData: any;
    notes: string | null;
    createdAt: string;
    updatedAt: string | null;
    reviewedById: number | null;
    reviewedAt: string | null;
  }
  
  // Fetch campus change requests for this school
  const { data: campusChangeRequests, isLoading: isLoadingChangeRequests } = useQuery<CampusChangeRequest[]>({
    queryKey: ['/api/admin/schools', schoolId, 'campus-change-requests'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/campus-change-requests`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campus change requests');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Default form values
  const defaultValues: Partial<CampusFormValues> = {
    name: "",
    location: "",
    address: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    imageUrl: "",
    establishedYear: "",
    isMainCampus: false,
    facilities: [],
    studentCount: null,
  };
  
  // Form for adding new campus
  const addForm = useForm<CampusFormValues>({
    resolver: zodResolver(campusFormSchema),
    defaultValues,
  });
  
  // Form for editing campus
  const editForm = useForm<CampusFormValues>({
    resolver: zodResolver(campusFormSchema),
    defaultValues,
  });
  
  // Create campus change request mutation
  const createCampusChangeRequestMutation = useMutation({
    mutationFn: async (data: CampusFormValues) => {
      const response = await apiRequest('POST', `/api/admin/schools/${schoolId}/campus-change-requests`, {
        requestType: 'create',
        requestData: {
          ...data,
          schoolId: parseInt(schoolId as string),
        }
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'campuses'],
      });
      
      // Also invalidate campus change requests
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'campus-change-requests'],
      });
      
      addForm.reset(defaultValues);
      setIsAddDialogOpen(false);
      toast({
        title: "Campus request submitted",
        description: "Your request to add a new campus has been submitted for approval by the platform administrator.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to submit campus request:", error);
      toast({
        title: "Failed to submit campus request",
        description: "There was an error submitting your campus request. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update campus mutation
  const updateCampusMutation = useMutation({
    mutationFn: async (data: CampusFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/admin/campuses/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'campuses'],
      });
      editForm.reset(defaultValues);
      setIsEditDialogOpen(false);
      setSelectedCampus(null);
      toast({
        title: "Campus updated",
        description: "The campus has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update campus:", error);
      toast({
        title: "Failed to update campus",
        description: "There was an error updating the campus. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete campus mutation
  const deleteCampusMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/campuses/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'campuses'],
      });
      setIsDeleteDialogOpen(false);
      setSelectedCampus(null);
      toast({
        title: "Campus deleted",
        description: "The campus has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to delete campus:", error);
      toast({
        title: "Failed to delete campus",
        description: "There was an error deleting the campus. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const onAddSubmit = (data: CampusFormValues) => {
    createCampusChangeRequestMutation.mutate(data);
  };
  
  const onEditSubmit = (data: CampusFormValues) => {
    if (!selectedCampus) return;
    updateCampusMutation.mutate({
      ...data,
      id: selectedCampus.id,
    });
  };
  
  const handleEdit = (campus: Campus) => {
    setSelectedCampus(campus);
    editForm.reset({
      name: campus.name,
      location: campus.location,
      address: campus.address,
      description: campus.description,
      contactEmail: campus.contactEmail,
      contactPhone: campus.contactPhone,
      imageUrl: campus.imageUrl,
      establishedYear: campus.establishedYear,
      isMainCampus: campus.isMainCampus === null ? false : campus.isMainCampus,
      facilities: campus.facilities || [],
      studentCount: campus.studentCount,
    });
    setSelectedFacilities(campus.facilities || []);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (campus: Campus) => {
    setSelectedCampus(campus);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedCampus) {
      deleteCampusMutation.mutate(selectedCampus.id);
    }
  };
  
  // Toggle facility selection
  const toggleFacility = (facility: string) => {
    setSelectedFacilities((current) => {
      const updated = current.includes(facility)
        ? current.filter((f) => f !== facility)
        : [...current, facility];
      
      // Update the form value
      const formToUpdate = isEditDialogOpen ? editForm : addForm;
      formToUpdate.setValue('facilities', updated);
      
      return updated;
    });
  };
  
  // Filter campuses based on search term
  const filteredCampuses = campuses
    ? campuses.filter((campus) => {
        // Safely check campus properties to prevent null/undefined errors
        const name = campus?.name || '';
        const location = campus?.location || '';
        const description = campus?.description || '';
        
        const matchesSearch = 
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          description.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
    : [];
  
  // Demo campuses for display if API is not connected
  const demoCampuses: Campus[] = [
    {
      id: 1,
      name: "Main Campus",
      location: "Lahore",
      address: "Mall Road, Lahore",
      description: "The main campus with all facilities and administrative offices.",
      contactEmail: "main@school.edu.pk",
      contactPhone: "+92 42 35880001",
      imageUrl: null,
      isMainCampus: true,
      facilities: ["Library", "Auditorium", "Sports Ground", "Science Lab"],
      establishedYear: "1985",
      studentCount: 1200,
      createdAt: "2023-01-01T00:00:00Z",
      schoolId: parseInt(schoolId as string),
    },
    {
      id: 2,
      name: "Junior Campus",
      location: "Lahore",
      address: "Model Town, Lahore",
      description: "Campus for pre-primary and primary classes.",
      contactEmail: "junior@school.edu.pk",
      contactPhone: "+92 42 35880002",
      imageUrl: null,
      isMainCampus: false,
      facilities: ["Library", "Playground", "Art Studio"],
      establishedYear: "1990",
      studentCount: 800,
      createdAt: "2023-01-01T00:00:00Z",
      schoolId: parseInt(schoolId as string),
    },
    {
      id: 3,
      name: "Senior Campus",
      location: "Lahore",
      address: "Gulberg, Lahore",
      description: "Campus for secondary and higher secondary classes.",
      contactEmail: "senior@school.edu.pk",
      contactPhone: "+92 42 35880003",
      imageUrl: null,
      isMainCampus: false,
      facilities: ["Library", "Science Lab", "Computer Lab", "Sports Ground"],
      establishedYear: "1995",
      studentCount: 950,
      createdAt: "2023-01-01T00:00:00Z",
      schoolId: parseInt(schoolId as string),
    },
  ];
  
  // Always use API data, only show loading state while fetching
  const displayCampuses = isLoading ? [] : filteredCampuses;
  
  return (
    <>
      <Helmet>
        <title>Campus Management | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Campus Management</h2>
              <p className="text-muted-foreground">
                Manage your school's multiple campuses, locations, and facilities.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Add Campus
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                  <DialogTitle>Add New Campus</DialogTitle>
                  <DialogDescription>
                    Add details for a new campus or branch of your school.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campus Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City, Area" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Street address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="establishedYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Established Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. 2010" value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="studentCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student Count</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value || ''} 
                                onChange={(e) => {
                                  field.onChange(e.target.value === '' ? null : parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Brief description about this campus" 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Image URL for campus" value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="isMainCampus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Main Campus</FormLabel>
                            <FormDescription>
                              Mark this as the main campus of your school
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
                      control={addForm.control}
                      name="facilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facilities</FormLabel>
                          <FormDescription>
                            Select the facilities available at this campus
                          </FormDescription>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {facilities.map((facility) => (
                              <div 
                                key={facility}
                                className={`cursor-pointer rounded-md border p-2 text-sm flex items-center gap-2 ${
                                  selectedFacilities.includes(facility) 
                                    ? 'bg-primary/10 border-primary' 
                                    : ''
                                }`}
                                onClick={() => toggleFacility(facility)}
                              >
                                {selectedFacilities.includes(facility) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                                <span>{facility}</span>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCampusChangeRequestMutation.isPending}
                      >
                        {createCampusChangeRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search and filters */}
          <div className="flex items-center border rounded-md w-full max-w-sm">
            <Search className="w-4 h-4 mx-3 text-muted-foreground" />
            <Input
              placeholder="Search campuses..."
              className="border-0 focus-visible:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                className="px-3 rounded-none"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Pending Change Requests */}
          {campusChangeRequests && campusChangeRequests.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Pending Campus Requests</CardTitle>
                <CardDescription>
                  Your campus change requests that are waiting for approval from platform administrators.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campusChangeRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Badge variant={
                            request.requestType === 'create' ? 'default' : 
                            request.requestType === 'update' ? 'outline' : 
                            'destructive'
                          }>
                            {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'pending' ? 'secondary' : 
                            request.status === 'approved' ? 'default' : 
                            'destructive'
                          }>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.requestType === 'create' && request.requestData && (
                            <span>{request.requestData.name} ({request.requestData.location})</span>
                          )}
                          {request.requestType === 'update' && request.campusId && (
                            <span>Campus ID: {request.campusId}</span>
                          )}
                          {request.requestType === 'delete' && request.campusId && (
                            <span>Campus ID: {request.campusId}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.notes || 'No notes'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Campus cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCampuses.map((campus) => (
              <Card key={campus.id} className="overflow-hidden">
                <div className="h-40 bg-muted/40 flex items-center justify-center">
                  {campus.imageUrl ? (
                    <img 
                      src={campus.imageUrl} 
                      alt={campus.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{campus.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Map className="h-3.5 w-3.5" />
                        {campus.location}
                      </CardDescription>
                    </div>
                    {campus.isMainCampus && (
                      <Badge variant="default" className="ml-2">Main Campus</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{campus.address}</p>
                    {campus.description && (
                      <p className="text-sm mt-2 line-clamp-2">{campus.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {campus.establishedYear && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Established:</span>
                        <span>{campus.establishedYear}</span>
                      </div>
                    )}
                    {campus.studentCount && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Students:</span>
                        <span>{campus.studentCount.toLocaleString()}</span>
                      </div>
                    )}
                    {campus.contactEmail && (
                      <div className="flex items-center gap-2 text-sm overflow-hidden">
                        <span className="font-medium">Email:</span>
                        <span className="truncate">{campus.contactEmail}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Facilities:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campus.facilities && campus.facilities.length > 0 ? (
                        campus.facilities.slice(0, 4).map((facility) => (
                          <Badge key={facility} variant="outline" className="text-xs">
                            {facility}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No facilities listed</span>
                      )}
                      {campus.facilities && campus.facilities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{campus.facilities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(campus)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Campus
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(campus)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Campus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Edit Campus</DialogTitle>
                <DialogDescription>
                  Update the details for {selectedCampus?.name}
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City, Area" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="establishedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Year</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. 2010" value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="studentCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ''} 
                              onChange={(e) => {
                                field.onChange(e.target.value === '' ? null : parseInt(e.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Brief description about this campus" 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Image URL for campus" value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isMainCampus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Main Campus</FormLabel>
                          <FormDescription>
                            Mark this as the main campus of your school
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
                    control={editForm.control}
                    name="facilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facilities</FormLabel>
                        <FormDescription>
                          Select the facilities available at this campus
                        </FormDescription>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {facilities.map((facility) => (
                            <div 
                              key={facility}
                              className={`cursor-pointer rounded-md border p-2 text-sm flex items-center gap-2 ${
                                selectedFacilities.includes(facility) 
                                  ? 'bg-primary/10 border-primary' 
                                  : ''
                              }`}
                              onClick={() => toggleFacility(facility)}
                            >
                              {selectedFacilities.includes(facility) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              <span>{facility}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateCampusMutation.isPending}
                    >
                      {updateCampusMutation.isPending ? "Updating..." : "Update Campus"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedCampus?.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteCampusMutation.isPending}
                >
                  {deleteCampusMutation.isPending ? "Deleting..." : "Delete Campus"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
        </div>
      </SchoolAdminLayout>
    </>
  );
};

export default SchoolAdminCampuses;