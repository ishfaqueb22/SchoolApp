import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  CheckCircle, XCircle, Clock, School, Search, Filter, Eye, Edit, Trash, AlertTriangle, Download, ArrowUpDown,
  Shield, ShieldCheck, ShieldAlert, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { queryClient } from '@/lib/queryClient';

// School type for TypeScript
interface School {
  id: number;
  name: string;
  description: string;
  location: string;
  type: string;
  approvalStatus: string;
  verificationStatus: boolean;
  adminId: number | null;
  lastVerifiedAt: string | null;
  adminEmail?: string;
  adminName?: string;
}

const SchoolsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editSchool, setEditSchool] = useState<Partial<School> | null>(null);
  const [isEditFormSubmitting, setIsEditFormSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch all schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['/api/platform-admin/schools'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching schools",
        description: "There was a problem loading the schools data."
      });
    }
  });
  
  // Approve school mutation
  const approveSchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const response = await fetch(`/api/platform-admin/schools/${schoolId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve school');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/schools'] });
      setIsApproveDialogOpen(false);
      toast({
        title: "School approved",
        description: "The school has been successfully approved."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Approval failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Reject school mutation
  const rejectSchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const response = await fetch(`/api/platform-admin/schools/${schoolId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject school');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/schools'] });
      setIsRejectDialogOpen(false);
      toast({
        title: "School rejected",
        description: "The school has been rejected."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Rejection failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const response = await fetch(`/api/platform-admin/schools/${schoolId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete school');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/schools'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "School deleted",
        description: "The school has been permanently deleted."
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
  
  // Edit school mutation
  const editSchoolMutation = useMutation({
    mutationFn: async (school: Partial<School> & { id: number }) => {
      const response = await fetch(`/api/platform-admin/schools/${school.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(school)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update school');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/schools'] });
      setIsEditDialogOpen(false);
      toast({
        title: "School updated",
        description: "The school has been successfully updated."
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
  
  // Verify school mutation
  const verifySchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const response = await fetch(`/api/platform-admin/schools/${schoolId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify school');
      }
      
      return response.json();
    },
    onSuccess: (_, schoolId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/schools'] });
      setIsVerifyDialogOpen(false);
      toast({
        title: "School verification status updated",
        description: "The school's verification status has been successfully updated."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Verification update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Use data from API
  const schoolsData = schools || [];
  
  // Filter schools based on search and tab
  const filteredSchools = schoolsData.filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.type.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && school.approvalStatus === 'pending';
    if (activeTab === 'approved') return matchesSearch && school.approvalStatus === 'approved';
    if (activeTab === 'rejected') return matchesSearch && school.approvalStatus === 'rejected';
    if (activeTab === 'unverified') return matchesSearch && !school.verificationStatus;
    
    return matchesSearch;
  });
  
  // Functions to handle dialogs
  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setIsViewDialogOpen(true);
  };
  
  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setEditSchool({
      id: school.id,
      name: school.name,
      description: school.description,
      location: school.location,
      type: school.type,
      adminId: school.adminId,
      adminEmail: school.adminEmail,
      adminName: school.adminName
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteSchool = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteDialogOpen(true);
  };
  
  const handleApproveSchool = (school: School) => {
    setSelectedSchool(school);
    setIsApproveDialogOpen(true);
  };
  
  const handleRejectSchool = (school: School) => {
    setSelectedSchool(school);
    setIsRejectDialogOpen(true);
  };
  
  const handleVerifySchool = (school: School) => {
    setSelectedSchool(school);
    setIsVerifyDialogOpen(true);
  };
  
  const confirmDeleteSchool = () => {
    if (selectedSchool) {
      deleteSchoolMutation.mutate(selectedSchool.id);
    }
  };
  
  const confirmApproveSchool = () => {
    if (selectedSchool) {
      approveSchoolMutation.mutate(selectedSchool.id);
    }
  };
  
  const confirmRejectSchool = () => {
    if (selectedSchool) {
      rejectSchoolMutation.mutate(selectedSchool.id);
    }
  };
  
  const confirmVerifySchool = () => {
    if (selectedSchool) {
      verifySchoolMutation.mutate(selectedSchool.id);
    }
  };
  
  const confirmEditSchool = () => {
    if (editSchool && editSchool.id) {
      editSchoolMutation.mutate(editSchool as (Partial<School> & { id: number }));
    }
  };
  
  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getVerificationStatusBadge = (status: boolean) => {
    return status 
      ? <Badge className="bg-blue-500">Verified</Badge>
      : <Badge variant="outline" className="border-gray-400 text-gray-500">Unverified</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>Schools Management | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Schools Management</h2>
              <p className="text-muted-foreground">
                View and manage all schools in the platform
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button>
                <School className="mr-2 h-4 w-4" />
                Add New School
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
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
              <Button variant="outline" size="sm" className="text-xs flex gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Sort
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-5 mb-4">
              <TabsTrigger value="all" className="text-xs">All Schools</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
              <TabsTrigger value="unverified" className="text-xs">Unverified</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableCaption>
                      {filteredSchools.length === 0
                        ? 'No schools found matching the criteria.'
                        : `A list of ${filteredSchools.length} schools.`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell>{school.location}</TableCell>
                          <TableCell>{school.type}</TableCell>
                          <TableCell>{getApprovalStatusBadge(school.approvalStatus)}</TableCell>
                          <TableCell>{getVerificationStatusBadge(school.verificationStatus)}</TableCell>
                          <TableCell>
                            {school.adminId 
                              ? <span className="text-sm">{school.adminName}</span>
                              : <Badge variant="outline" className="border-amber-500 text-amber-500">Unassigned</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleViewSchool(school)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditSchool(school)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {school.approvalStatus === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-green-500 hover:text-green-600"
                                    onClick={() => handleApproveSchool(school)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => handleRejectSchool(school)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {school.approvalStatus === 'approved' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className={school.verificationStatus 
                                    ? "text-red-500 hover:text-red-600" 
                                    : "text-blue-500 hover:text-blue-600"
                                  }
                                  onClick={() => handleVerifySchool(school)}
                                  title={school.verificationStatus ? "Remove verification" : "Verify school"}
                                >
                                  {school.verificationStatus 
                                    ? <ShieldAlert className="h-4 w-4" /> 
                                    : <ShieldCheck className="h-4 w-4" />
                                  }
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteSchool(school)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{filteredSchools.length}</strong> of <strong>{schoolsData.length}</strong> schools
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* View School Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>School Details</DialogTitle>
                <DialogDescription>
                  View detailed information about the school.
                </DialogDescription>
              </DialogHeader>
              {selectedSchool && (
                <div className="space-y-4 py-2">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{selectedSchool.name}</h3>
                      <div className="text-sm text-muted-foreground">{selectedSchool.location} • {selectedSchool.type}</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getApprovalStatusBadge(selectedSchool.approvalStatus)}
                      {getVerificationStatusBadge(selectedSchool.verificationStatus)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm">{selectedSchool.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Admin Information</h4>
                      {selectedSchool.adminId ? (
                        <div className="text-sm">
                          <p>{selectedSchool.adminName}</p>
                          <p>{selectedSchool.adminEmail}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No admin assigned</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Verification Status</h4>
                      {selectedSchool.verificationStatus ? (
                        <div className="text-sm">
                          <p className="text-green-500">Verified</p>
                          <p className="text-muted-foreground">
                            Last verified on {selectedSchool.lastVerifiedAt ?
                              format(new Date(selectedSchool.lastVerifiedAt), "d MMM yyyy 'at' h:mm a") :
                              'N/A'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not verified</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                {selectedSchool?.approvalStatus === 'pending' && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleRejectSchool(selectedSchool);
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleApproveSchool(selectedSchool);
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Approve School Dialog */}
          <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve School</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve this school? This will make the school visible to all users.
                </DialogDescription>
              </DialogHeader>
              {selectedSchool && (
                <div>
                  <p className="font-medium">{selectedSchool.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSchool.location}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmApproveSchool}>Approve School</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Reject School Dialog */}
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject School</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reject this school? This will prevent the school from being listed on the platform.
                </DialogDescription>
              </DialogHeader>
              {selectedSchool && (
                <div>
                  <p className="font-medium">{selectedSchool.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSchool.location}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmRejectSchool}>Reject School</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete School Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the school and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedSchool && (
                <div className="bg-destructive/10 p-3 rounded-md flex gap-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">{selectedSchool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      All faculty, campus, and student data will be permanently deleted.
                    </p>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground"
                  onClick={confirmDeleteSchool}
                >
                  Delete School
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Verify School Dialog */}
          <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedSchool?.verificationStatus ? "Unverify School" : "Verify School"}
                </DialogTitle>
                <DialogDescription>
                  {selectedSchool?.verificationStatus 
                    ? "Removing verification status will impact the school's visibility and features."
                    : "Verifying a school confirms that all its details have been manually checked and authenticated."
                  }
                </DialogDescription>
              </DialogHeader>
              {selectedSchool && (
                <div className="space-y-4">
                  <div className={selectedSchool.verificationStatus 
                    ? "bg-red-50 p-4 rounded-md" 
                    : "bg-blue-50 p-4 rounded-md"
                  }>
                    <div className="flex items-start gap-3">
                      {selectedSchool.verificationStatus
                        ? <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
                        : <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                      }
                      <div>
                        <p className="font-medium">{selectedSchool.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedSchool.location}</p>
                      </div>
                    </div>
                  </div>
                  {selectedSchool.verificationStatus ? (
                    <div className="text-sm text-muted-foreground">
                      <p>Removing verification status has these effects:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>School will no longer show a verified badge</li>
                        <li>May affect ranking in search results</li>
                        <li>May limit certain platform privileges</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>When verifying a school, you confirm that:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>School details have been manually verified</li>
                        <li>School administrators are legitimate</li>
                        <li>School has passed all platform requirements</li>
                        <li>School is in good standing with local educational authorities</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>Cancel</Button>
                <Button 
                  className={selectedSchool?.verificationStatus
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-blue-500 hover:bg-blue-600"
                  } 
                  onClick={confirmVerifySchool}
                >
                  {selectedSchool?.verificationStatus ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Remove Verification
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify School
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit School Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit School</DialogTitle>
                <DialogDescription>
                  Update school details and information.
                </DialogDescription>
              </DialogHeader>
              {editSchool && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">School Name</Label>
                      <Input 
                        id="name" 
                        value={editSchool.name || ''}
                        onChange={(e) => setEditSchool({...editSchool, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={editSchool.location || ''}
                        onChange={(e) => setEditSchool({...editSchool, location: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      className="min-h-[100px]"
                      value={editSchool.description || ''}
                      onChange={(e) => setEditSchool({...editSchool, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">School Type</Label>
                    <Select 
                      value={editSchool.type || ''}
                      onValueChange={(value) => setEditSchool({...editSchool, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="charter">Charter</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                        <SelectItem value="boarding">Boarding</SelectItem>
                        <SelectItem value="montessori">Montessori</SelectItem>
                        <SelectItem value="religious">Religious</SelectItem>
                        <SelectItem value="special_education">Special Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={confirmEditSchool}
                  disabled={isEditFormSubmitting || editSchoolMutation.isPending}
                >
                  {editSchoolMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default SchoolsManagement;