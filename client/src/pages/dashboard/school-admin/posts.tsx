import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import {
  Calendar,
  Edit,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
  X,
  Image,
  Link as LinkIcon,
  MessagesSquare,
  AlertCircle,
  CalendarDays,
  PenSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SchoolAdminLayout } from '@/components/layouts/school-admin-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Form schema for school post
const postFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  type: z.string().min(1, { message: "Post type is required." }),
  campusId: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  eventDate: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface SchoolPost {
  id: number;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  eventDate: string | null;
  postedBy: number | null;
  isPublished: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  schoolId: number;
  campusId: number | null;
}

const postTypes = [
  "announcement",
  "event",
  "news",
  "update",
  "featured"
];

const SchoolAdminPosts = () => {
  const { schoolId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SchoolPost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  // Fetch posts for this school
  const { data: posts, isLoading, refetch } = useQuery<SchoolPost[]>({
    queryKey: ['/api/admin/schools', schoolId, 'posts'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/posts`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch school posts');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Refetch posts on mount to ensure we have the latest data
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch campuses for this school
  const { data: campuses, isLoading: isLoadingCampuses } = useQuery({
    queryKey: ['/api/admin/schools', schoolId, 'campuses'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/schools/${schoolId}/campuses`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch school campuses');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Default form values
  const defaultValues: Partial<PostFormValues> = {
    title: "",
    content: "",
    type: "announcement",
    imageUrl: "",
    eventDate: "",
    isPublished: true,
    campusId: null,
  };
  
  // Form for adding new post
  const addForm = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues,
  });
  
  // Form for editing post
  const editForm = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues,
  });
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      const response = await apiRequest('POST', `/api/admin/schools/${schoolId}/posts`, {
        ...data,
        schoolId: parseInt(schoolId as string),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'posts'],
      });
      addForm.reset(defaultValues);
      setIsAddDialogOpen(false);
      toast({
        title: "Post created",
        description: "The post has been created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to create post:", error);
      toast({
        title: "Failed to create post",
        description: "There was an error creating the post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (data: PostFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PUT', `/api/admin/posts/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'posts'],
      });
      editForm.reset(defaultValues);
      setIsEditDialogOpen(false);
      setSelectedPost(null);
      toast({
        title: "Post updated",
        description: "The post has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update post:", error);
      toast({
        title: "Failed to update post",
        description: "There was an error updating the post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/posts/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/admin/schools', schoolId, 'posts'],
      });
      setIsDeleteDialogOpen(false);
      setSelectedPost(null);
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to delete post:", error);
      toast({
        title: "Failed to delete post",
        description: "There was an error deleting the post. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const onAddSubmit = (data: PostFormValues) => {
    createPostMutation.mutate(data);
  };
  
  const onEditSubmit = (data: PostFormValues) => {
    if (!selectedPost) return;
    updatePostMutation.mutate({
      ...data,
      id: selectedPost.id,
    });
  };
  
  const handleEdit = (post: SchoolPost) => {
    setSelectedPost(post);
    editForm.reset({
      title: post.title,
      content: post.content,
      type: post.type,
      imageUrl: post.imageUrl,
      campusId: post.campusId,
      eventDate: post.eventDate ? new Date(post.eventDate).toISOString().split('T')[0] : null,
      isPublished: post.isPublished === null ? true : post.isPublished,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (post: SchoolPost) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
    }
  };
  
  // Filter posts based on search term and type
  const filteredPosts = posts
    ? posts.filter((post) => {
        // Safely check post title and content to prevent null/undefined errors
        const postTitle = post?.title || '';
        const postContent = post?.content || '';
        
        const matchesSearch = 
          postTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          postContent.toLowerCase().includes(searchTerm.toLowerCase());
        
        const postType = post?.type || '';
        const matchesType = !typeFilter || typeFilter === 'all' || postType === typeFilter;
        
        return matchesSearch && matchesType;
      })
    : [];
  
  // Get proper icon for post type
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <AlertCircle className="h-4 w-4" />;
      case 'event':
        return <CalendarDays className="h-4 w-4" />;
      case 'news':
        return <FileText className="h-4 w-4" />;
      case 'update':
        return <PenSquare className="h-4 w-4" />;
      case 'featured':
        return <MessagesSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Get proper badge color for post type
  const getPostTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'news':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-orange-100 text-orange-800';
      case 'featured':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date with relative time
  const formatPostDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Content Management | SmartSchool Finder</title>
      </Helmet>
      <SchoolAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
              <p className="text-muted-foreground">
                Create and manage school announcements, events, and news posts.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Add a new announcement, event, or news post for your school.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Title *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select post type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {postTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Date (if applicable)</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormDescription>
                              Required for event posts
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="min-h-[120px]" 
                              placeholder="Enter post content here..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="campusId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select campus (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">All Campuses</SelectItem>
                              {campuses && campuses.map((campus: any) => (
                                <SelectItem key={campus.id} value={campus.id.toString()}>
                                  {campus.name} {campus.isMainCampus && "(Main)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select a specific campus or leave blank for all campuses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Add an optional image URL for your post
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Publish Post</FormLabel>
                            <FormDescription>
                              Published posts are visible on your school's public profile
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
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPostMutation.isPending}>
                        {createPostMutation.isPending ? "Creating..." : "Create Post"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filter controls */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={typeFilter || ""}
              onValueChange={(value) => setTypeFilter(value || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {postTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Post cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Loading skeletons
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="opacity-70">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-16 w-full bg-muted rounded animate-pulse"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                  </CardFooter>
                </Card>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium">No posts found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm || typeFilter
                    ? "Try changing your search or filter criteria"
                    : "Create your first post to share news and updates"}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Create a Post
                </Button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className={!post.isPublished ? "opacity-70" : undefined}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className={`${getPostTypeBadgeClass(post.type)} mb-2`}>
                        <span className="flex items-center">
                          {getPostTypeIcon(post.type)}
                          <span className="ml-1 capitalize">{post.type}</span>
                        </span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(post)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(post)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{post.title}</CardTitle>
                    <CardDescription>
                      {post.eventDate && (
                        <span className="flex items-center text-sm font-medium text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {format(new Date(post.eventDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3">
                      {post.content}
                    </p>
                    {post.imageUrl && (
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Image className="h-3 w-3 mr-1" />
                        Image attached
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 justify-between text-xs text-muted-foreground border-t">
                    <span>{formatPostDate(post.createdAt)}</span>
                    {!post.isPublished && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        Draft
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Edit post dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>
                  Update the details of this post.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Title *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select post type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {postTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
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
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date (if applicable)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Required for event posts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[120px]" 
                            placeholder="Enter post content here..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="campusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campus</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campus (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Campuses</SelectItem>
                            {campuses && campuses.map((campus: any) => (
                              <SelectItem key={campus.id} value={campus.id.toString()}>
                                {campus.name} {campus.isMainCampus && "(Main)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a specific campus or leave blank for all campuses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={editForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Add an optional image URL for your post
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Publish Post</FormLabel>
                          <FormDescription>
                            Published posts are visible on your school's public profile
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updatePostMutation.isPending}>
                      {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete confirmation dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Post</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this post? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 rounded-md border p-4">
                <p className="font-medium">{selectedPost?.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {selectedPost?.content}
                </p>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deletePostMutation.isPending}
                >
                  {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SchoolAdminLayout>
    </>
  );
};

export default SchoolAdminPosts;