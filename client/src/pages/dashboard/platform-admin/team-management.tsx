import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TeamProfile } from '@shared/schema';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';

// Form schema for team profile
const teamProfileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  title: z.string().min(2, { message: "Position/Title is required." }),
  bio: z.string().optional(),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  socialLinks: z.object({
    linkedin: z.string().url({ message: "Please enter a valid LinkedIn URL." }).optional().or(z.literal('')),
    twitter: z.string().url({ message: "Please enter a valid Twitter URL." }).optional().or(z.literal('')),
    github: z.string().url({ message: "Please enter a valid GitHub URL." }).optional().or(z.literal('')),
    website: z.string().url({ message: "Please enter a valid website URL." }).optional().or(z.literal(''))
  }).optional(),
  priority: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true)
});

type TeamProfileFormValues = z.infer<typeof teamProfileFormSchema>;

const TeamManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<TeamProfile | null>(null);

  // Fetch team profiles
  const { data: teamProfiles, isLoading, error } = useQuery({
    queryKey: ['/api/platform-admin/team-profiles'],
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to fetch team profiles: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create form
  const createForm = useForm<TeamProfileFormValues>({
    resolver: zodResolver(teamProfileFormSchema),
    defaultValues: {
      name: '',
      title: '',
      bio: '',
      imageUrl: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        github: '',
        website: ''
      },
      priority: 0,
      isActive: true
    }
  });

  // Edit form
  const editForm = useForm<TeamProfileFormValues>({
    resolver: zodResolver(teamProfileFormSchema),
    defaultValues: {
      name: '',
      title: '',
      bio: '',
      imageUrl: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        github: '',
        website: ''
      },
      priority: 0,
      isActive: true
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: TeamProfileFormValues) => {
      const res = await apiRequest('POST', '/api/platform-admin/team-profiles', values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member profile created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/team-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-profiles'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create team profile: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: TeamProfileFormValues }) => {
      const res = await apiRequest('PUT', `/api/platform-admin/team-profiles/${id}`, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/team-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-profiles'] });
      setIsEditDialogOpen(false);
      setSelectedProfile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update team profile: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/platform-admin/team-profiles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member profile deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platform-admin/team-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-profiles'] });
      setIsDeleteDialogOpen(false);
      setSelectedProfile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete team profile: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Form submission handlers
  const onSubmit = (values: TeamProfileFormValues) => {
    createMutation.mutate(values);
  };

  const handleEdit = (profile: TeamProfile) => {
    setSelectedProfile(profile);
    editForm.reset({
      name: profile.name,
      title: profile.title,
      bio: profile.bio || "",
      imageUrl: profile.imageUrl || "",
      socialLinks: profile.socialLinks || {
        linkedin: "",
        twitter: "",
        github: "",
        website: ""
      },
      priority: profile.priority || 0,
      isActive: profile.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (values: TeamProfileFormValues) => {
    if (selectedProfile) {
      updateMutation.mutate({ id: selectedProfile.id, values });
    }
  };

  const handleDeleteClick = (profile: TeamProfile) => {
    setSelectedProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedProfile) {
      deleteMutation.mutate(selectedProfile.id);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              Error loading team profiles. Please try again later.
            </div>
          </div>
        </div>
      </PlatformAdminLayout>
    );
  }

  return (
    <PlatformAdminLayout>
      <Helmet>
        <title>Team Management | Platform Admin</title>
      </Helmet>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
            <p className="text-muted-foreground">
              Manage team members' profiles that appear on the website
            </p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </Button>
          
          <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-5">
                <SheetTitle>Add Team Member</SheetTitle>
                <SheetDescription>
                  Add a new team member to showcase on the website. Fill in the
                  details below.
                </SheetDescription>
              </SheetHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Chief Executive Officer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief biography or description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Provide a URL to the profile image (recommended size: 300x300px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Social Links</h4>
                    <div className="grid gap-2">
                      <FormField
                        control={createForm.control}
                        name="socialLinks.linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="socialLinks.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="socialLinks.github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="socialLinks.website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Priority</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Lower numbers appear first
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                          <div className="space-y-1">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>
                              Show this team member on the website
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
                  </div>
                  <SheetFooter className="mt-6">
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending || !createForm.formState.isValid}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Team Member"}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Edit Sheet */}
        <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-5">
              <SheetTitle>Edit Team Member</SheetTitle>
              <SheetDescription>
                Update team member details
              </SheetDescription>
            </SheetHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Chief Executive Officer" {...field} />
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
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief biography or description" 
                          className="min-h-[100px]"
                          {...field} 
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
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a URL to the profile image (recommended size: 300x300px)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Social Links</h4>
                  <div className="grid gap-2">
                    <FormField
                      control={editForm.control}
                      name="socialLinks.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="socialLinks.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="socialLinks.github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub</FormLabel>
                          <FormControl>
                            <Input placeholder="https://github.com/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="socialLinks.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Priority</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                        <div className="space-y-1">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>
                            Show this team member on the website
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
                </div>
                <SheetFooter className="mt-6">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button 
                    type="submit"
                    disabled={updateMutation.isPending || !editForm.formState.isValid}
                  >
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the 
                team member profile of {selectedProfile?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Team Members Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamProfiles && teamProfiles.length > 0 ? (
            teamProfiles.map((profile: TeamProfile) => (
              <Card key={profile.id} className={profile.isActive ? "" : "opacity-60"}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-14 w-14">
                    {profile.imageUrl ? (
                      <AvatarImage src={profile.imageUrl} alt={profile.name} />
                    ) : (
                      <AvatarFallback>{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{profile.name}</CardTitle>
                    <CardDescription>{profile.title}</CardDescription>
                    {!profile.isActive && (
                      <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {profile.bio}
                    </p>
                  )}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                    <div className="flex items-center gap-2 mt-4">
                      {profile.socialLinks.linkedin && (
                        <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <LinkedInIcon className="h-4 w-4" />
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <TwitterIcon className="h-4 w-4" />
                        </a>
                      )}
                      {profile.socialLinks.github && (
                        <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <GitHubIcon className="h-4 w-4" />
                        </a>
                      )}
                      {profile.socialLinks.website && (
                        <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <GlobeIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    Priority: {profile.priority || 0}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(profile)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteClick(profile)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No team members found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding your first team member to showcase on the website.
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex gap-2 items-center"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformAdminLayout>
  );
};

// Social Icons
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
    </svg>
  );
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
      <path d="M9 18c-4.51 2-5-2-7-2"></path>
    </svg>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      <path d="M2 12h20"></path>
    </svg>
  );
}

export default TeamManagement;