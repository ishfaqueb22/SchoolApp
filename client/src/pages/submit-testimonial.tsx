import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, Link } from 'wouter';
import { z } from 'zod';
import { Helmet } from 'react-helmet';
import { insertTestimonialSchema, InsertTestimonial } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

// Extend the testimonial schema with additional validations
const testimonialFormSchema = insertTestimonialSchema.extend({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  content: z.string().min(10, { message: 'Testimonial must be at least 10 characters' }).max(500, { message: 'Testimonial cannot exceed 500 characters' }),
  rating: z.coerce.number().min(1, { message: 'Please select a rating' }).max(5),
  schoolId: z.coerce.number().optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }).optional(),
});

type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

function SubmitTestimonialPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get the list of schools for the dropdown
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['/api/schools'],
  });
  
  // Set up form with validation
  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: user?.name || '',
      role: '',
      content: '',
      rating: 5,
      schoolId: undefined,
      email: user?.email || '',
    },
  });
  
  // Set up mutation for submitting the testimonial
  const mutation = useMutation({
    mutationFn: (data: InsertTestimonial) => {
      return apiRequest('/api/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({
        title: 'Testimonial Submitted',
        description: 'Thank you for sharing your experience!',
      });
      navigate('/testimonials');
    },
    onError: (error) => {
      console.error('Error submitting testimonial:', error);
      toast({
        title: 'Error',
        description: 'There was an error submitting your testimonial. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: TestimonialFormValues) => {
    // Make sure we're only submitting if authenticated
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a testimonial.",
        variant: "destructive"
      });
      return;
    }
    
    const testimonialData: InsertTestimonial = {
      name: data.name,
      role: data.role,
      content: data.content,
      rating: data.rating,
      schoolId: data.schoolId,
      // Include the user ID who is making this testimonial
      userId: user.id
    };
    
    mutation.mutate(testimonialData);
  };
  
  // Component to render the star rating selector
  const StarRating = ({ rating, onChange }: { rating: number, onChange: (rating: number) => void }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="focus:outline-none"
          >
            <Star 
              className={`h-7 w-7 ${value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
            />
          </button>
        ))}
      </div>
    );
  };
  
  // Display a loading state during authentication check
  if (authLoading) {
    return (
      <>
        <Helmet>
          <title>Submit Testimonial - SmartSchool Finder</title>
        </Helmet>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Authentication Required - SmartSchool Finder</title>
        </Helmet>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                  <CardTitle>Authentication Required</CardTitle>
                </div>
                <CardDescription>
                  You need to be logged in to submit a testimonial
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-6">Please log in or create an account to share your experience with our platform.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild className="w-full sm:w-auto">
                    <Link to="/login">
                      Log In
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/signup">
                      Sign Up
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-8">
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground"
                    onClick={() => navigate('/testimonials')}
                  >
                    Back to Testimonials
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Submit Testimonial - SmartSchool Finder</title>
        <meta 
          name="description" 
          content="Share your experience with SmartSchool Finder and help others make informed decisions about education"
        />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <section className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Share Your Experience</h1>
            <p className="text-xl text-muted-foreground">
              Your feedback helps others make informed decisions about their educational journey.
            </p>
          </section>
          
          <Card>
            <CardHeader>
              <CardTitle>Submit a Testimonial</CardTitle>
              <CardDescription>
                Please fill out the form below to share your experience with our platform or a specific school.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          We'll never share your email. This is only used to contact you if needed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="School Administrator">School Administrator</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a school (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingSchools ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              schools?.map((school: any) => (
                                <SelectItem key={school.id} value={school.id.toString()}>
                                  {school.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          If your testimonial is about a specific school, please select it.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <StarRating 
                            rating={field.value} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Testimonial</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your experience..."
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Tell us about your experience with the platform or specific school.
                          <span className="text-sm float-right">
                            {field.value.length}/500
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => navigate('/testimonials')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : 'Submit Testimonial'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
}

export default SubmitTestimonialPage;