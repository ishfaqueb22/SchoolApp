import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Users, School, CalendarDays, Settings, Trash2, Edit, Eye, Plus, Check, ListChecks } from 'lucide-react';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface School {
  id: number;
  name: string;
  location: string;
  type: string;
  parentSchoolId: number | null;
  isSubCampus: boolean;
}

interface UserSchool {
  id: number;
  userId: number;
  schoolId: number;
  role: string;
  permissions: string[];
  isMainAdmin: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  schoolName?: string;
}

export default function UserSchoolsPage() {
  // Mock data until we integrate with the API
  const [userSchools, setUserSchools] = useState<UserSchool[]>([
    {
      id: 1,
      userId: 1,
      schoolId: 101,
      role: "admin",
      permissions: ["edit", "publish", "manage-faculty", "manage-inquiries"],
      isMainAdmin: true,
      createdAt: "2025-01-15T14:30:00",
      userName: "John Smith",
      userEmail: "john.smith@example.com",
      schoolName: "Springfield Elementary School"
    },
    {
      id: 2,
      userId: 2,
      schoolId: 102,
      role: "admin",
      permissions: ["edit", "publish", "manage-faculty"],
      isMainAdmin: true,
      createdAt: "2025-02-10T10:15:00",
      userName: "Jane Doe",
      userEmail: "jane.doe@example.com",
      schoolName: "Riverside High School"
    },
    {
      id: 3,
      userId: 1,
      schoolId: 104,
      role: "admin",
      permissions: ["edit", "publish"],
      isMainAdmin: false,
      createdAt: "2025-02-20T09:45:00",
      userName: "John Smith",
      userEmail: "john.smith@example.com",
      schoolName: "Lincoln Memorial School"
    },
    {
      id: 4,
      userId: 3,
      schoolId: 105,
      role: "admin",
      permissions: ["edit", "publish", "manage-faculty", "manage-inquiries", "manage-media"],
      isMainAdmin: true,
      createdAt: "2025-03-05T11:30:00",
      userName: "Michael Johnson",
      userEmail: "michael.johnson@example.com",
      schoolName: "Washington Academy"
    },
    {
      id: 5,
      userId: 4,
      schoolId: 103,
      role: "content-manager",
      permissions: ["edit", "publish"],
      isMainAdmin: false,
      createdAt: "2025-03-15T13:20:00",
      userName: "Sarah Williams",
      userEmail: "sarah.williams@example.com",
      schoolName: "Oakridge School"
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 1, username: "johnsmith", email: "john.smith@example.com", fullName: "John Smith", role: "schoolAdmin" },
    { id: 2, username: "janedoe", email: "jane.doe@example.com", fullName: "Jane Doe", role: "schoolAdmin" },
    { id: 3, username: "mjohnson", email: "michael.johnson@example.com", fullName: "Michael Johnson", role: "schoolAdmin" },
    { id: 4, username: "swilliams", email: "sarah.williams@example.com", fullName: "Sarah Williams", role: "schoolAdmin" },
    { id: 5, username: "asmith", email: "amelia.smith@example.com", fullName: "Amelia Smith", role: "user" }
  ]);

  const [schools, setSchools] = useState<School[]>([
    { id: 101, name: "Springfield Elementary School", location: "Springfield, IL", type: "Elementary", parentSchoolId: null, isSubCampus: false },
    { id: 102, name: "Riverside High School", location: "Riverside, CA", type: "High School", parentSchoolId: null, isSubCampus: false },
    { id: 103, name: "Oakridge School", location: "Oakridge, TN", type: "K-12", parentSchoolId: null, isSubCampus: false },
    { id: 104, name: "Lincoln Memorial School", location: "Chicago, IL", type: "Middle School", parentSchoolId: null, isSubCampus: false },
    { id: 105, name: "Washington Academy", location: "Washington, DC", type: "Private", parentSchoolId: null, isSubCampus: false }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserSchool, setSelectedUserSchool] = useState<UserSchool | null>(null);
  const [editingUserSchool, setEditingUserSchool] = useState<UserSchool | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // New user-school link form state
  const [newUserSchool, setNewUserSchool] = useState({
    userId: '',
    schoolId: '',
    role: 'admin',
    isMainAdmin: false,
    permissions: [] as string[]
  });

  // Available permissions for school admins
  const availablePermissions = [
    { id: "edit", label: "Edit School Information" },
    { id: "publish", label: "Publish Content" },
    { id: "manage-faculty", label: "Manage Faculty" },
    { id: "manage-inquiries", label: "Manage Inquiries" },
    { id: "manage-media", label: "Manage Media" },
    { id: "manage-events", label: "Manage Events" },
    { id: "manage-reviews", label: "Moderate Reviews" }
  ];

  // Filter user-school links based on search query and active tab
  const filteredUserSchools = userSchools.filter((userSchool: UserSchool) => {
    const matchesSearch = 
      (userSchool.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (userSchool.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (userSchool.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      userSchool.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'main-admin') return userSchool.isMainAdmin && matchesSearch;
    if (activeTab === 'secondary-admin') return !userSchool.isMainAdmin && matchesSearch;
    
    return matchesSearch;
  });

  // Event handlers
  const handleViewUserSchool = (userSchool: UserSchool) => {
    setSelectedUserSchool(userSchool);
  };

  const handleEditUserSchool = (userSchool: UserSchool) => {
    setEditingUserSchool(userSchool);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUserSchool = (userSchool: UserSchool) => {
    // Remove the user-school link
    const updatedUserSchools = userSchools.filter(us => us.id !== userSchool.id);
    setUserSchools(updatedUserSchools);
    setIsDeleteDialogOpen(false);
    setSelectedUserSchool(null);
  };

  const handleCreateUserSchool = () => {
    if (!newUserSchool.userId || !newUserSchool.schoolId) return;
    
    // Find user and school for display names
    const user = users.find(u => u.id === parseInt(newUserSchool.userId));
    const school = schools.find(s => s.id === parseInt(newUserSchool.schoolId));
    
    if (!user || !school) return;
    
    // Create a new user-school link
    const newLink: UserSchool = {
      id: Math.max(...userSchools.map(us => us.id)) + 1,
      userId: parseInt(newUserSchool.userId),
      schoolId: parseInt(newUserSchool.schoolId),
      role: newUserSchool.role,
      permissions: newUserSchool.permissions,
      isMainAdmin: newUserSchool.isMainAdmin,
      createdAt: new Date().toISOString(),
      userName: user.fullName,
      userEmail: user.email,
      schoolName: school.name
    };
    
    setUserSchools([...userSchools, newLink]);
    setIsCreateDialogOpen(false);
    
    // Reset form
    setNewUserSchool({
      userId: '',
      schoolId: '',
      role: 'admin',
      isMainAdmin: false,
      permissions: []
    });
  };

  const handleUpdateUserSchool = () => {
    if (!editingUserSchool) return;
    
    // Update the user-school link
    const updatedUserSchools = userSchools.map(us => 
      us.id === editingUserSchool.id ? editingUserSchool : us
    );
    
    setUserSchools(updatedUserSchools);
    setIsEditDialogOpen(false);
    setEditingUserSchool(null);
    setSelectedUserSchool(null);
  };

  const togglePermission = (permission: string) => {
    if (!editingUserSchool) return;
    
    const updatedPermissions = editingUserSchool.permissions.includes(permission)
      ? editingUserSchool.permissions.filter(p => p !== permission)
      : [...editingUserSchool.permissions, permission];
    
    setEditingUserSchool({
      ...editingUserSchool,
      permissions: updatedPermissions
    });
  };

  const toggleNewPermission = (permission: string) => {
    const updatedPermissions = newUserSchool.permissions.includes(permission)
      ? newUserSchool.permissions.filter(p => p !== permission)
      : [...newUserSchool.permissions, permission];
    
    setNewUserSchool({
      ...newUserSchool,
      permissions: updatedPermissions
    });
  };

  return (
    <PlatformAdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User-School Links</h1>
            <p className="text-muted-foreground">
              Manage user access and permissions for schools
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User-School Link
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Links</TabsTrigger>
              <TabsTrigger value="main-admin">Main Admins</TabsTrigger>
              <TabsTrigger value="secondary-admin">Secondary Admins</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Input 
                placeholder="Search user or school..." 
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value={activeTab} className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Admin Type</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserSchools.map((userSchool: UserSchool) => (
                    <TableRow key={userSchool.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{userSchool.userName}</p>
                          <p className="text-sm text-muted-foreground">{userSchool.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{userSchool.schoolName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {userSchool.role === 'admin' ? 'Administrator' : 
                          userSchool.role === 'content-manager' ? 'Content Manager' : 
                          userSchool.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userSchool.isMainAdmin ? (
                          <Badge variant="default">Main Admin</Badge>
                        ) : (
                          <Badge variant="secondary">Secondary Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userSchool.permissions.length > 2 ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {userSchool.permissions[0]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {userSchool.permissions[1]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                +{userSchool.permissions.length - 2} more
                              </Badge>
                            </>
                          ) : (
                            userSchool.permissions.map(permission => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewUserSchool(userSchool)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserSchool(userSchool)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedUserSchool(userSchool);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredUserSchools.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No user-school links found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* User-School Details Dialog */}
        {selectedUserSchool && (
          <Dialog 
            open={!!selectedUserSchool && !isEditDialogOpen && !isDeleteDialogOpen} 
            onOpenChange={(open) => !open && setSelectedUserSchool(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>User-School Link Details</DialogTitle>
                <DialogDescription>
                  Details about the user's access to this school
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        User
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{selectedUserSchool.userName}</p>
                        <p className="text-sm text-muted-foreground">{selectedUserSchool.userEmail}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <School className="h-4 w-4 mr-2" />
                        School
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{selectedUserSchool.schoolName}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Role</h3>
                    <Badge variant="outline">
                      {selectedUserSchool.role === 'admin' ? 'Administrator' : 
                      selectedUserSchool.role === 'content-manager' ? 'Content Manager' : 
                      selectedUserSchool.role}
                    </Badge>
                    
                    <h3 className="font-semibold mb-2 mt-4">Admin Type</h3>
                    {selectedUserSchool.isMainAdmin ? (
                      <Badge variant="default">Main Administrator</Badge>
                    ) : (
                      <Badge variant="secondary">Secondary Administrator</Badge>
                    )}
                    
                    <h3 className="font-semibold mb-2 mt-4">Link Created</h3>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedUserSchool.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Permissions</h3>
                    <div className="space-y-2">
                      {selectedUserSchool.permissions.length > 0 ? (
                        selectedUserSchool.permissions.map(permission => (
                          <div key={permission} className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm">
                              {availablePermissions.find(p => p.id === permission)?.label || permission}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No special permissions assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => handleEditUserSchool(selectedUserSchool)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button onClick={() => setSelectedUserSchool(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Create User-School Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add User-School Link</DialogTitle>
              <DialogDescription>
                Link a user to a school and set their permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">User</Label>
                  <Select 
                    value={newUserSchool.userId.toString()} 
                    onValueChange={(value) => setNewUserSchool({...newUserSchool, userId: value})}
                  >
                    <SelectTrigger id="user" className="mt-2">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: User) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="school">School</Label>
                  <Select 
                    value={newUserSchool.schoolId.toString()} 
                    onValueChange={(value) => setNewUserSchool({...newUserSchool, schoolId: value})}
                  >
                    <SelectTrigger id="school" className="mt-2">
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school: School) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newUserSchool.role} 
                    onValueChange={(value) => setNewUserSchool({...newUserSchool, role: value})}
                  >
                    <SelectTrigger id="role" className="mt-2">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="content-manager">Content Manager</SelectItem>
                      <SelectItem value="inquiry-manager">Inquiry Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox 
                    id="main-admin" 
                    checked={newUserSchool.isMainAdmin}
                    onCheckedChange={(checked) => 
                      setNewUserSchool({...newUserSchool, isMainAdmin: !!checked})
                    }
                  />
                  <Label htmlFor="main-admin">
                    Designate as main administrator for this school
                  </Label>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`permission-${permission.id}`} 
                        checked={newUserSchool.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => 
                          checked ? toggleNewPermission(permission.id) : toggleNewPermission(permission.id)
                        }
                      />
                      <Label htmlFor={`permission-${permission.id}`}>
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewUserSchool({
                    userId: '',
                    schoolId: '',
                    role: 'admin',
                    isMainAdmin: false,
                    permissions: []
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUserSchool}
                disabled={!newUserSchool.userId || !newUserSchool.schoolId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit User-School Dialog */}
        {editingUserSchool && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit User-School Link</DialogTitle>
                <DialogDescription>
                  Update the user's access to this school
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        User
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{editingUserSchool.userName}</p>
                        <p className="text-sm text-muted-foreground">{editingUserSchool.userEmail}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <School className="h-4 w-4 mr-2" />
                        School
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{editingUserSchool.schoolName}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-role">Role</Label>
                    <Select 
                      value={editingUserSchool.role} 
                      onValueChange={(value) => setEditingUserSchool({...editingUserSchool, role: value})}
                    >
                      <SelectTrigger id="edit-role" className="mt-2">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="content-manager">Content Manager</SelectItem>
                        <SelectItem value="inquiry-manager">Inquiry Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-8">
                    <Checkbox 
                      id="edit-main-admin" 
                      checked={editingUserSchool.isMainAdmin}
                      onCheckedChange={(checked) => 
                        setEditingUserSchool({...editingUserSchool, isMainAdmin: !!checked})
                      }
                    />
                    <Label htmlFor="edit-main-admin">
                      Designate as main administrator for this school
                    </Label>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-permission-${permission.id}`} 
                          checked={editingUserSchool.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => 
                            checked ? togglePermission(permission.id) : togglePermission(permission.id)
                          }
                        />
                        <Label htmlFor={`edit-permission-${permission.id}`}>
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingUserSchool(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateUserSchool}>
                  <Check className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Delete User-School Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User-School Link</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedUserSchool?.userName && selectedUserSchool?.schoolName ? (
                  <>
                    Are you sure you want to remove <strong>{selectedUserSchool.userName}</strong>'s 
                    access to <strong>{selectedUserSchool.schoolName}</strong>? 
                    This action cannot be undone.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete this user-school link?
                    This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedUserSchool && handleDeleteUserSchool(selectedUserSchool)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PlatformAdminLayout>
  );
}