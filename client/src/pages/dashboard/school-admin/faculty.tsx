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
  GraduationCap,
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
  X
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Form schema for faculty member
const facultyFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  position: z.string().min(2, { message: "Position is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }).nullable().optional(),
  phone: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  qualifications: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  joinedDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

interface Faculty {
  id: number;
  name: string;
  position: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  qualifications: string | null;
  bio: string | null;
  imageUrl: string | null;
  joinedDate: string | null;
  isActive: boolean | null;
  createdAt: string;
}

const departments = [
  "Administration",
  "Science",
  "Mathematics",
  "English",
  "Urdu",
  "Social Studies",
  "Computer Science",
  "Islamic Studies",
  "Physical Education",
  "Arts & Music",
];

const SchoolAdminFaculty = () => {
  const { schoolId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  
  // Fetch faculty members for this school
  const { data: facultyMembers, isLoading } = useQuery<Faculty[]>({
    queryKey: ['/api/admin/schools', schoolId, 'faculty'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/faculty`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch faculty members');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Default form values
  const defaultValues: Partial<FacultyFormValues> = {
    name: "",
    position: "",
    email: "",
    phone: "",
    department: "",
    qualifications: "",
    bio: "",
    imageUrl: "",
    joinedDate: "",
    isActive: true,
  };
  
  // Form for adding new faculty
  const addForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues,
  });
  
  // Form for editing faculty
  const editForm = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues,
  });
  
  // Create faculty mutation
  const createFacultyMutation = useMutation({
    mutationFn: async (data: FacultyFormValues) => {
      const response = await apiRequest('POST', `/api/admin/schools/${schoolId}/faculty`, {
        ...data,
        schoolId: parseInt(schoolId as string),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'faculty'],
      });
      addForm.reset(defaultValues);
      setIsAddDialogOpen(false);
      toast({
        title: "Faculty member added",
        description: "The faculty member has been added successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to add faculty member:", error);
      toast({
        title: "Failed to add faculty member",
        description: "There was an error adding the faculty member. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update faculty mutation
  const updateFacultyMutation = useMutation({
    mutationFn: async (data: FacultyFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/admin/faculty/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'faculty'],
      });
      editForm.reset(defaultValues);
      setIsEditDialogOpen(false);
      setSelectedFaculty(null);
      toast({
        title: "Faculty member updated",
        description: "The faculty member has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update faculty member:", error);
      toast({
        title: "Failed to update faculty member",
        description: "There was an error updating the faculty member. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete faculty mutation
  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/faculty/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'faculty'],
      });
      setIsDeleteDialogOpen(false);
      setSelectedFaculty(null);
      toast({
        title: "Faculty member deleted",
        description: "The faculty member has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to delete faculty member:", error);
      toast({
        title: "Failed to delete faculty member",
        description: "There was an error deleting the faculty member. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const onAddSubmit = (data: FacultyFormValues) => {
    createFacultyMutation.mutate(data);
  };
  
  const onEditSubmit = (data: FacultyFormValues) => {
    if (!selectedFaculty) return;
    updateFacultyMutation.mutate({
      ...data,
      id: selectedFaculty.id,
    });
  };
  
  const handleEdit = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    editForm.reset({
      name: faculty.name,
      position: faculty.position,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      qualifications: faculty.qualifications,
      bio: faculty.bio,
      imageUrl: faculty.imageUrl,
      joinedDate: faculty.joinedDate,
      isActive: faculty.isActive === null ? true : faculty.isActive,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedFaculty) {
      deleteFacultyMutation.mutate(selectedFaculty.id);
    }
  };
  
  // Filter faculty based on search term and department
  const filteredFaculty = facultyMembers
    ? facultyMembers.filter((faculty) => {
        // Safely check faculty properties to prevent null/undefined errors
        const name = faculty?.name || '';
        const position = faculty?.position || '';
        const email = faculty?.email || '';
        const department = faculty?.department || '';
        
        const matchesSearch = 
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = !departmentFilter || department === departmentFilter;
        
        return matchesSearch && matchesDepartment;
      })
    : [];
  
  // Faculty data for demo purposes if API is not connected
  const demoFaculty: Faculty[] = [
    {
      id: 1,
      name: "Dr. Muhammad Ali",
      position: "Principal",
      department: "Administration",
      email: "mali@school.edu.pk",
      phone: "+92 333 1234567",
      qualifications: "PhD in Education, MBA",
      bio: "Dr. Ali has over 20 years of experience in education administration.",
      imageUrl: null,
      joinedDate: "2018-08-15",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Ayesha Ahmed",
      position: "Science Teacher",
      department: "Science",
      email: "aahmed@school.edu.pk",
      phone: "+92 333 7654321",
      qualifications: "MSc Physics, B.Ed",
      bio: "Ms. Ahmed specializes in teaching physics and chemistry to high school students.",
      imageUrl: null,
      joinedDate: "2020-01-10",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 3,
      name: "Tariq Mahmood",
      position: "Mathematics Coordinator",
      department: "Mathematics",
      email: "tmahmood@school.edu.pk",
      phone: "+92 333 9876543",
      qualifications: "MSc Mathematics, M.Ed",
      bio: "Mr. Mahmood has developed innovative teaching methods for mathematics.",
      imageUrl: null,
      joinedDate: "2019-03-22",
      isActive: true,
      createdAt: "2023-01-01T00:00:00Z",
    },
  ];
  
  // Always use API data, only show loading state while fetching
  const displayFaculty = isLoading ? [] : filteredFaculty;
  
  return (
    <>
      <Helmet>
        <title>Faculty Management | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Faculty Management</h2>
              <p className="text-muted-foreground">
                Manage your school's faculty members, teachers, and staff.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Add Faculty Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Add New Faculty Member</DialogTitle>
                  <DialogDescription>
                    Add details for a new teacher, administrator, or staff member.
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
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position/Title *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
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
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addForm.control}
                        name="joinedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Joined Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="qualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualifications</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography/Introduction</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              value={field.value || ''}
                              className="min-h-[100px]"
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
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>
                              Mark as active to display on the school profile
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
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFacultyMutation.isPending}>
                        {createFacultyMutation.isPending ? "Saving..." : "Save Faculty Member"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Faculty Directory</CardTitle>
              <CardDescription>
                All teachers, administrators, and staff members at your school.
              </CardDescription>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, position, or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[200px] justify-between">
                      {departmentFilter || "All Departments"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandEmpty>No department found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setDepartmentFilter(null)}
                          className="flex items-center"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              !departmentFilter ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          All Departments
                        </CommandItem>
                        {departments.map((dept) => (
                          <CommandItem
                            key={dept}
                            onSelect={() => setDepartmentFilter(dept)}
                            className="flex items-center"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                departmentFilter === dept ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {dept}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="hidden md:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading faculty members...
                        </TableCell>
                      </TableRow>
                    ) : displayFaculty.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No faculty members found. Add your first faculty member to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayFaculty.map((faculty) => (
                        <TableRow key={faculty.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={faculty.imageUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {faculty.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{faculty.name}</div>
                                <div className="text-sm text-muted-foreground md:hidden">
                                  {faculty.position}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="hidden md:block">{faculty.position}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {faculty.department || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {faculty.email || "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {faculty.joinedDate 
                              ? new Date(faculty.joinedDate).toLocaleDateString('en-PK')
                              : "-"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge
                              variant={faculty.isActive ? "default" : "secondary"}
                            >
                              {faculty.isActive ? "Active" : "Inactive"}
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
                                <DropdownMenuItem onClick={() => handleEdit(faculty)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(faculty)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
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
        </div>
      </SchoolAdminLayout>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>
              Update details for {selectedFaculty?.name}
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
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Title *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="joinedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joined Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography/Introduction</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ''}
                        className="min-h-[100px]"
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
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Mark as active to display on the school profile
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFacultyMutation.isPending}>
                  {updateFacultyMutation.isPending ? "Saving..." : "Update Faculty Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFaculty?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteFacultyMutation.isPending}
            >
              {deleteFacultyMutation.isPending ? "Deleting..." : "Delete Faculty Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchoolAdminFaculty;