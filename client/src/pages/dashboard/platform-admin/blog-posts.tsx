import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlatformAdminLayout } from "@/components/layouts/platform-admin-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Pen, Trash, Plus, Image, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { executeSafeFocus, isFocusInProgress, observeAriaHiddenChanges } from "@/lib/focusManager";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
}

export default function BlogPostsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    categoryId: "",
    status: "draft",
    metaTitle: "",
    metaDescription: "",
  });
  const isFocusProcessingRef = useRef(false);

  // Fetch blog posts
  const { data: blogPosts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/platform-admin/content/blog"],
    queryFn: async () => {
      try {
        console.log("Fetching blog posts...");
        const response = await fetch("/api/platform-admin/content/blog");
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching blog posts: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
        }
        
        return response.json();
      } catch (err) {
        console.error("Error in blog posts query:", err);
        throw err;
      }
    },
  });

  // Fetch categories for blog posts
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/platform-admin/content/categories", "blog"],
    queryFn: async () => {
      try {
        console.log("Fetching categories...");
        const response = await fetch("/api/platform-admin/content/categories?type=blog");
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching categories: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        
        return response.json();
      } catch (err) {
        console.error("Error in categories query:", err);
        throw err;
      }
    },
  });

  // Create blog post mutation
  const createBlogPost = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating blog post with data:", data);
      return apiRequest("/api/platform-admin/content/blog", "POST", data);
    },
    onSuccess: (data) => {
      console.log("Blog post created successfully:", data);
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsCreateDialogOpen(false);
      resetForm();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Error creating blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  // Update blog post mutation
  const updateBlogPost = useMutation({
    mutationFn: async (data: { id: number; content: any }) => {
      console.log(`Updating blog post ${data.id} with data:`, data.content);
      return apiRequest(`/api/platform-admin/content/blog/${data.id}`, "PUT", data.content);
    },
    onSuccess: (data) => {
      console.log("Blog post updated successfully:", data);
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsEditDialogOpen(false);
      resetForm();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Error updating blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  // Delete blog post mutation
  const deleteBlogPost = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Deleting blog post ${id}`);
      return apiRequest(`/api/platform-admin/content/blog/${id}`, "DELETE");
    },
    onSuccess: (data) => {
      console.log("Blog post deleted successfully:", data);
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/blog"] });
      setIsDeleteDialogOpen(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting create form with data:", formData);
    
    const postData = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
    };
    
    createBlogPost.mutate(postData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting edit form with data:", formData);
    
    if (selectedPost) {
      const postData = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      };
      
      updateBlogPost.mutate({ id: selectedPost.id, content: postData });
    }
  };

  const confirmDelete = () => {
    if (selectedPost) {
      console.log("Confirming deletion of post:", selectedPost.id);
      deleteBlogPost.mutate(selectedPost.id);
    }
  };

  const openEditDialog = (post: BlogPost) => {
    if (isFocusInProgress()) return;
    
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      featuredImage: post.featuredImage || "",
      categoryId: post.categoryId ? post.categoryId.toString() : "",
      status: post.status,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
    });
    
    executeSafeFocus(() => {
      setIsEditDialogOpen(true);
    });
  };

  const openDeleteDialog = (post: BlogPost) => {
    if (isFocusInProgress()) return;
    
    setSelectedPost(post);
    
    executeSafeFocus(() => {
      setIsDeleteDialogOpen(true);
    });
  };

  const openViewDialog = (post: BlogPost) => {
    if (isFocusInProgress()) return;
    
    setSelectedPost(post);
    
    executeSafeFocus(() => {
      setIsViewDialogOpen(true);
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      categoryId: "",
      status: "draft",
      metaTitle: "",
      metaDescription: "",
    });
    setSelectedPost(null);
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

  const safelyCloseAllDialogs = () => {
    executeSafeFocus(() => {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setIsDeleteDialogOpen(false);
      setIsViewDialogOpen(false);
      
      setTimeout(() => {
        document.body.focus();
      }, 100);
    });
  };

  useEffect(() => {
    // Set up observer for aria-hidden attribute changes
    const cleanupObserver = observeAriaHiddenChanges((mutations) => {
      console.log("Detected aria-hidden changes:", mutations.length);
      
      // Check if any element with focus is inside an aria-hidden container
      const activeElement = document.activeElement;
      if (activeElement && activeElement instanceof HTMLElement) {
        for (const mutation of mutations) {
          const target = mutation.target as HTMLElement;
          const isHidden = target.getAttribute('aria-hidden') === 'true';
          
          if (isHidden && target.contains(activeElement)) {
            console.log("Focus is trapped in an aria-hidden element, moving focus to body");
            // Just blur the active element without trying to set focus elsewhere
            activeElement.blur();
            document.body.focus();
            break;
          }
        }
      }
    });
    
    return () => {
      // Clean up observer when component unmounts
      cleanupObserver();
    };
  }, []);

  useEffect(() => {
    // Setup global error handler
    const originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      // Log errors to console with additional context
      console.error('Caught global error:', { message, source, lineno, colno, error });
      
      // If it's a focus-related error, attempt to recover
      if (message && (message.toString().includes('Maximum call stack size exceeded') || 
          message.toString().includes('stack size'))) {
        console.warn('Detected focus-related error, attempting to recover...');
        
        // Force all dialogs to close safely
        safelyCloseAllDialogs();
        
        // Return true to indicate we've handled the error
        return true;
      }
      
      // Call the original handler if it exists
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
    
    return () => {
      // Restore original handler when component unmounts
      window.onerror = originalOnError;
    };
  }, []);

  return (
    <PlatformAdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            if (open === false) {
              executeSafeFocus(() => {
                setIsCreateDialogOpen(false);
                resetForm();
              });
            } else {
              setIsCreateDialogOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" /> Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create Blog Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
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
                    rows={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
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
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBlogPost.isPending}>
                    {createBlogPost.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center">Loading blog posts...</div>
        ) : error ? (
          <div className="text-center text-red-500">
            Error loading blog posts. Please try again.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No blog posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  blogPosts.map((post: BlogPost) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        {post.categoryId 
                          ? categories.find((c: Category) => c.id === post.categoryId)?.name || 'Unknown'
                          : 'None'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : post.status === 'draft' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(post.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {post.publishedAt 
                          ? format(new Date(post.publishedAt), "MMM d, yyyy")
                          : 'Not published'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(post)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(post)}
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(post)}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        if (open === false) {
          executeSafeFocus(() => {
            setIsViewDialogOpen(false);
          });
        } else {
          setIsViewDialogOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost?.featuredImage && (
            <div className="mb-4">
              <img 
                src={selectedPost.featuredImage} 
                alt={selectedPost.title} 
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          )}
          {selectedPost?.excerpt && (
            <div className="mb-4 italic text-gray-600 border-l-4 pl-4 border-gray-300">
              {selectedPost.excerpt}
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {selectedPost?.content}
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              Status: {selectedPost?.status}
            </div>
            <div>
              {selectedPost?.publishedAt 
                ? `Published: ${format(new Date(selectedPost.publishedAt), "MMM d, yyyy")}`
                : 'Not published'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (open === false) {
          executeSafeFocus(() => {
            setIsEditDialogOpen(false);
            resetForm();
          });
        } else {
          setIsEditDialogOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
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
                <Label htmlFor="edit-slug">Slug</Label>
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
                rows={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-excerpt">Excerpt</Label>
              <Textarea
                id="edit-excerpt"
                name="excerpt"
                value={formData.excerpt}
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
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-metaTitle">Meta Title</Label>
                <Input
                  id="edit-metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-metaDescription">Meta Description</Label>
                <Textarea
                  id="edit-metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateBlogPost.isPending}>
                {updateBlogPost.isPending ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (open === false) {
          executeSafeFocus(() => {
            setIsDeleteDialogOpen(false);
          });
        } else {
          setIsDeleteDialogOpen(true);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete the post "{selectedPost?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteBlogPost.isPending}
            >
              {deleteBlogPost.isPending ? "Deleting..." : "Delete Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PlatformAdminLayout>
  );
}