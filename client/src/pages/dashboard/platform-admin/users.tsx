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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Search, Filter, Users, UserPlus, Eye, Edit, Trash, AlertTriangle, Download, MoreHorizontal,
  UserCheck, UserX, ShieldAlert, School, User
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// User type for TypeScript
interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  schoolId: number | null;
  createdAt: string;
  schoolName?: string;
  isActive?: boolean;
}

const UsersManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/platform-admin/users'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: "There was a problem loading the users data."
      });
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/platform-admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/users'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted."
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
  
  // Deactivate/activate user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number, isActive: boolean }) => {
      const response = await fetch(`/api/platform-admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/users'] });
      toast({
        title: variables.isActive ? "User activated" : "User deactivated",
        description: `The user has been ${variables.isActive ? 'activated' : 'deactivated'} successfully.`
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  // Use data from API
  const usersData = users || [];
  
  // Filter users based on search and tab
  const filteredUsers = usersData.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'users') return matchesSearch && user.role === 'user';
    if (activeTab === 'schoolAdmins') return matchesSearch && user.role === 'schoolAdmin';
    if (activeTab === 'platformAdmins') return matchesSearch && user.role === 'platformAdmin';
    if (activeTab === 'inactive') return matchesSearch && user.isActive === false;
    
    return matchesSearch;
  });
  
  // Functions to handle dialogs
  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };
  
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };
  
  const handleToggleUserStatus = (user: UserData) => {
    if (user) {
      toggleUserStatusMutation.mutate({
        userId: user.id,
        isActive: !user.isActive
      });
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platformAdmin':
        return <Badge className="bg-purple-500"><ShieldAlert className="w-3 h-3 mr-1" /> Platform Admin</Badge>;
      case 'schoolAdmin':
        return <Badge className="bg-blue-500"><School className="w-3 h-3 mr-1" /> School Admin</Badge>;
      case 'user':
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" /> User</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getStatusBadge = (isActive: boolean | undefined) => {
    return isActive 
      ? <Badge className="bg-green-500">Active</Badge>
      : <Badge variant="destructive">Inactive</Badge>;
  };
  
  return (
    <>
      <Helmet>
        <title>User Management | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-5 mb-4">
              <TabsTrigger value="all" className="text-xs">All Users</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
              <TabsTrigger value="schoolAdmins" className="text-xs">School Admins</TabsTrigger>
              <TabsTrigger value="platformAdmins" className="text-xs">Platform Admins</TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs">Inactive</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableCaption>
                      {filteredUsers.length === 0
                        ? 'No users found matching the criteria.'
                        : `A list of ${filteredUsers.length} users.`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
                              <AvatarFallback>
                                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {user.schoolName ? (
                              <div className="text-sm">{user.schoolName}</div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="h-4 w-4 mr-2" />View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4 mr-2" />Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                  {user.isActive ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-500">Deactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                      <span className="text-green-500">Activate</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-500"
                                >
                                  <Trash className="h-4 w-4 mr-2" />Delete User
                                </DropdownMenuItem>
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
                    Showing <strong>{filteredUsers.length}</strong> of <strong>{usersData.length}</strong> users
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* View User Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  View detailed information about the user.
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.avatarUrl || ""} alt={selectedUser.fullName} />
                      <AvatarFallback className="text-lg">
                        {selectedUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedUser.fullName}</h3>
                      <div className="text-sm text-muted-foreground">@{selectedUser.username}</div>
                      <div className="flex gap-2 mt-1">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser.isActive)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Email</h4>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Joined</h4>
                      <p className="text-sm">
                        {format(new Date(selectedUser.createdAt), "d MMMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Role</h4>
                      <p className="text-sm capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">School</h4>
                      <p className="text-sm">
                        {selectedUser.schoolName || 'Not associated with any school'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="active-status">Account Status</Label>
                        <div className="text-sm text-muted-foreground">
                          {selectedUser.isActive 
                            ? "User can log in and use the platform" 
                            : "User is deactivated and cannot log in"
                          }
                        </div>
                      </div>
                      <Switch 
                        id="active-status" 
                        checked={selectedUser.isActive}
                        onCheckedChange={() => handleToggleUserStatus(selectedUser)}
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    if (selectedUser) handleEditUser(selectedUser);
                  }}
                >
                  Edit User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete User Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user account
                  and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {selectedUser && (
                <div className="bg-destructive/10 p-3 rounded-md flex gap-2 items-start">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">{selectedUser.fullName} ({selectedUser.email})</p>
                    <p className="text-sm text-muted-foreground">
                      All user data including saved schools, activity logs, and preferences will be permanently deleted.
                    </p>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground"
                  onClick={confirmDeleteUser}
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default UsersManagement;