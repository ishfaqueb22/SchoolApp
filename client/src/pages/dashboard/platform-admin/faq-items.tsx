import { useState } from "react";
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
import { Pen, Trash, Plus, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function FaqItemsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    order: 0,
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch FAQ items
  const { data: faqItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/platform-admin/content/faqs", categoryFilter],
    queryFn: async () => {
      const url = categoryFilter 
        ? `/api/platform-admin/content/faqs?category=${categoryFilter}`
        : "/api/platform-admin/content/faqs";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch FAQ items");
      }
      return response.json();
    },
  });

  // Create FAQ item mutation
  const createFaqItem = useMutation({
    mutationFn: (data: any) => apiRequest("/api/platform-admin/content/faqs", "POST", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "FAQ item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/faqs"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create FAQ item",
        variant: "destructive",
      });
    },
  });

  // Update FAQ item mutation
  const updateFaqItem = useMutation({
    mutationFn: (data: { id: number; content: any }) => 
      apiRequest(`/api/platform-admin/content/faqs/${data.id}`, "PUT", data.content),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "FAQ item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/faqs"] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update FAQ item",
        variant: "destructive",
      });
    },
  });

  // Delete FAQ item mutation
  const deleteFaqItem = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/platform-admin/content/faqs/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "FAQ item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/content/faqs"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete FAQ item",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFaqItem.mutate({
      ...formData,
      order: parseInt(formData.order.toString()),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFaq) {
      updateFaqItem.mutate({ 
        id: selectedFaq.id, 
        content: {
          ...formData,
          order: parseInt(formData.order.toString()),
        } 
      });
    }
  };

  const confirmDelete = () => {
    if (selectedFaq) {
      deleteFaqItem.mutate(selectedFaq.id);
    }
  };

  const openEditDialog = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      order: faqItems.length > 0 ? Math.max(...faqItems.map((f: FaqItem) => f.order)) + 1 : 1,
    });
    setSelectedFaq(null);
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

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    });
  };

  const filterCategories = () => {
    const categories = new Set<string>();
    faqItems.forEach((faq: FaqItem) => {
      if (faq.category) {
        categories.add(faq.category);
      }
    });
    return Array.from(categories).sort();
  };

  return (
    <PlatformAdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <div className="flex gap-4">
            <Select
              value={categoryFilter || "all"}
              onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" /> Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create FAQ Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Input
                      id="question"
                      name="question"
                      value={formData.question}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      rows={5}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="admission">Admission</SelectItem>
                          <SelectItem value="schools">Schools</SelectItem>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="parents">For Parents</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        name="order"
                        type="number"
                        value={formData.order}
                        onChange={handleInputChange}
                        required
                        min={1}
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
                    <Button type="submit" disabled={createFaqItem.isPending}>
                      {createFaqItem.isPending ? "Creating..." : "Create FAQ"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center">Loading FAQ items...</div>
        ) : error ? (
          <div className="text-center text-red-500">
            Error loading FAQ items. Please try again.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Order</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[120px]">Last Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No FAQ items found
                    </TableCell>
                  </TableRow>
                ) : (
                  faqItems
                    .sort((a: FaqItem, b: FaqItem) => a.order - b.order)
                    .map((faq: FaqItem) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium text-center">{faq.order}</TableCell>
                        <TableCell>{faq.question}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {faq.category}
                          </span>
                        </TableCell>
                        <TableCell>{format(new Date(faq.updatedAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(faq)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit FAQ Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-question">Question</Label>
              <Input
                id="edit-question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea
                id="edit-answer"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="admission">Admission</SelectItem>
                    <SelectItem value="schools">Schools</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="parents">For Parents</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleInputChange}
                  required
                  min={1}
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
              <Button type="submit" disabled={updateFaqItem.isPending}>
                {updateFaqItem.isPending ? "Updating..." : "Update FAQ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ Item</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this FAQ: "{selectedFaq?.question}"? This action cannot be undone.
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
              disabled={deleteFaqItem.isPending}
            >
              {deleteFaqItem.isPending ? "Deleting..." : "Delete FAQ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PlatformAdminLayout>
  );
}