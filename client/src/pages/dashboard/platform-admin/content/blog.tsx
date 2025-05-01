import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { PlatformAdminLayout } from "@/components/layouts/platform-admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Pen, 
  Trash, 
  Plus, 
  Eye, 
  Calendar, 
  Image, 
  Tag, 
  User, 
  FileText, 
  Clock, 
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookCheck,
  BookX
} from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  categoryId: number | null;
  isPublished: boolean;
  featuredImage: string | null;
  authorId: number | null;
  views: number;
  createdAt: string;
  updatedAt: string | null;
  publishedAt: string | null;
  author?: {
    id: number;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
}

interface User {
  id: number;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export default function PlatformAdminBlogPosts() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPublished, setFilterPublished] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    summary: "",
    featuredImage: "",
    categoryId: "",
    isPublished: false,
    authorId: "",
  });

  // Fetch blog posts
  const { 
    data: blogPosts = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["/api/platform-admin/content/blog"],
    queryFn: async () => {
      const response = await fetch("/api/platform-admin/content/blog");
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
      }
      return response.json();
    },
  });

  // Fetch categories for blog posts
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/platform-admin/content/categories", "blog"],
    queryFn: async () => {
      const response = await fetch("/api/platform-admin/content/categories?type=blog");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  // Fetch platform admins (to set as authors)
  const { data: adminUsers = [] } = useQuery({
    queryKey: ["/api/platform-admin/users", "platformAdmin"],
    queryFn: async () => {
      const response = await fetch("/api/platform-admin/users?role=platformAdmin");
      if (!response.ok) {
        throw new Error("Failed to fetch platform admins");
      }
      return response.json();
    },
  });

  // Create blog post mutation
  const createBlogPost = useMutation({
    mutationFn: (data: any) => apiRequest("/api/platform-admin/content/blog", "POST", data),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  // Update blog post mutation
  const updateBlogPost = useMutation({
    mutationFn: (data: { id: number; content: any }) => 
      apiRequest(`/api/platform-admin/content/blog/${data.id}`, "PUT", data.content),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update blog post",
        variant: "destructive",
      });
    },
  });
  
  // Toggle publish status mutation (separate from full update)
  const togglePublishStatus = useMutation({
    mutationFn: (data: { id: number; isPublished: boolean }) => 
      apiRequest(`/api/platform-admin/content/blog/${data.id}`, "PUT", { isPublished: data.isPublished }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update publish status",
        variant: "destructive",
      });
    },
  });

  // Delete blog post mutation
  const deleteBlogPost = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/platform-admin/content/blog/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  // Filter posts based on search and filter options
  const filteredPosts = React.useMemo(() => {
    return blogPosts.filter((post: BlogPost) => {
      // Apply search filter (title and content)
      const matchesSearch = searchQuery.trim() === "" || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply category filter
      const matchesCategory = filterCategory === "" || filterCategory === "all" || post.categoryId === parseInt(filterCategory);
      
      // Apply publish status filter
      const matchesPublished = filterPublished === "" || filterPublished === "all" || 
        (filterPublished === "published" && post.isPublished) ||
        (filterPublished === "draft" && !post.isPublished);
      
      return matchesSearch && matchesCategory && matchesPublished;
    });
  }, [blogPosts, searchQuery, filterCategory, filterPublished]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string IDs to numbers or null as needed
    const postData = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      authorId: formData.authorId && formData.authorId !== "none" && formData.authorId !== "no-authors" 
        ? parseInt(formData.authorId) 
        : null,
    };
    
    createBlogPost.mutate(postData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPost) {
      // Convert string IDs to numbers or null as needed
      const postData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        authorId: formData.authorId && formData.authorId !== "none" && formData.authorId !== "no-authors" 
          ? parseInt(formData.authorId) 
          : null,
      };
      
      updateBlogPost.mutate({ id: selectedPost.id, content: postData });
    }
  };

  const confirmDelete = () => {
    if (selectedPost) {
      deleteBlogPost.mutate(selectedPost.id);
    }
  };

  const openEditDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary || "",
      featuredImage: post.featuredImage || "",
      categoryId: post.categoryId ? post.categoryId.toString() : "",
      isPublished: post.isPublished,
      authorId: post.authorId ? post.authorId.toString() : "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      summary: "",
      featuredImage: "",
      categoryId: "",
      isPublished: false,
      authorId: "",
    });
    setSelectedPost(null);
    setActiveTab("editor");
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlugFromTitle(title),
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  // Handle publish/unpublish toggle directly from table row
  const handleTogglePublish = (post: BlogPost) => {
    const newStatus = !post.isPublished;
    togglePublishStatus.mutate({ 
      id: post.id, 
      isPublished: newStatus
    });
    
    toast({
      title: `Post ${newStatus ? 'Published' : 'Unpublished'}`,
      description: `"${post.title}" has been ${newStatus ? 'published' : 'unpublished'} successfully.`,
      variant: newStatus ? "default" : "secondary"
    });
  };

  const getAuthorName = (authorId: number | string | null) => {
    if (!authorId) return "Unknown";
    if (authorId === "none" || authorId === "no-authors") return "Unknown";
    
    // Parse to number if it's a string representation of a number
    const id = typeof authorId === 'string' ? parseInt(authorId) : authorId;
    
    // Check if parsing resulted in a valid number
    if (isNaN(id)) return "Unknown";
    
    const author = adminUsers.find((user: User) => user.id === id);
    return author ? author.fullName : "Unknown";
  };

  const getCategoryName = (categoryId: number | string | null) => {
    if (!categoryId || categoryId === "none") return "Uncategorized";
    
    // Parse to number if it's a string representation of a number
    const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
    
    // Check if parsing resulted in a valid number
    if (isNaN(id)) return "Uncategorized";
    
    const category = categories.find((cat: Category) => cat.id === id);
    return category ? category.name : "Unknown";
  };

  return (
    <>
      <Helmet>
        <title>Blog Management | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Blog Management</h1>
              <p className="text-gray-500">Create, edit and manage blog posts</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <Button onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Create New Post
              </Button>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new blog post. Preview tab will show you how it looks.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Content Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="space-y-4 mt-4">
                    <form id="createBlogForm" onSubmit={handleCreateSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="Enter blog post title"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug">Slug (URL)</Label>
                          <Input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            placeholder="url-friendly-title"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          placeholder="Enter blog post content (HTML allowed)"
                          rows={12}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea
                          id="summary"
                          name="summary"
                          value={formData.summary}
                          onChange={handleInputChange}
                          placeholder="Brief summary of the post"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="featuredImage">Featured Image URL</Label>
                          <Input
                            id="featuredImage"
                            name="featuredImage"
                            value={formData.featuredImage}
                            onChange={handleInputChange}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="categoryId">Category</Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value) => handleSelectChange("categoryId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Uncategorized</SelectItem>
                              {categories.map((category: Category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="authorId">Author</Label>
                          <Select
                            value={formData.authorId}
                            onValueChange={(value) => handleSelectChange("authorId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an author" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select Author</SelectItem>
                              {adminUsers && adminUsers.length > 0 ? (
                                adminUsers.map((user: User) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.fullName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-authors">No authors available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-start space-x-2 pt-8">
                          <Switch
                            id="isPublished"
                            checked={formData.isPublished}
                            onCheckedChange={(checked) => handleSwitchChange("isPublished", checked)}
                          />
                          <Label htmlFor="isPublished">Publish immediately</Label>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-4 mt-4">
                    <div className="border rounded-lg p-6">
                      {formData.featuredImage && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={formData.featuredImage} 
                            alt={formData.title} 
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                            }}
                          />
                        </div>
                      )}
                      
                      <h1 className="text-3xl font-bold mb-2">{formData.title || "Post Title"}</h1>
                      
                      <div className="flex items-center justify-start flex-wrap text-sm text-gray-500 mb-4 gap-4">
                        {formData.categoryId && (
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            <span>{getCategoryName(parseInt(formData.categoryId))}</span>
                          </div>
                        )}
                        
                        {formData.authorId && formData.authorId !== "none" && formData.authorId !== "no-authors" && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{getAuthorName(formData.authorId)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{format(new Date(), "MMM d, yyyy")}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Badge variant={formData.isPublished ? "success" : "secondary"}>
                            {formData.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                      
                      {formData.summary && (
                        <div className="bg-muted p-4 rounded-lg mb-6 italic">
                          {formData.summary}
                        </div>
                      )}
                      
                      <div 
                        className="prose max-w-none" 
                        dangerouslySetInnerHTML={{ __html: formData.content || "<p>Your content will appear here...</p>" }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    form="createBlogForm"
                    disabled={createBlogPost.isPending}
                  >
                    {createBlogPost.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filter and search controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search blog posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filterPublished}
                onValueChange={setFilterPublished}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => {
                setSearchQuery("");
                setFilterCategory("all");
                setFilterPublished("all");
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading blog posts...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading blog posts. Please try again.</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-12 w-12 mb-2 opacity-20" />
                          <p>No blog posts found</p>
                          {(searchQuery || filterCategory !== "all" || filterPublished !== "all") && (
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                          )}
                          <Button variant="outline" className="mt-4" onClick={() => {
                            setIsCreateDialogOpen(true);
                            resetForm();
                          }}>
                            Create your first post
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post: BlogPost) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          {post.categoryId 
                            ? getCategoryName(post.categoryId)
                            : "Uncategorized"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.isPublished ? "success" : "secondary"} 
                            className="px-2 py-0.5 text-xs">
                            {post.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.authorId 
                            ? getAuthorName(post.authorId)
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(post.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{post.views}</TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewDialog(post)}
                              title="View Post"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePublish(post)}
                              title={post.isPublished ? "Unpublish" : "Publish"}
                            >
                              {post.isPublished ? 
                                <BookX className="h-4 w-4 text-orange-500" /> : 
                                <BookCheck className="h-4 w-4 text-green-600" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(post)}
                              title="Edit Post"
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => openDeleteDialog(post)}
                              title="Delete Post"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* View Post Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost?.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPost?.isPublished ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
                
                {selectedPost?.categoryId && (
                  <Badge variant="outline">{getCategoryName(selectedPost.categoryId)}</Badge>
                )}
              </div>
            </DialogHeader>
            
            {selectedPost?.featuredImage && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={selectedPost.featuredImage} 
                  alt={selectedPost.title} 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                  }}
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Author: {selectedPost?.authorId ? getAuthorName(selectedPost.authorId) : "Unknown"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created: {selectedPost?.createdAt ? format(new Date(selectedPost.createdAt), "MMM d, yyyy") : ""}</span>
              </div>
              {selectedPost?.publishedAt && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Published: {format(new Date(selectedPost.publishedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>Views: {selectedPost?.views || 0}</span>
              </div>
            </div>
            
            {selectedPost?.summary && (
              <div className="bg-muted p-4 rounded-lg mb-6 italic">
                {selectedPost.summary}
              </div>
            )}
            
            <div 
              className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: selectedPost?.content || "" }}
            />
            
            <DialogFooter className="mt-6 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  if (selectedPost) {
                    openEditDialog(selectedPost);
                  }
                }}
              >
                <Pen className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
              {selectedPost?.isPublished && (
                <Button 
                  variant="default"
                  onClick={() => {
                    window.open(`/blog/${selectedPost.slug}`, '_blank');
                  }}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  View on Site
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
              <DialogDescription>
                Make changes to the blog post and save when you're done.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Content Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="space-y-4 mt-4">
                <form id="editBlogForm" onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        name="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-slug">Slug (URL)</Label>
                      <Input
                        id="edit-slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={12}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-summary">Summary</Label>
                    <Textarea
                      id="edit-summary"
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-featuredImage">Featured Image URL</Label>
                      <Input
                        id="edit-featuredImage"
                        name="featuredImage"
                        value={formData.featuredImage}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-categoryId">Category</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleSelectChange("categoryId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Uncategorized</SelectItem>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-authorId">Author</Label>
                      <Select
                        value={formData.authorId}
                        onValueChange={(value) => handleSelectChange("authorId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an author" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select Author</SelectItem>
                          {adminUsers && adminUsers.length > 0 ? (
                            adminUsers.map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-authors">No authors available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-start space-x-2 pt-8">
                      <Switch
                        id="edit-isPublished"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => handleSwitchChange("isPublished", checked)}
                      />
                      <Label htmlFor="edit-isPublished">
                        {formData.isPublished ? "Published" : "Draft"}
                      </Label>
                    </div>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4 mt-4">
                <div className="border rounded-lg p-6">
                  {formData.featuredImage && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={formData.featuredImage} 
                        alt={formData.title} 
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                  
                  <h1 className="text-3xl font-bold mb-2">{formData.title || "Post Title"}</h1>
                  
                  <div className="flex items-center justify-start flex-wrap text-sm text-gray-500 mb-4 gap-4">
                    {formData.categoryId && (
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        <span>{getCategoryName(parseInt(formData.categoryId))}</span>
                      </div>
                    )}
                    
                    {formData.authorId && formData.authorId !== "none" && formData.authorId !== "no-authors" && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{getAuthorName(formData.authorId)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{selectedPost?.createdAt ? format(new Date(selectedPost.createdAt), "MMM d, yyyy") : format(new Date(), "MMM d, yyyy")}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Badge variant={formData.isPublished ? "success" : "secondary"}>
                        {formData.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  
                  {formData.summary && (
                    <div className="bg-muted p-4 rounded-lg mb-6 italic">
                      {formData.summary}
                    </div>
                  )}
                  
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: formData.content || "<p>Your content will appear here...</p>" }}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="editBlogForm"
                disabled={updateBlogPost.isPending}
              >
                {updateBlogPost.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the blog post "{selectedPost?.title}". 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteBlogPost.isPending}
              >
                {deleteBlogPost.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PlatformAdminLayout>
    </>
  );
}