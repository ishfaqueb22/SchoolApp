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
import { Building, MapPin, CalendarDays, Phone, Mail, Link2, PlusCircle, Unlink, Eye } from 'lucide-react';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';

interface School {
  id: number;
  name: string;
  location: string;
  type: string;
  parentSchoolId: number | null;
  isSubCampus: boolean;
  createdAt: string;
  updatedAt: string;
  approvalStatus: string;
}

export default function CampusManagementPage() {
  // Mock data until we integrate with the API
  const [schools, setSchools] = useState<School[]>([
    {
      id: 1,
      name: "Springfield Academy",
      location: "Springfield, IL",
      type: "Private",
      parentSchoolId: null,
      isSubCampus: false,
      createdAt: "2025-01-15T14:30:00",
      updatedAt: "2025-01-15T14:30:00",
      approvalStatus: "approved"
    },
    {
      id: 2,
      name: "Springfield Academy - North Campus",
      location: "North Springfield, IL",
      type: "Private",
      parentSchoolId: 1,
      isSubCampus: true,
      createdAt: "2025-02-10T09:45:00",
      updatedAt: "2025-02-10T09:45:00",
      approvalStatus: "approved"
    },
    {
      id: 3,
      name: "Springfield Academy - Downtown",
      location: "Downtown Springfield, IL",
      type: "Private",
      parentSchoolId: 1,
      isSubCampus: true,
      createdAt: "2025-02-20T11:15:00",
      updatedAt: "2025-02-20T11:15:00",
      approvalStatus: "approved"
    },
    {
      id: 4,
      name: "Riverside College",
      location: "Riverside, CA",
      type: "College",
      parentSchoolId: null,
      isSubCampus: false,
      createdAt: "2025-03-05T10:00:00",
      updatedAt: "2025-03-05T10:00:00",
      approvalStatus: "approved"
    },
    {
      id: 5,
      name: "Lincoln Elementary",
      location: "Lincoln, NE",
      type: "Public",
      parentSchoolId: null,
      isSubCampus: false,
      createdAt: "2025-03-12T13:20:00",
      updatedAt: "2025-03-12T13:20:00",
      approvalStatus: "approved"
    },
    {
      id: 6,
      name: "Lincoln Elementary - West Wing",
      location: "West Lincoln, NE",
      type: "Public",
      parentSchoolId: 5,
      isSubCampus: true,
      createdAt: "2025-03-15T09:30:00",
      updatedAt: "2025-03-15T09:30:00",
      approvalStatus: "approved"
    },
    {
      id: 7,
      name: "Bay Area Academy",
      location: "San Francisco, CA",
      type: "Private",
      parentSchoolId: null,
      isSubCampus: false,
      createdAt: "2025-04-01T11:45:00",
      updatedAt: "2025-04-01T11:45:00",
      approvalStatus: "pending"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Filter schools based on search query and active tab
  const filteredSchools = schools.filter((school: School) => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'main') return !school.isSubCampus && matchesSearch;
    if (activeTab === 'campus') return school.isSubCampus && matchesSearch;
    
    return matchesSearch;
  });

  // Get parent school for a campus
  const getParentSchool = (parentId: number | null) => {
    if (!parentId) return null;
    return schools.find((school: School) => school.id === parentId);
  };

  // Get subcampuses for a school
  const getSubCampuses = (schoolId: number) => {
    return schools.filter((school: School) => school.parentSchoolId === schoolId);
  };

  // Event handlers
  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
  };

  const handleLinkSchool = (school: School) => {
    if (selectedParent === null) return;
    
    // Update the school to link it as a subcampus
    const updatedSchools = schools.map(s => 
      s.id === school.id ? 
      { ...s, parentSchoolId: selectedParent, isSubCampus: true, updatedAt: new Date().toISOString() } : 
      s
    );
    
    setSchools(updatedSchools);
    setSelectedSchool(null);
    setSelectedParent(null);
    setIsLinkDialogOpen(false);
  };

  const handleUnlinkSchool = (school: School) => {
    // Update the school to unlink it (make it a main school)
    const updatedSchools = schools.map(s => 
      s.id === school.id ? 
      { ...s, parentSchoolId: null, isSubCampus: false, updatedAt: new Date().toISOString() } : 
      s
    );
    
    setSchools(updatedSchools);
    setSelectedSchool(null);
    setIsUnlinkDialogOpen(false);
  };

  return (
    <PlatformAdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campus Management</h1>
            <p className="text-muted-foreground">
              Manage school-campus relationships and hierarchies
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Schools</TabsTrigger>
              <TabsTrigger value="main">Main Schools</TabsTrigger>
              <TabsTrigger value="campus">Subcampuses</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Input 
                placeholder="Search schools..." 
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
                    <TableHead>School Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school: School) => {
                    const parentSchool = getParentSchool(school.parentSchoolId);
                    const subCampuses = getSubCampuses(school.id);
                    
                    return (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.type}</TableCell>
                        <TableCell>{school.location}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              school.approvalStatus === 'approved' ? 'success' : 
                              school.approvalStatus === 'rejected' ? 'destructive' : 
                              'outline'
                            }
                          >
                            {school.approvalStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {school.isSubCampus ? (
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">Subcampus</Badge>
                              {parentSchool && (
                                <span className="text-xs text-muted-foreground">
                                  of {parentSchool.name}
                                </span>
                              )}
                            </div>
                          ) : subCampuses.length > 0 ? (
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">Main School</Badge>
                              <span className="text-xs text-muted-foreground">
                                with {subCampuses.length} subcampus{subCampuses.length !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline">Main School</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewSchool(school)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {school.isSubCampus ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSchool(school);
                                setIsUnlinkDialogOpen(true);
                              }}
                            >
                              <Unlink className="h-4 w-4 mr-1" />
                              Unlink
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSchool(school);
                                setIsLinkDialogOpen(true);
                              }}
                              disabled={school.approvalStatus !== 'approved'}
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              Link as Subcampus
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {filteredSchools.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No schools found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* School Details Dialog */}
        {selectedSchool && (
          <Dialog open={!!selectedSchool && !isLinkDialogOpen && !isUnlinkDialogOpen} onOpenChange={(open) => !open && setSelectedSchool(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedSchool.name}</DialogTitle>
                <DialogDescription>
                  {selectedSchool.isSubCampus ? 'Subcampus Information' : 'School Information'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedSchool.name}</h3>
                  <Badge 
                    variant={
                      selectedSchool.approvalStatus === 'approved' ? 'success' : 
                      selectedSchool.approvalStatus === 'rejected' ? 'destructive' : 
                      'outline'
                    }
                  >
                    {selectedSchool.approvalStatus}
                  </Badge>
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
                  <div>
                    <p className="text-sm font-semibold">Created:</p>
                    <p className="text-sm">{new Date(selectedSchool.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Last Updated:</p>
                    <p className="text-sm">{new Date(selectedSchool.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedSchool.isSubCampus && selectedSchool.parentSchoolId && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2">Parent School</h4>
                    {(() => {
                      const parent = getParentSchool(selectedSchool.parentSchoolId);
                      return parent ? (
                        <div>
                          <p className="text-sm font-semibold">{parent.name}</p>
                          <p className="text-sm text-muted-foreground">{parent.location}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Parent school information not available</p>
                      );
                    })()}
                  </div>
                )}
                
                {!selectedSchool.isSubCampus && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2">Subcampuses</h4>
                    {(() => {
                      const subcampuses = getSubCampuses(selectedSchool.id);
                      return subcampuses.length > 0 ? (
                        <div className="space-y-2">
                          {subcampuses.map((campus: School) => (
                            <div key={campus.id} className="text-sm">
                              <p className="font-semibold">{campus.name}</p>
                              <p className="text-muted-foreground">{campus.location}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No subcampuses linked to this school</p>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {selectedSchool.isSubCampus ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsUnlinkDialogOpen(true);
                    }}
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Unlink from Parent
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsLinkDialogOpen(true);
                    }}
                    disabled={selectedSchool.approvalStatus !== 'approved'}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Link as Subcampus
                  </Button>
                )}
                <Button onClick={() => setSelectedSchool(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Link School Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link as Subcampus</DialogTitle>
              <DialogDescription>
                Select a main school to link {selectedSchool?.name} as a subcampus
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label htmlFor="parent-school">Parent School</Label>
              <Select 
                value={selectedParent?.toString() || ''} 
                onValueChange={(value) => setSelectedParent(parseInt(value))}
              >
                <SelectTrigger id="parent-school" className="mt-2">
                  <SelectValue placeholder="Select a parent school" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter((school: School) => 
                      !school.isSubCampus && 
                      school.id !== selectedSchool?.id &&
                      school.approvalStatus === 'approved'
                    )
                    .map((school: School) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsLinkDialogOpen(false);
                  setSelectedParent(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => selectedSchool && handleLinkSchool(selectedSchool)}
                disabled={selectedParent === null}
              >
                Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Unlink School Dialog */}
        <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Subcampus</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlink {selectedSchool?.name} from its parent school? 
                This will convert it to a standalone main school.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsUnlinkDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedSchool && handleUnlinkSchool(selectedSchool)}>
                Unlink
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PlatformAdminLayout>
  );
}