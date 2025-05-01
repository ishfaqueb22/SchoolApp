import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  CalendarIcon,
  Check,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  SearchIcon,
  User,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SchoolAdminLayout } from '@/components/layouts/school-admin-layout';

// Form schema for inquiry response
const inquiryResponseSchema = z.object({
  status: z.string().min(1, { message: "Status is required" }),
  response: z.string().min(10, { message: "Response must be at least 10 characters" }),
});

type InquiryResponseFormValues = z.infer<typeof inquiryResponseSchema>;

interface Inquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  schoolId: number;
  status: string | null;
  phone: string | null;
  forGrade: string | null;
  response: string | null;
  responseDate: string | null;
  createdAt: string;
}

const SchoolAdminInquiries = () => {
  const { schoolId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch inquiries for this school
  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/admin/schools', schoolId, 'inquiries'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/inquiries`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Default form values
  const defaultValues: Partial<InquiryResponseFormValues> = {
    status: "",
    response: "",
  };
  
  // Form for responding to inquiry
  const responseForm = useForm<InquiryResponseFormValues>({
    resolver: zodResolver(inquiryResponseSchema),
    defaultValues,
  });
  
  // Update inquiry mutation
  const updateInquiryMutation = useMutation({
    mutationFn: async (data: InquiryResponseFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/admin/inquiries/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'inquiries'],
      });
      responseForm.reset(defaultValues);
      setIsResponseDialogOpen(false);
      setSelectedInquiry(null);
      toast({
        title: "Response sent",
        description: "Your response has been saved and sent to the inquirer.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update inquiry:", error);
      toast({
        title: "Failed to send response",
        description: "There was an error sending your response. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onResponseSubmit = (data: InquiryResponseFormValues) => {
    if (!selectedInquiry) return;
    updateInquiryMutation.mutate({
      ...data,
      id: selectedInquiry.id,
    });
  };
  
  const handleRespond = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    responseForm.reset({
      status: inquiry.status || "inProgress",
      response: inquiry.response || "",
    });
    setIsResponseDialogOpen(true);
  };
  
  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewDialogOpen(true);
  };
  
  // Filter inquiries based on search term and status
  const filteredInquiries = inquiries
    ? inquiries.filter((inquiry) => {
        // Safely check inquiry properties to prevent null/undefined errors
        const name = inquiry?.name || '';
        const email = inquiry?.email || '';
        const message = inquiry?.message || '';
        const phone = inquiry?.phone || '';
        const status = inquiry?.status || '';
        
        const matchesSearch = 
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  // Use filtered inquiries from API data
  const displayInquiries = filteredInquiries;
  
  // Count inquiries by status
  const countByStatus = {
    total: displayInquiries.length,
    new: displayInquiries.filter(i => (i?.status || '') === "new").length,
    inProgress: displayInquiries.filter(i => (i?.status || '') === "inProgress").length,
    completed: displayInquiries.filter(i => (i?.status || '') === "completed").length,
  };
  
  return (
    <>
      <Helmet>
        <title>Inquiries Management | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inquiries Management</h2>
            <p className="text-muted-foreground">
              Manage and respond to parent and student inquiries.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Inquiries
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countByStatus.total}</div>
                <p className="text-xs text-muted-foreground">
                  All inquiries from parents and students
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Inquiries
                </CardTitle>
                <Badge className="bg-blue-500">New</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countByStatus.new}</div>
                <p className="text-xs text-muted-foreground">
                  Inquiries waiting for response
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  In Progress
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countByStatus.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  Inquiries being processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
                <Badge variant="outline" className="text-green-500 border-green-500">
                  Completed
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countByStatus.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Resolved and completed inquiries
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Inquiries</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="inProgress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <div className="relative w-[300px]">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inquiries..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value={statusFilter || "all"} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {statusFilter === null
                      ? "All Inquiries"
                      : statusFilter === "new"
                      ? "New Inquiries"
                      : statusFilter === "inProgress"
                      ? "In Progress Inquiries"
                      : "Completed Inquiries"}
                  </CardTitle>
                  <CardDescription>
                    {statusFilter === null
                      ? "View and manage all inquiries from parents and students."
                      : statusFilter === "new"
                      ? "Respond to new inquiries that require attention."
                      : statusFilter === "inProgress"
                      ? "Continue processing inquiries in progress."
                      : "Review completed and resolved inquiries."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Name</TableHead>
                          <TableHead className="hidden md:table-cell">Contact Info</TableHead>
                          <TableHead>Query</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex justify-center items-center">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span>Loading inquiries...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : displayInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                                <p className="text-muted-foreground">No inquiries found.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayInquiries.map((inquiry) => (
                            <TableRow key={inquiry.id} className={cn(
                              inquiry.status === "new" && "bg-blue-50 dark:bg-blue-950/20"
                            )}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{inquiry.name}</span>
                                  {inquiry.forGrade ? (
                                    <span className="text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 inline-flex items-center mt-1 w-fit">
                                      <span className="font-medium">Grade:</span> {inquiry.forGrade}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Grade not specified
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-col">
                                  <span className="flex items-center text-sm">
                                    <Mail className="h-3 w-3 mr-1" /> {inquiry.email}
                                  </span>
                                  {inquiry.phone && (
                                    <span className="flex items-center text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3 mr-1" /> {inquiry.phone}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="line-clamp-2 text-sm">
                                  {inquiry.message.substring(0, 60)}
                                  {inquiry.message.length > 60 ? "..." : ""}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-col">
                                  <span className="text-sm">
                                    {format(new Date(inquiry.createdAt), "MMM d, yyyy")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(inquiry.createdAt), "h:mm a")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "px-2.5 py-0.5 flex items-center gap-1",
                                    inquiry.status === "new" && "bg-blue-100 text-blue-800 hover:bg-blue-200 border-0",
                                    inquiry.status === "inProgress" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0",
                                    inquiry.status === "completed" && "bg-green-100 text-green-800 hover:bg-green-200 border-0"
                                  )}
                                >
                                  {inquiry.status === "new" ? (
                                    <>
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                      New
                                    </>
                                  ) : inquiry.status === "inProgress" ? (
                                    <>
                                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                                      In Progress
                                    </>
                                  ) : (
                                    <>
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                      Completed
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewInquiry(inquiry)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleRespond(inquiry)}>
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      {inquiry.response ? "Update Response" : "Respond"}
                                    </DropdownMenuItem>
                                    {inquiry.status !== "completed" && (
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          const newStatus = "completed";
                                          updateInquiryMutation.mutate({
                                            id: inquiry.id,
                                            status: newStatus,
                                            response: inquiry.response || "Marked as completed.",
                                          });
                                        }}
                                      >
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SchoolAdminLayout>
      
      {/* View Inquiry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              View complete details of this inquiry.
            </DialogDescription>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedInquiry.name}
                  </h3>
                  <div className="space-y-1 mt-1">
                    <p className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-2" /> {selectedInquiry.email}
                    </p>
                    {selectedInquiry.phone && (
                      <p className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2" /> {selectedInquiry.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground text-right flex items-center justify-end">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(new Date(selectedInquiry.createdAt), "MMMM d, yyyy h:mm a")}
                  </div>
                  <div className="mt-1 flex justify-end">
                    <Badge
                      className={cn(
                        "px-2.5 py-0.5 flex items-center gap-1",
                        selectedInquiry.status === "new" && "bg-blue-100 text-blue-800 hover:bg-blue-200 border-0",
                        selectedInquiry.status === "inProgress" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0",
                        selectedInquiry.status === "completed" && "bg-green-100 text-green-800 hover:bg-green-200 border-0"
                      )}
                    >
                      {selectedInquiry.status === "new" ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                          New
                        </>
                      ) : selectedInquiry.status === "inProgress" ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                          In Progress
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          Completed
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground mb-1">Inquiry for Grade Level</p>
                {selectedInquiry.forGrade ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md font-medium">
                      {selectedInquiry.forGrade}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Grade level not specified</p>
                )}
              </div>
              
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <p className="whitespace-pre-line">
                  {selectedInquiry.message}
                </p>
              </div>
              
              {selectedInquiry.response && (
                <div className="border rounded-md p-3 bg-muted/50">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-muted-foreground">Your Response</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInquiry.responseDate 
                        ? format(new Date(selectedInquiry.responseDate), "MMM d, yyyy")
                        : "Not sent"}
                    </p>
                  </div>
                  <p className="whitespace-pre-line">
                    {selectedInquiry.response}
                  </p>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleRespond(selectedInquiry);
                  }}
                >
                  {selectedInquiry.response ? "Update Response" : "Respond"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedInquiry?.response ? "Update Response" : "Respond to Inquiry"}
            </DialogTitle>
            <DialogDescription>
              {selectedInquiry?.response 
                ? "Update your response to this inquiry."
                : "Provide a response to this inquiry."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="border rounded-md p-3 bg-muted/50">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium">{selectedInquiry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedInquiry.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <p className="whitespace-pre-line text-sm">
                  {selectedInquiry.message.length > 200 
                    ? `${selectedInquiry.message.substring(0, 200)}...` 
                    : selectedInquiry.message}
                </p>
                {selectedInquiry.message.length > 200 && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => {
                      setIsResponseDialogOpen(false);
                      handleViewInquiry(selectedInquiry);
                    }}
                  >
                    Read full inquiry
                  </Button>
                )}
              </div>
              
              <Form {...responseForm}>
                <form onSubmit={responseForm.handleSubmit(onResponseSubmit)} className="space-y-4">
                  <FormField
                    control={responseForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Update Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Update the current status of this inquiry.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={responseForm.control}
                    name="response"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Response</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter your response to this inquiry..."
                            className="min-h-[200px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Your response will be sent to the inquirer via email.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsResponseDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateInquiryMutation.isPending}
                    >
                      {updateInquiryMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Send Response"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchoolAdminInquiries;