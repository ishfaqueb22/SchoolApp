import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Check,
  X,
  AlertCircle,
  Clock,
  Filter,
  Building,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Search,
} from 'lucide-react';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// Interface for school data
interface School {
  id: number;
  name: string;
  location: string;
}

const reviewFormSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional().default(''),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const PlatformAdminCampusRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRequest, setSelectedRequest] = useState<CampusChangeRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default form values
  const defaultReviewValues: ReviewFormValues = {
    status: 'approved',
    notes: '', // Empty string instead of null to avoid type issues
  };
  
  // Form for reviewing requests
  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: defaultReviewValues,
  });
  
  // Fetch all schools for reference
  const { data: schools } = useQuery<School[]>({
    queryKey: ['/api/schools/all'],
    queryFn: async () => {
      const response = await fetch('/api/schools/all');
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      return response.json();
    },
  });
  
  // Fetch campus change requests
  const { data: requests, isLoading } = useQuery<CampusChangeRequest[]>({
    queryKey: ['/api/platform-admin/campus-change-requests', { status: selectedStatusFilter }],
    queryFn: async () => {
      let url = '/api/platform-admin/campus-change-requests';
      if (selectedStatusFilter) {
        url += `?status=${selectedStatusFilter}`;
      }
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campus change requests');
      }
      return response.json();
    },
  });
  
  // Review request mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ReviewFormValues }) => {
      const response = await apiRequest('PATCH', `/api/platform-admin/campus-change-requests/${id}/status`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/platform-admin/campus-change-requests'],
      });
      
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      reviewForm.reset(defaultReviewValues);
      
      toast({
        title: "Request reviewed",
        description: "The campus change request has been reviewed successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to review request:", error);
      toast({
        title: "Failed to review request",
        description: "There was an error reviewing the request. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onReviewSubmit = (data: ReviewFormValues) => {
    if (selectedRequest) {
      reviewRequestMutation.mutate({
        id: selectedRequest.id,
        data,
      });
    }
  };
  
  // Open review dialog
  const handleReview = (request: CampusChangeRequest) => {
    setSelectedRequest(request);
    reviewForm.reset({
      status: 'approved',
      notes: '',
    });
    setIsReviewDialogOpen(true);
  };
  
  // Filter requests by search term
  const filteredRequests = requests
    ? requests.filter((request) => {
        if (!searchTerm) return true;
        
        // Get school name
        const school = schools?.find(s => s.id === request.schoolId);
        const schoolName = school?.name || '';
        
        // Check if request type or school name match search term
        return (
          request.requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schoolName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];
  
  // Get school name by ID
  const getSchoolName = (schoolId: number) => {
    const school = schools?.find(s => s.id === schoolId);
    return school?.name || `School ID: ${schoolId}`;
  };
  
  return (
    <>
      <Helmet>
        <title>Campus Change Requests | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Campus Change Requests</h2>
              <p className="text-muted-foreground">
                Review and manage campus change requests from school administrators
              </p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center border rounded-md w-full max-w-sm">
              <Search className="w-4 h-4 mx-3 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
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
            
            <Select
              value={selectedStatusFilter || "all"}
              onValueChange={(value) => setSelectedStatusFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Requests Table */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Campus Change Requests</CardTitle>
              <CardDescription>
                Review and manage requests to create, update, or delete school campuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Campus Requests Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || selectedStatusFilter 
                      ? "Try adjusting your filters to see more results" 
                      : "There are no campus change requests to review at this time"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">#{request.id}</TableCell>
                        <TableCell>{getSchoolName(request.schoolId)}</TableCell>
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
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReview(request)}
                            >
                              Review
                            </Button>
                          )}
                          {request.status !== 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReview(request)}
                              disabled
                            >
                              Reviewed
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Review Dialog */}
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Review Campus Change Request</DialogTitle>
                <DialogDescription>
                  {selectedRequest?.requestType === 'create'
                    ? 'Review request to create a new campus'
                    : selectedRequest?.requestType === 'update'
                    ? 'Review request to update a campus'
                    : 'Review request to delete a campus'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {selectedRequest && (
                <>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="font-medium text-right">School:</div>
                      <div className="col-span-3">{getSchoolName(selectedRequest.schoolId)}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="font-medium text-right">Request Type:</div>
                      <div className="col-span-3">
                        <Badge variant={
                          selectedRequest.requestType === 'create' ? 'default' : 
                          selectedRequest.requestType === 'update' ? 'outline' : 
                          'destructive'
                        }>
                          {selectedRequest.requestType.charAt(0).toUpperCase() + selectedRequest.requestType.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {selectedRequest.requestType === 'create' && selectedRequest.requestData && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">New Campus Details</h3>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-right">Name:</div>
                          <div className="col-span-3">{selectedRequest.requestData.name}</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-right">Location:</div>
                          <div className="col-span-3">{selectedRequest.requestData.location}</div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-right">Address:</div>
                          <div className="col-span-3">{selectedRequest.requestData.address}</div>
                        </div>
                        {selectedRequest.requestData.isMainCampus && (
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="font-medium text-right">Main Campus:</div>
                            <div className="col-span-3">
                              <Badge>Yes</Badge>
                            </div>
                          </div>
                        )}
                        {selectedRequest.requestData.description && (
                          <div className="grid grid-cols-4 gap-4 items-start">
                            <div className="font-medium text-right">Description:</div>
                            <div className="col-span-3">{selectedRequest.requestData.description}</div>
                          </div>
                        )}
                        {selectedRequest.requestData.facilities && selectedRequest.requestData.facilities.length > 0 && (
                          <div className="grid grid-cols-4 gap-4 items-start">
                            <div className="font-medium text-right">Facilities:</div>
                            <div className="col-span-3 flex flex-wrap gap-2">
                              {selectedRequest.requestData.facilities.map((facility: string) => (
                                <Badge key={facility} variant="outline">
                                  {facility}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedRequest.requestType === 'update' && selectedRequest.requestData && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Campus Update Details</h3>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-right">Campus ID:</div>
                          <div className="col-span-3">#{selectedRequest.campusId}</div>
                        </div>
                        {selectedRequest.requestData.name && (
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="font-medium text-right">Name:</div>
                            <div className="col-span-3">{selectedRequest.requestData.name}</div>
                          </div>
                        )}
                        {selectedRequest.requestData.location && (
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="font-medium text-right">Location:</div>
                            <div className="col-span-3">{selectedRequest.requestData.location}</div>
                          </div>
                        )}
                        {selectedRequest.requestData.address && (
                          <div className="grid grid-cols-4 gap-4 items-center">
                            <div className="font-medium text-right">Address:</div>
                            <div className="col-span-3">{selectedRequest.requestData.address}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedRequest.requestType === 'delete' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Campus Deletion Request</h3>
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-right">Campus ID:</div>
                          <div className="col-span-3">#{selectedRequest.campusId}</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md text-red-600 dark:text-red-400">
                          <AlertCircle className="h-5 w-5 inline-block mr-2" />
                          Warning: Approving this request will permanently delete this campus and all associated data.
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Form {...reviewForm}>
                    <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                      <FormField
                        control={reviewForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decision</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your decision" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reviewForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any notes or reasons for your decision"
                                className="resize-none"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                name={field.name}
                              />
                            </FormControl>
                            <FormDescription>
                              This will be visible to the school administrator.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsReviewDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={reviewRequestMutation.isPending}
                        >
                          {reviewRequestMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default PlatformAdminCampusRequests;