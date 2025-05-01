import React from 'react';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { insertSupportRequestSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Users, 
  Info, 
  ExternalLink, 
  Building, 
  BookOpen, 
  Award, 
  Star,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Extend the schema with validation rules
const contactFormSchema = insertSupportRequestSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
  category: z.enum(['general', 'technical', 'billing', 'feedback', 'partnership'], {
    required_error: "Please select a category.",
  }),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }),
  // Ensure phone is a string or undefined (not null)
  phone: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Team profiles will be fetched from the API

function AboutUsPage() {
  const { toast } = useToast();
  const [submittedAsTestimonial, setSubmittedAsTestimonial] = React.useState(false);
  
  // Query to fetch testimonials
  const { data: testimonials = [] } = useQuery({
    queryKey: ['/api/testimonials'],
    queryFn: async () => {
      const response = await fetch('/api/testimonials');
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      return response.json();
    }
  });
  
  // Query to fetch team profiles
  const { data: teamProfiles = [], isLoading: isLoadingTeamProfiles } = useQuery({
    queryKey: ['/api/team-profiles'],
    queryFn: async () => {
      const response = await fetch('/api/team-profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch team profiles');
      }
      return response.json();
    }
  });
  
  // Define the form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      phone: '',  // Phone is optional
      category: 'general',
      subject: '',
      status: 'pending',
      priority: 'normal',
    },
  });

  // Mutation for submitting the form
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      try {
        // First create the support request
        const supportResponse = await apiRequest(
          'POST',
          '/api/support',
          values
        );
        
        // If submitted as testimonial, also create a testimonial
        if (submittedAsTestimonial) {
          // Then create the testimonial
          await apiRequest(
            'POST',
            '/api/testimonials',
            {
              name: values.name,
              role: 'Platform User',
              content: values.message,
              rating: 5, // Default rating for testimonials from contact form
              isActive: false, // Set to false until approved by admin
            }
          );
        }
        
        return await supportResponse.json();
      } catch (error) {
        console.error("Error in contact form submission:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "Thank you for contacting us. We'll get back to you as soon as possible.",
      });
      
      // Reset the form and testimonial flag
      form.reset();
      setSubmittedAsTestimonial(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/support'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "There was an error submitting your request. Please try again later.",
        variant: "destructive",
      });
      console.error("Error submitting support request:", error);
    },
  });

  // Form submission handler
  function onSubmit(values: ContactFormValues) {
    mutate(values);
  }

  // Render social media icons
  const renderSocialIcons = (socialLinks: any) => (
    <div className="flex space-x-4 mt-2">
      {socialLinks?.linkedin && (
        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
          <Linkedin className="h-5 w-5" />
        </a>
      )}
      {socialLinks?.github && (
        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-black">
          <Github className="h-5 w-5" />
        </a>
      )}
      {socialLinks?.twitter && (
        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
          <Twitter className="h-5 w-5" />
        </a>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>About Us - SmartSchool Finder</title>
        <meta name="description" content="Learn about the SmartSchool Finder team, our mission, and how we're helping families find the perfect educational fit" />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-4">About SmartSchool Finder</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to transform how families discover, evaluate, and connect with the perfect educational opportunities for their children.
          </p>
        </section>
        
        {/* Our Mission */}
        <section className="mb-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                At SmartSchool Finder, we believe that finding the right educational environment should be simple, transparent, and personalized to each family's unique needs.
              </p>
              <p className="text-muted-foreground mb-4">
                Founded in 2023, our platform leverages advanced technology and educational expertise to connect parents with schools that align with their values, preferences, and their child's learning style.
              </p>
              <p className="text-muted-foreground">
                We're committed to improving educational access and helping every child find a learning environment where they can thrive.
              </p>
            </div>
            <div className="bg-primary-50 p-8 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="bg-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Building className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">500+</h3>
                  <p className="text-sm text-muted-foreground">Schools Listed</p>
                </div>
                <div className="text-center">
                  <div className="bg-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">10,000+</h3>
                  <p className="text-sm text-muted-foreground">Families Helped</p>
                </div>
                <div className="text-center">
                  <div className="bg-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">30+</h3>
                  <p className="text-sm text-muted-foreground">Curriculum Types</p>
                </div>
                <div className="text-center">
                  <div className="bg-white w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 shadow-sm">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">95%</h3>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Our Team */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our diverse team combines expertise in education, technology, and data science to create the most helpful school discovery platform available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoadingTeamProfiles ? (
              // Loading skeleton state
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="h-full flex flex-col">
                  <div className="aspect-square w-full bg-gray-200 animate-pulse"></div>
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex space-x-2">
                      <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : teamProfiles.length > 0 ? (
              // Show real team profiles from the database
              teamProfiles
                .filter((profile: any) => profile.isActive)
                .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
                .map((member: any) => (
                <Card key={member.id} className="h-full flex flex-col">
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={member.imageUrl || 'https://via.placeholder.com/300?text=Team+Member'} 
                      alt={member.name} 
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{member.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">
                      {member.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm">
                      {member.bio}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {renderSocialIcons(member.socialLinks)}
                  </CardFooter>
                </Card>
              ))
            ) : (
              // Fallback state if no team profiles found
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Our team information is currently being updated. Please check back soon!</p>
              </div>
            )}
          </div>
          
          {/* Join Our Team CTA */}
          <div className="mt-10 bg-accent p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Join Our Team</h3>
            <p className="text-muted-foreground mb-4">
              Passionate about education and technology? We're always looking for talented individuals to help us grow.
            </p>
            <Button variant="default">
              View Open Positions
            </Button>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">What People Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from parents, educators, and administrators who have experienced the benefits of SmartSchool Finder.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(testimonials.length > 0 ? testimonials.filter((t: any) => t.isActive) : [
              {
                id: 1,
                name: "Sarah Johnson",
                role: "Parent",
                content: "SmartSchool Finder helped us discover the perfect Montessori school for our daughter. The AI matching tool saved us hours of research!",
                rating: 5
              },
              {
                id: 2, 
                name: "Michael Lee",
                role: "School Administrator",
                content: "Since listing our school on SmartSchool Finder, we've seen a 40% increase in qualified inquiries from families who are truly aligned with our educational philosophy.",
                rating: 5
              },
              {
                id: 3,
                name: "Emily Rodriguez",
                role: "Education Consultant",
                content: "I recommend SmartSchool Finder to all my clients. The detailed school profiles and comparison tools make the decision process so much clearer for families.",
                rating: 5
              }
            ]).slice(0, 6).map((testimonial: any) => (
              <Card key={testimonial.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, index) => (
                      <Star 
                        key={index} 
                        className={`h-4 w-4 ${index < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm italic mb-4">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have questions or feedback? We're here to help! Fill out the form below and our team will get back to you shortly.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-primary" />
                    Email Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <a href="mailto:support@smartschoolfinder.com" className="text-primary hover:underline">
                      support@smartschoolfinder.com
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-primary" />
                    Call Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <a href="tel:+12345678901" className="text-primary hover:underline">
                      +1 (234) 567-8901
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <span className="text-primary">
                      Available 9 AM - 5 PM, Monday to Friday
                    </span>
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below to get in touch with our team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+1 (234) 567-8901" 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="billing">Billing Question</SelectItem>
                                <SelectItem value="feedback">Feedback</SelectItem>
                                <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the subject of your message" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Type your message here..." 
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="testimonial-consent"
                        checked={submittedAsTestimonial}
                        onCheckedChange={setSubmittedAsTestimonial}
                      />
                      <label
                        htmlFor="testimonial-consent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I'd like to share this as a testimonial
                      </label>
                    </div>
                    
                    <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
                      {isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}

export default AboutUsPage;