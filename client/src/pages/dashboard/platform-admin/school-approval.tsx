import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CheckCircle, Building, Calendar, Users, XCircle, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SchoolChangeRequest {
  id: number;
  schoolId: number | null;
  requestedById: number;
  requestedByName?: string;
  requestType: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  requestData: any;
  notes: string | null;
}

interface School {
  id: number;
  name: string;
  type: string;
  location: string;
  description?: string;
  adminId: number | null;
  approvalStatus: string;
  verificationStatus: boolean;
  rejectionReason?: string | null;
}

interface UserSchool {
  id: number;
  userId: number;
  schoolId: number;
  role: string;
  permissions: string[];
  isMainAdmin: boolean;
  schoolName?: string;
  userName?: string;
}

interface ApprovalStats {
  schools: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  changeRequests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export default function SchoolApprovalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SchoolChangeRequest | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDirectApproveDialogOpen, setIsDirectApproveDialogOpen] = useState(false);
  const [isDirectRejectDialogOpen, setIsDirectRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  // Store school for direct approve/reject after dialog is closed
  const [schoolToApprove, setSchoolToApprove] = useState<School | null>(null);
  const [schoolToReject, setSchoolToReject] = useState<School | null>(null);
  // Add separate loading state for verification action
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  // Fetch all change requests
  const { 
    data: changeRequests = [], 
    isLoading: isLoadingRequests,
    error: requestsError
  } = useQuery({
    queryKey: ['/api/admin/approval/change-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/approval/change-requests');
      const data = await response.json();
      return data as SchoolChangeRequest[];
    }
  });

  // Fetch schools by approval status
  const { 
    data: schools = [], 
    isLoading: isLoadingSchools,
    error: schoolsError
  } = useQuery({
    queryKey: ['/api/admin/approval/schools/status', activeTab],
    queryFn: async () => {
      // If 'all' is selected, fetch pending schools as default
      const status = activeTab === 'all' ? 'pending' : activeTab;
      const response = await apiRequest('GET', `/api/admin/approval/schools/status/${status}`);
      const data = await response.json();
      return data as School[];
    },
    enabled: activeTab !== 'all' // Only fetch when a specific tab is selected
  });

  // Fetch approval statistics
  const { 
    data: stats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['/api/admin/approval/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/approval/stats');
      const data = await response.json();
      return data as ApprovalStats;
    }
  });

  // Mutation for approving/rejecting change requests
  const reviewChangeRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes
    }: {
      requestId: number;
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/admin/approval/change-requests/${requestId}/review`,
        { status, notes }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/schools/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/stats'] });
      
      // Show success toast
      toast({
        title: "Success",
        description: "Change request has been processed successfully.",
      });
      
      // Reset UI state
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setRejectionNotes('');
    },
    onError: (error) => {
      console.error("Error processing change request:", error);
      toast({
        title: "Error",
        description: "Failed to process change request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Separate mutation for toggling verification status
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({
      schoolId,
      status,
      verificationStatus
    }: {
      schoolId: number;
      status: string;
      verificationStatus: boolean;
    }) => {
      console.log("Toggling verification status:", { schoolId, status, verificationStatus });
      const response = await apiRequest(
        'PATCH',
        `/api/admin/approval/schools/${schoolId}/status`,
        { status, verificationStatus }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/schools/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/stats'] });
      
      // Show success toast
      toast({
        title: "Success",
        description: "School verification status has been updated.",
      });
      
      // Reset UI state
      setIsVerificationLoading(false);
    },
    onError: (error) => {
      console.error("Error updating verification status:", error);
      toast({
        title: "Error",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
      // Reset loading state in case of error
      setIsVerificationLoading(false);
    }
  });

  // Mutation for directly updating school approval status
  const updateSchoolStatusMutation = useMutation({
    mutationFn: async ({
      schoolId,
      status,
      rejectionReason
    }: {
      schoolId: number;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      console.log("Updating school approval status:", { schoolId, status, rejectionReason });
      const response = await apiRequest(
        'PATCH',
        `/api/admin/approval/schools/${schoolId}/status`,
        { status, rejectionReason }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/schools/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approval/stats'] });
      
      // Show success toast
      toast({
        title: "Success",
        description: "School has been updated successfully.",
      });
      
      // Reset UI state
      setIsDirectApproveDialogOpen(false);
      setIsDirectRejectDialogOpen(false);
      setSelectedSchool(null);
      setSchoolToApprove(null);
      setSchoolToReject(null);
      setRejectionReason('');
    },
    onError: (error) => {
      console.error("Error updating school status:", error);
      toast({
        title: "Error",
        description: "Failed to update school. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter requests based on the active tab and search query
  const filteredRequests = changeRequests.filter((request: SchoolChangeRequest) => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch = searchQuery === "" || 
      (request.requestData?.name && request.requestData.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });
  
  // Filter schools based on search query
  const filteredSchools = schools.filter((school: School) => {
    return searchQuery === "" || 
      (school.name && school.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  // Event handlers
  const handleViewRequest = (request: SchoolChangeRequest) => {
    setSelectedRequest(request);
  };
  
  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
  };
  
  const handleApproveRequest = async (request: SchoolChangeRequest) => {
    try {
      await reviewChangeRequestMutation.mutateAsync({
      requestId: request.id,
      status: 'approved',
      notes: approvalNotes
    });
      // Success is handled in mutation's onSuccess callback
    } catch (error) {
      // Error is already handled in mutation's onError
      console.error("Error in handleApproveRequest:", error);
    }
  };
  
  const handleRejectRequest = async (request: SchoolChangeRequest) => {
    try {
      await reviewChangeRequestMutation.mutateAsync({
      requestId: request.id,
      status: 'rejected',
      notes: rejectionNotes
    });
      // Success is handled in mutation's onSuccess callback
    } catch (error) {
      // Error is already handled in mutation's onError
      console.error("Error in handleRejectRequest:", error);
    }
  };
  
  const handleDirectApproveSchool = async (school: School) => {
    try {
      await updateSchoolStatusMutation.mutateAsync({
      schoolId: school.id,
      status: 'approved'
    });
      // Success is handled in the mutation's onSuccess callback
      setSchoolToApprove(null);
    } catch (error) {
      // Error is already handled in mutation's onError, but we need this
      // catch to prevent UI freezing if an unexpected error occurs
      console.error("Error in handleDirectApproveSchool:", error);
      setSchoolToApprove(null);
    }
  };
  
  const handleDirectRejectSchool = async (school: School) => {
    try {
      await updateSchoolStatusMutation.mutateAsync({
      schoolId: school.id,
      status: 'rejected',
      rejectionReason: rejectionReason
    });
      // Success is handled in the mutation's onSuccess callback
      setSchoolToReject(null);
    } catch (error) {
      // Error is already handled in mutation's onError, but we need this
      // catch to prevent UI freezing if an unexpected error occurs
      console.error("Error in handleDirectRejectSchool:", error);
      setSchoolToReject(null);
    }
  };

  // New handler for verify/unverify button
  const handleToggleVerification = async (school: School) => {
    try {
      setIsVerificationLoading(true);
      await toggleVerificationMutation.mutateAsync({
        schoolId: school.id,
        status: school.approvalStatus as string,
        verificationStatus: !school.verificationStatus
      });
      // Success is handled in mutation's onSuccess callback
    } catch (error) {
      // Error is already handled in mutation's onError
      console.error("Error in handleToggleVerification:", error);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Display loading or error states
  if (isLoadingRequests || isLoadingSchools || isLoadingStats) {
    return (
      <PlatformAdminLayout>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">School Approval</h1>
              <p className="text-muted-foreground">
                Manage school registration and update requests
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading school approval data...</p>
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }
  
  if (requestsError || schoolsError) {
    return (
      <PlatformAdminLayout>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">School Approval</h1>
              <p className="text-muted-foreground">
                Manage school registration and update requests
              </p>
            </div>
          </div>
          
          <div className="rounded-md border border-destructive p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error loading the approval data. Please try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">School Approval</h1>
            <p className="text-muted-foreground">
              Manage school registration and update requests
            </p>
          </div>
        </div>
        
        {/* Statistics Summary */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.schools.pending}</div>
                <p className="text-xs text-amber-500 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Needs review
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.schools.approved}</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Visible to users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.schools.rejected}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Change Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.changeRequests.total}</div>
                <p className="text-xs text-amber-500 flex items-center mt-1">
                  {stats.changeRequests.pending > 0 && (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {stats.changeRequests.pending} pending
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="requests">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="requests">Change Requests</TabsTrigger>
              <TabsTrigger value="schools">Schools</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Input 
                placeholder="Search by name..." 
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Change Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex mb-4">
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All Requests</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRequests.length > 0 && filteredRequests.map((request: SchoolChangeRequest) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {request.requestType === 'registration' ? (
                            <Building className="h-4 w-4 mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {request.requestData.name}
                        </CardTitle>
                        <CardDescription>
                          {request.requestType === 'registration' ? 'New School Registration' : 'School Update Request'}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          request.status === 'approved' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 
                          'outline'
                        }
                      >
                        {request.status === 'approved' ? 'Approved' : 
                         request.status === 'rejected' ? 'Rejected' : 
                         'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid gap-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        Requested by: {request.requestedByName}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      {request.requestType === 'registration' && (
                        <div className="text-sm">
                          <span className="font-semibold">Location:</span> {request.requestData.location}
                        </div>
                      )}
                      {request.requestType === 'update' && (
                        <div className="text-sm">
                          <span className="font-semibold">Changes:</span> {request.requestData.changes ? Object.keys(request.requestData.changes).join(', ') : 'None'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleViewRequest(request)}
                    >
                      View Details
                    </Button>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={(e) => {
                            // Prevent event propagation
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setSelectedRequest(request);
                            setIsRejectDialogOpen(true);
                          }}
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          onClick={(e) => {
                            // Prevent event propagation
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setSelectedRequest(request);
                            setIsApproveDialogOpen(true);
                          }}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No {activeTab} requests found</p>
              </div>
            )}
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-4">
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex mb-4">
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSchools.length > 0 && filteredSchools.map((school: School) => (
                    <Card key={school.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center">
                              <Building className="h-4 w-4 mr-2" />
                              {school.name}
                            </CardTitle>
                            <CardDescription>
                              {school.type}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={
                              school.approvalStatus === 'approved' ? 'default' : 
                              school.approvalStatus === 'rejected' ? 'destructive' : 
                              'outline'
                            }
                          >
                            {school.approvalStatus === 'approved' ? 'Approved' : 
                             school.approvalStatus === 'rejected' ? 'Rejected' : 
                             'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid gap-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Building className="h-4 w-4 mr-2" />
                            {school.location}
                          </div>
                          {school.verificationStatus && (
                            <div className="flex items-center text-sm text-green-500">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verified
                            </div>
                          )}
                          {school.rejectionReason && (
                            <div className="text-sm text-destructive">
                              <span className="font-semibold">Rejection reason:</span> {school.rejectionReason}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleViewSchool(school)}
                        >
                          View Details
                        </Button>
                        {school.approvalStatus === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={(e) => {
                                // Prevent event propagation
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Close school details dialog first
                                const schoolCopy = {...school};
                                setSelectedSchool(null);
                                // Store the school for rejection and wait to open dialog
                                setTimeout(() => {
                                  setSchoolToReject(schoolCopy);
                                setIsDirectRejectDialogOpen(true);
                                }, 100);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              onClick={(e) => {
                                // Prevent event propagation
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Close school details dialog first
                                const schoolCopy = {...school};
                                setSelectedSchool(null);
                                // Store the school for approval and wait to open dialog
                                setTimeout(() => {
                                  setSchoolToApprove(schoolCopy);
                                setIsDirectApproveDialogOpen(true);
                                }, 100);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {filteredSchools.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No {activeTab} schools found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        
        {/* Request Details Dialog */}
        <Dialog 
          open={!!selectedRequest} 
          onOpenChange={(open) => {
            if (!open) {
              // Use timeout to allow proper focus management and avoid the accessibility error
              setTimeout(() => {
                setSelectedRequest(null);
              }, 100);
            }
          }}
        >
        {selectedRequest && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedRequest.requestType === 'registration' ? 'School Registration Request' : 'School Update Request'}</DialogTitle>
                <DialogDescription>
                  {selectedRequest.requestType === 'registration' ? 'Review the details of this new school registration' : 'Review the requested changes for this school'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedRequest.requestData.name}</h3>
                  <Badge 
                    variant={
                      selectedRequest.status === 'approved' ? 'default' : 
                      selectedRequest.status === 'rejected' ? 'destructive' : 
                      'outline'
                    }
                  >
                    {selectedRequest.status === 'approved' ? 'Approved' : 
                     selectedRequest.status === 'rejected' ? 'Rejected' : 
                     'Pending'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold">Requested By:</p>
                    <p className="text-sm">{selectedRequest.requestedByName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Submission Date:</p>
                    <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  {selectedRequest.reviewedAt && (
                    <div>
                      <p className="text-sm font-semibold">Review Date:</p>
                      <p className="text-sm">{new Date(selectedRequest.reviewedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-semibold mb-2">Request Details</h4>
                  {selectedRequest.requestType === 'registration' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold">School Name:</p>
                        <p className="text-sm">{selectedRequest.requestData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">School Type:</p>
                        <p className="text-sm">{selectedRequest.requestData.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Location:</p>
                        <p className="text-sm">{selectedRequest.requestData.location}</p>
                      </div>
                      {selectedRequest.requestData.description && (
                        <div className="col-span-2">
                          <p className="text-sm font-semibold">Description:</p>
                          <p className="text-sm">{selectedRequest.requestData.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">Requested Changes:</p>
                      {selectedRequest.requestData.changes && Object.entries(selectedRequest.requestData.changes).map(([key, value]) => (
                        <div key={key} className="mt-2">
                          <p className="text-sm font-semibold capitalize">{key}:</p>
                          <p className="text-sm">{value as string}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedRequest.notes && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2">Review Notes</h4>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        // Prevent event propagation
                        e.preventDefault();
                        e.stopPropagation();
                        
                        setIsRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      onClick={(e) => {
                        // Prevent event propagation
                        e.preventDefault();
                        e.stopPropagation();
                        
                        setIsApproveDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
                {selectedRequest.status !== 'pending' && (
                  <Button onClick={() => setSelectedRequest(null)}>Close</Button>
                )}
              </DialogFooter>
            </DialogContent>
        )}
        </Dialog>
        
        {/* Approval Dialog */}
        <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this request? This action will make the school or changes visible to all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="approval-notes">Notes (Optional)</Label>
              <Textarea 
                id="approval-notes"
                placeholder="Add approval notes..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => {
                // Prevent event propagation
                e.preventDefault();
                e.stopPropagation();
                
                setIsApproveDialogOpen(false);
                setSchoolToApprove(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  // Prevent event propagation
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (selectedRequest) {
                    handleApproveRequest(selectedRequest);
                  }
                }}
                disabled={reviewChangeRequestMutation.isPending}
              >
                {reviewChangeRequestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Approve"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Rejection Dialog */}
        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this request? Please provide a reason for the rejection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="rejection-notes" className="text-destructive">Rejection Reason (Required)</Label>
              <Textarea 
                id="rejection-notes"
                placeholder="Enter reason for rejection..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => {
                // Prevent event propagation
                e.preventDefault();
                e.stopPropagation();
                
                setIsRejectDialogOpen(false);
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  // Prevent event propagation
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (selectedRequest) {
                    handleRejectRequest(selectedRequest);
                  }
                }}
                disabled={!rejectionNotes.trim() || reviewChangeRequestMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {reviewChangeRequestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reject"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* School Details Dialog */}
        <Dialog 
          open={!!selectedSchool} 
          onOpenChange={(open) => {
            if (!open) {
              // Use timeout to allow proper focus management and avoid the accessibility error
              setTimeout(() => {
                setSelectedSchool(null);
              }, 100);
            }
          }}
        >
        {selectedSchool && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>School Details</DialogTitle>
                <DialogDescription>
                  Review the details of this school
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedSchool.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        selectedSchool.approvalStatus === 'approved' ? 'default' : 
                        selectedSchool.approvalStatus === 'rejected' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {selectedSchool.approvalStatus === 'approved' ? 'Approved' : 
                       selectedSchool.approvalStatus === 'rejected' ? 'Rejected' : 
                       'Pending'}
                    </Badge>
                    
                    {selectedSchool.verificationStatus && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold">School Type:</p>
                    <p className="text-sm">{selectedSchool.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Location:</p>
                    <p className="text-sm">{selectedSchool.location}</p>
                  </div>
                  
                  {selectedSchool.adminId && (
                    <div>
                      <p className="text-sm font-semibold">School Admin ID:</p>
                      <p className="text-sm">{selectedSchool.adminId}</p>
                    </div>
                  )}
                </div>
                
                {selectedSchool.description && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm">{selectedSchool.description}</p>
                  </div>
                )}
                
                {selectedSchool.rejectionReason && (
                  <div className="border border-destructive/20 bg-destructive/5 rounded-md p-4">
                    <h4 className="font-semibold mb-2 text-destructive">Rejection Reason</h4>
                    <p className="text-sm">{selectedSchool.rejectionReason}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2">
                  {selectedSchool.approvalStatus === 'approved' && (
                    <div className="flex items-center">
                      <Button
                        variant={selectedSchool.verificationStatus ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => {
                          // Prevent event bubbling that might cause focus issues
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Create a copy of the school data
                          const schoolCopy = {...selectedSchool};
                          const willVerify = !schoolCopy.verificationStatus;
                          
                          // Close the dialog first to avoid focus issues
                          setSelectedSchool(null);
                          
                          // Then process the verification after a small delay
                          setTimeout(() => {
                            // Show a toast message to indicate processing
                            toast({
                              title: "Processing",
                              description: `${willVerify ? "Verifying" : "Unverifying"} school...`,
                            });
                            
                            // Perform the verification
                            handleToggleVerification(schoolCopy);
                          }, 150);
                        }}
                        disabled={isVerificationLoading}
                      >
                        {isVerificationLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : selectedSchool.verificationStatus ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {selectedSchool.approvalStatus === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={(e) => {
                          // Prevent event propagation
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Close school details dialog first
                          const schoolCopy = {...selectedSchool};
                          setSelectedSchool(null);
                          // Store the school for rejection and wait to open dialog
                          setTimeout(() => {
                            setSchoolToReject(schoolCopy);
                          setIsDirectRejectDialogOpen(true);
                          }, 100);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        onClick={(e) => {
                          // Prevent event propagation
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Close school details dialog first
                          const schoolCopy = {...selectedSchool};
                          setSelectedSchool(null);
                          // Store the school for approval and wait to open dialog
                          setTimeout(() => {
                            setSchoolToApprove(schoolCopy);
                          setIsDirectApproveDialogOpen(true);
                          }, 100);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                  {selectedSchool.approvalStatus !== 'pending' && (
                    <Button onClick={() => setSelectedSchool(null)}>Close</Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
        )}
        </Dialog>
        
        {/* Direct Approve School Dialog */}
        <AlertDialog 
          open={isDirectApproveDialogOpen} 
          onOpenChange={(open) => {
            setIsDirectApproveDialogOpen(open);
            if (!open) {
              // Clear school reference when dialog is closed without action
              setSchoolToApprove(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve School</AlertDialogTitle>
              <AlertDialogDescription>
                {schoolToApprove ? (
                  <>Are you sure you want to approve <strong>{schoolToApprove.name}</strong>? This will make it visible to all users.</>
                ) : (
                  <>Are you sure you want to approve this school? This will make it visible to all users.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => {
                // Prevent event propagation
                e.preventDefault();
                e.stopPropagation();
                
                setIsDirectApproveDialogOpen(false);
                setSchoolToApprove(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  // Prevent event propagation
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (schoolToApprove) {
                    handleDirectApproveSchool(schoolToApprove);
                  }
                }}
                disabled={updateSchoolStatusMutation.isPending}
              >
                {updateSchoolStatusMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Approve"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Direct Reject School Dialog */}
        <AlertDialog 
          open={isDirectRejectDialogOpen} 
          onOpenChange={(open) => {
            setIsDirectRejectDialogOpen(open);
            if (!open) {
              // Clear school reference and reason when dialog is closed without action
              setSchoolToReject(null);
              setRejectionReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject School</AlertDialogTitle>
              <AlertDialogDescription>
                {schoolToReject ? (
                  <>Are you sure you want to reject <strong>{schoolToReject.name}</strong>? Please provide a reason for the rejection.</>
                ) : (
                  <>Are you sure you want to reject this school? Please provide a reason for the rejection.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="direct-rejection-reason" className="text-destructive">Rejection Reason (Required)</Label>
              <Textarea 
                id="direct-rejection-reason"
                placeholder="Add rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => {
                // Prevent event propagation
                e.preventDefault();
                e.stopPropagation();
                
                setIsDirectRejectDialogOpen(false);
                setSchoolToReject(null);
                setRejectionReason("");
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  // Prevent event propagation
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (schoolToReject) {
                    handleDirectRejectSchool(schoolToReject);
                  }
                }}
                disabled={!rejectionReason.trim() || updateSchoolStatusMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {updateSchoolStatusMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reject"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PlatformAdminLayout>
  );
}