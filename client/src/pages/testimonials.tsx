import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { BlogPost } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { format } from 'date-fns';

// Extended BlogPost with author information
interface BlogPostWithAuthor extends BlogPost {
  author?: {
    id: number;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  } | null;
}

function BlogsPage() {
  const { data: blogPosts, isLoading, error } = useQuery<BlogPostWithAuthor[]>({
    queryKey: ['/api/content/blog'],
  });

  // Format date helper
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Truncate text for excerpts
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Helmet>
        <title>Blog - SmartSchool Finder</title>
        <meta name="description" content="Discover educational insights and expert advice through our blog posts." />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Educational Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover insights from education experts, school administrators, and our team on various educational topics.
          </p>
        </section>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">There was an error loading blog posts. Please try again later.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {blogPosts?.length ? (
              blogPosts.map((post) => (
                <Card key={post.id} className="flex flex-col h-full overflow-hidden">
                  {post.featuredImage && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags && Array.isArray(post.tags) && post.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      
                      {post.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>By {post.author.fullName}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">
                      {post.excerpt ? truncateText(post.excerpt, 120) : truncateText(post.content, 120)}
                    </p>
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/blog/${post.slug}`}>
                        Read Full Article
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-xl text-muted-foreground mb-4">
                  No blog posts available yet. Check back soon for educational insights from our experts!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </>
  );
}

export default BlogsPage;