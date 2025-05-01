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
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  FileText, PlusCircle, Edit, Trash, Eye, Settings, ImageIcon, 
  GraduationCap, Award, Info, BookOpen, AlignLeft
} from 'lucide-react';
import { format } from 'date-fns';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('pages');
  
  // Mock data for development
  const contentData = {
    pages: [
      { id: 1, title: 'Home Page', slug: 'home', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 2, title: 'About Us', slug: 'about-us', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 3, title: 'FAQ', slug: 'faq', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 4, title: 'Privacy Policy', slug: 'privacy-policy', lastUpdated: new Date().toISOString(), status: 'Draft' },
    ],
    blogs: [
      { id: 1, title: 'Tips for Choosing the Right School', slug: 'choosing-right-school', category: 'Guides', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 2, title: 'Benefits of International Curricula', slug: 'international-curricula-benefits', category: 'Education', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 3, title: 'Preparing Your Child for School Admission', slug: 'school-admission-prep', category: 'Guides', lastUpdated: new Date().toISOString(), status: 'Draft' },
    ],
    faq: [
      { id: 1, question: 'How does SmartSchool Finder work?', category: 'General', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 2, question: 'How do I register my school?', category: 'Schools', lastUpdated: new Date().toISOString(), status: 'Published' },
      { id: 3, question: 'How can I compare different schools?', category: 'Features', lastUpdated: new Date().toISOString(), status: 'Published' },
    ],
    categories: [
      { id: 1, name: 'STEM Schools', count: 12 },
      { id: 2, name: 'International Schools', count: 8 },
      { id: 3, name: 'Montessori', count: 10 },
      { id: 4, name: 'Special Education', count: 5 },
      { id: 5, name: 'Arts Schools', count: 6 },
    ]
  };

  return (
    <>
      <Helmet>
        <title>Content Management | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
              <p className="text-muted-foreground">
                Manage website content, blog posts, and FAQs
              </p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pages">
                <FileText className="h-4 w-4 mr-2" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="blog">
                <BookOpen className="h-4 w-4 mr-2" />
                Blog Posts
              </TabsTrigger>
              <TabsTrigger value="faq">
                <Info className="h-4 w-4 mr-2" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="categories">
                <AlignLeft className="h-4 w-4 mr-2" />
                Categories
              </TabsTrigger>
            </TabsList>
            
            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">Static Pages</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage website pages and content
                  </p>
                </div>
                <Button className="mb-4" onClick={() => window.location.href = "/dashboard/platform-admin/content/pages"}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Pages
                </Button>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Website Pages</CardTitle>
                  <CardDescription>
                    Edit and update static pages of the website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentData.pages.map(page => (
                        <TableRow key={page.id}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell>{page.slug}</TableCell>
                          <TableCell>
                            <Badge variant={page.status === 'Published' ? 'default' : 'secondary'}>
                              {page.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(page.lastUpdated), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Blog Posts Tab */}
            <TabsContent value="blog" className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">Blog Posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage blog articles and educational content
                  </p>
                </div>
                <Button className="mb-4" onClick={() => window.location.href = "/dashboard/platform-admin/content/blog"}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Posts
                </Button>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Blog Articles</CardTitle>
                  <CardDescription>
                    Educational content and guides for users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentData.blogs.map(post => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>{post.category}</TableCell>
                          <TableCell>
                            <Badge variant={post.status === 'Published' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(post.lastUpdated), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* FAQs Tab */}
            <TabsContent value="faq" className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">Frequently Asked Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage FAQs to help users understand the platform
                  </p>
                </div>
                <Button className="mb-4" onClick={() => window.location.href = "/dashboard/platform-admin/content/faq"}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All FAQs
                </Button>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>FAQs</CardTitle>
                  <CardDescription>
                    Questions and answers about the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentData.faq.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.question}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'Published' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(item.lastUpdated), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">School Categories</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage school categories and types
                  </p>
                </div>
                <Button className="mb-4" onClick={() => window.location.href = "/dashboard/platform-admin/content/categories"}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Categories
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contentData.categories.map(category => (
                  <Card key={category.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription>
                        {category.count} schools
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between pt-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PlatformAdminLayout>
    </>
  );
};

export default ContentManagement;