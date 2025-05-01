import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import {
  Search, Filter, Star, Eye, CheckCircle, XCircle, AlertTriangle,
  ThumbsUp, ThumbsDown, Flag, MessageSquare, Download, MoreHorizontal,
  Pencil, Trash, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Review type for TypeScript
interface Review {
  id: number;
  schoolId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  moderationStatus: string;
  moderationNotes: string | null;
  moderatedAt: string | null;
  moderatedBy: number | null;
  user?: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  school?: {
    id: number;
    name: string;
    location: string;
    type: string;
    imageUrl: string | null;
  };
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

interface School {
  id: number;
  name: string;
  location: string;
}

// Form schema for creating and editing reviews
const reviewFormSchema = z.object({
  userId: z.number().positive("User is required"),
  schoolId: z.number().positive("School is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const ReviewModeration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isModerateDialogOpen, setIsModerateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Form for creating and editing reviews
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      userId: 0,
      schoolId: 0,
      rating: 5,
      comment: "",
    },
  });
  
  // Update form when selected review changes
  useEffect(() => {
    if (selectedReview && isEditDialogOpen) {
      form.reset({
        userId: selectedReview.userId,
        schoolId: selectedReview.schoolId,
        rating: selectedReview.rating,
        comment: selectedReview.comment || "",
      });
    } else if (isCreateDialogOpen) {
      form.reset({
        userId: 0,
        schoolId: 0,
        rating: 5,
        comment: "",
      });
    }
  }, [selectedReview, isEditDialogOpen, isCreateDialogOpen, form]);
  
  // Fetch all reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['/api/platform-admin/reviews'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching reviews",
        description: "There was a problem loading the reviews data."
      });
    }
  });
  
  // Fetch users for create/edit forms
  const { data: users = [] } = useQuery({
    queryKey: ['/api/platform-admin/users'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: "There was a problem loading users data."
      });
    }
  });
  
  // Fetch schools for create/edit forms
  const { data: schools = [] } = useQuery({
    queryKey: ['/api/schools', { limit: 100, offset: 0 }],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching schools",
        description: "There was a problem loading schools data."
      });
    }
  });
  
  // Moderate review mutation
  const moderateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, status, notes }: { reviewId: number, status: string, notes: string }) => {
      const response = await fetch(`/api/platform-admin/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to moderate review');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/reviews'] });
      setIsModerateDialogOpen(false);
      setModerationNotes('');
      toast({
        title: `Review ${variables.status}`,
        description: `The review has been ${variables.status} successfully.`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Moderation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      const response = await fetch('/api/platform-admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/reviews'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Review created",
        description: "The review has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: ReviewFormValues }) => {
      const response = await fetch(`/api/platform-admin/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/reviews'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Review updated",
        description: "The review has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/platform-admin/reviews/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/reviews'] });
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Use data from API
  const reviewsData = reviews || [];
  
  // Filter reviews based on search and tab
  const filteredReviews = reviewsData.filter(review => {
    const matchesSearch =
      (review.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (review.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (review.school?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && review.moderationStatus === 'pending';
    if (activeTab === 'approved') return matchesSearch && review.moderationStatus === 'approved';
    if (activeTab === 'rejected') return matchesSearch && review.moderationStatus === 'rejected';
    
    return matchesSearch;
  });
  
  // Functions to handle dialogs
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsViewDialogOpen(true);
  };
  
  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateReview = () => {
    setSelectedReview(null);
    setIsCreateDialogOpen(true);
  };
  
  const handleModerateReview = (review: Review) => {
    setSelectedReview(review);
    setModerationNotes('');
    setIsModerateDialogOpen(true);
  };
  
  const handleApproveReview = () => {
    if (selectedReview) {
      moderateReviewMutation.mutate({
        reviewId: selectedReview.id,
        status: 'approved',
        notes: moderationNotes
      });
    }
  };
  
  const handleRejectReview = () => {
    if (selectedReview) {
      moderateReviewMutation.mutate({
        reviewId: selectedReview.id,
        status: 'rejected',
        notes: moderationNotes
      });
    }
  };
  
  const handleSubmitCreateReview = (values: ReviewFormValues) => {
    createReviewMutation.mutate(values);
  };
  
  const handleSubmitEditReview = (values: ReviewFormValues) => {
    if (selectedReview) {
      updateReviewMutation.mutate({
        id: selectedReview.id,
        values
      });
    }
  };
  
  const handleConfirmDeleteReview = () => {
    if (selectedReview) {
      deleteReviewMutation.mutate(selectedReview.id);
    }
  };
  
  const getRatingStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
      />
    ));
  };
  
  const getModerationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><Flag className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Review Moderation | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Review Moderation</h2>
              <p className="text-muted-foreground">
                Moderate user-submitted reviews for schools
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateReview} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Review
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Reports
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="text-xs flex gap-1">
                <Filter className="h-3 w-3" />
                Filter
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 mb-4">
              <TabsTrigger value="all" className="text-xs">All Reviews</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableCaption>
                      {filteredReviews.length === 0
                        ? 'No reviews found matching the criteria.'
                        : `A list of ${filteredReviews.length} reviews.`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={review.user?.avatarUrl || ""} alt={review.user?.fullName} />
                                <AvatarFallback>
                                  {review.user?.fullName?.substring(0, 2).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm">{review.user?.fullName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{review.school?.name}</div>
                            <div className="text-xs text-muted-foreground">{review.school?.location}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex">
                              {getRatingStars(review.rating)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm">
                              {review.comment || <span className="text-muted-foreground italic">No comment</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{getModerationStatusBadge(review.moderationStatus)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewReview(review)}>
                                  <Eye className="h-4 w-4 mr-2" />View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditReview(review)}>
                                  <Pencil className="h-4 w-4 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReview(review)}
                                  className="text-red-500">
                                  <Trash className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                                {review.moderationStatus === 'pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleModerateReview(review)}
                                      className="text-green-500"
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-2" />Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleModerateReview(review)}
                                      className="text-red-500"
                                    >
                                      <ThumbsDown className="h-4 w-4 mr-2" />Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{filteredReviews.length}</strong> of <strong>{reviewsData.length}</strong> reviews
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* View Review Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                  View detailed information about the review.
                </DialogDescription>
              </DialogHeader>
              {selectedReview && (
                <div className="space-y-4 py-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{selectedReview.school?.name}</h3>
                      <div className="text-sm text-muted-foreground">{selectedReview.school?.location}</div>
                    </div>
                    <div>
                      {getModerationStatusBadge(selectedReview.moderationStatus)}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedReview.user?.avatarUrl || ""} alt={selectedReview.user?.fullName} />
                          <AvatarFallback>
                            {selectedReview.user?.fullName?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedReview.user?.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(selectedReview.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        {getRatingStars(selectedReview.rating)}
                      </div>
                    </div>
                    
                    <p className="text-sm">
                      {selectedReview.comment || <span className="italic text-muted-foreground">No comment provided</span>}
                    </p>
                  </div>
                  
                  {selectedReview.moderationStatus !== 'pending' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Moderation Notes</div>
                      <Alert variant={selectedReview.moderationStatus === 'approved' ? "default" : "destructive"}>
                        <MessageSquare className="h-4 w-4" />
                        <AlertTitle capitalize="true">{selectedReview.moderationStatus}</AlertTitle>
                        <AlertDescription>
                          {selectedReview.moderationNotes || 'No notes provided'}
                        </AlertDescription>
                      </Alert>
                      <div className="text-xs text-muted-foreground">
                        Moderated by Admin on {selectedReview.moderatedAt ?
                          format(new Date(selectedReview.moderatedAt), "MMMM d, yyyy 'at' h:mm a") :
                          'Unknown date'}
                      </div>
                    </div>
                  )}
                  
                  {selectedReview.moderationStatus === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleModerateReview(selectedReview);
                        }}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleModerateReview(selectedReview);
                        }}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Moderate Review Dialog */}
          <Dialog open={isModerateDialogOpen} onOpenChange={setIsModerateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Moderate Review</DialogTitle>
                <DialogDescription>
                  Please provide your decision and optional moderation notes.
                </DialogDescription>
              </DialogHeader>
              {selectedReview && (
                <div className="space-y-4 py-2">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium text-sm">{selectedReview.user?.fullName}</div>
                      <div className="text-xs text-muted-foreground">review for {selectedReview.school?.name}</div>
                    </div>
                    <div className="flex mb-1">
                      {getRatingStars(selectedReview.rating)}
                    </div>
                    <p className="text-sm italic">
                      "{selectedReview.comment || 'No comment provided'}"
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="moderation-notes" className="text-sm font-medium">Moderation Notes (Optional)</label>
                    <Textarea
                      id="moderation-notes"
                      placeholder="Enter notes about this moderation decision..."
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      These notes will be visible to the platform administrators only.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsModerateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRejectReview}>
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Reject Review
                </Button>
                <Button onClick={handleApproveReview}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Approve Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Create Review Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Review</DialogTitle>
                <DialogDescription>
                  Create a new review for a school. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <Form {...form} onSubmit={form.handleSubmit(handleSubmitCreateReview)}>
                <div className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
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
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools.map((school: any) => (
                              <SelectItem key={school.id} value={school.id.toString()}>
                                {school.name}
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
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <div className="flex space-x-2 items-center">
                          <FormControl>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <div className="flex">
                            {getRatingStars(field.value)}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter review comment"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                  >
                    {form.formState.isSubmitting ? "Creating..." : "Create Review"}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Review Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Review</DialogTitle>
                <DialogDescription>
                  Update the existing review details.
                </DialogDescription>
              </DialogHeader>
              <Form {...form} onSubmit={form.handleSubmit(handleSubmitEditReview)}>
                <div className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
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
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a school" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schools.map((school: any) => (
                              <SelectItem key={school.id} value={school.id.toString()}>
                                {school.name}
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
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <div className="flex space-x-2 items-center">
                          <FormControl>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <div className="flex">
                            {getRatingStars(field.value)}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter review comment"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedReview && selectedReview.moderationStatus !== 'pending' && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium mb-1">Moderation Status</div>
                      <div className="flex items-center space-x-2">
                        {getModerationStatusBadge(selectedReview.moderationStatus)}
                        <span className="text-xs text-muted-foreground">
                          {selectedReview.moderatedAt ? 
                            `Moderated on ${format(new Date(selectedReview.moderatedAt), "MMM d, yyyy")}` : 
                            "Not yet moderated"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                  >
                    {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Review Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Review</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this review? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {selectedReview && (
                <div className="space-y-4 py-2">
                  <div className="p-3 border rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm">
                        {selectedReview.user?.fullName} 
                        <span className="text-muted-foreground text-xs ml-1">
                          reviewed {selectedReview.school?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex mb-1">
                      {getRatingStars(selectedReview.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedReview.comment || "No comment provided"}
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeleteReview}
                  disabled={deleteReviewMutation.isPending}
                >
                  {deleteReviewMutation.isPending ? "Deleting..." : "Delete Review"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default ReviewModeration;