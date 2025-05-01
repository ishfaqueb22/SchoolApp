import React, { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Compare from "@/pages/compare";
import SchoolDetails from "@/pages/school-details";
import Quiz from "@/pages/quiz";
import AIAssistantPage from "@/pages/ai-assistant";
import SmartSearch from "@/pages/smart-search";
import BlogPage from "@/pages/blogs";
import AboutUsPage from "@/pages/contact";
import Login from "@/pages/authentication/login";
import Signup from "@/pages/authentication/signup";
// Lazy-loading for the Submit Testimonial page to improve initial load performance
const SubmitTestimonial = React.lazy(() => import("@/pages/submit-testimonial"));
import Dashboard from "@/pages/dashboard";
import UserMyInquiries from "@/pages/dashboard/user/my-inquiries";
import SchoolAdminDashboard from "@/pages/dashboard/school-admin";
import SchoolAdminFaculty from "@/pages/dashboard/school-admin/faculty";
import SchoolAdminPosts from "@/pages/dashboard/school-admin/posts";
import SchoolAdminInquiries from "@/pages/dashboard/school-admin/inquiries";
import SchoolAdminSettings from "@/pages/dashboard/school-admin/settings";
import SchoolRegistration from "@/pages/dashboard/school-admin/school-registration";
import SchoolAdminDetails from "@/pages/dashboard/school-admin/school-details";
import SchoolAdminNotifications from "@/pages/dashboard/school-admin/notifications";
// SchoolSetup for compatibility with existing routes
const SchoolSetup = SchoolRegistration;
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Lazy load platform admin pages
import PlatformAdminDashboard from "@/pages/dashboard/platform-admin";
import PlatformAdminSchools from "@/pages/dashboard/platform-admin/schools";
import PlatformAdminUsers from "@/pages/dashboard/platform-admin/users";
import PlatformAdminReviews from "@/pages/dashboard/platform-admin/reviews";
import PlatformAdminQuiz from "@/pages/dashboard/platform-admin/quiz";
import PlatformAdminNotifications from "@/pages/dashboard/platform-admin/notifications";
import PlatformAdminCampusRequests from "@/pages/dashboard/platform-admin/campus-requests";
import PlatformAdminContent from "@/pages/dashboard/platform-admin/content";
import PlatformAdminContentPages from "@/pages/dashboard/platform-admin/content-pages";
import PlatformAdminBlogPosts from "@/pages/dashboard/platform-admin/content/blog";
import PlatformAdminFaqItems from "@/pages/dashboard/platform-admin/faq-items";
import PlatformAdminMessages from "@/pages/dashboard/platform-admin/messages";
import PlatformAdminAnalytics from "@/pages/dashboard/platform-admin/analytics";
import PlatformAdminSettings from "@/pages/dashboard/platform-admin/settings";
import PlatformAdminLogs from "@/pages/dashboard/platform-admin/logs";
import PlatformAdminSchoolApproval from "@/pages/dashboard/platform-admin/school-approval";
import TeamManagement from "@/pages/dashboard/platform-admin/team-management";


// ProtectedRoute component for regular users
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // When this component mounts, immediately check authentication
  useEffect(() => {
    // Wait for loading to complete before checking auth
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("ProtectedRoute - Not authenticated, redirecting to login");
        // Immediately replace the page content to prevent further React rendering
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><div class="loader"></div><p>Redirecting to login...</p></div></div>';
        // Force navigation without React
        setTimeout(() => window.location.href = "/login", 0);
      } else {
        console.log("ProtectedRoute - User authenticated:", user?.id, "with role:", user?.role);
      }
    }
  }, [isLoading, isAuthenticated, user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }
  
  return <Component />;
}

// ProtectedSchoolAdminRoute component for school admins
function ProtectedSchoolAdminRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // When this component mounts, immediately check authentication and role
  useEffect(() => {
    // Wait for loading to complete before checking auth
    if (!isLoading) {
      console.log("Protected school admin route check:", { isAuthenticated, userRole: user?.role });
      
      if (!isAuthenticated) {
        console.log("Access denied: Not authenticated, redirecting to login");
        // Immediately replace the page content to prevent further React rendering
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><div class="loader"></div><p>Redirecting to login...</p></div></div>';
        // Force navigation without React
        setTimeout(() => window.location.href = "/login", 0);
      } else if (user?.role !== 'schoolAdmin') {
        console.log("Access denied: Not a school admin");
        // Immediately replace the page content to prevent further React rendering
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><div class="loader"></div><p>Redirecting...</p></div></div>';
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'platformAdmin') {
          setTimeout(() => window.location.href = "/dashboard/platform-admin", 0);
        } else if (user?.role === 'user') {
          setTimeout(() => window.location.href = "/dashboard", 0);
        } else {
          setTimeout(() => window.location.href = "/", 0);
        }
      } else {
        console.log("School admin authenticated successfully");
      }
    }
  }, [isLoading, isAuthenticated, user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'schoolAdmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <p className="ml-2">Redirecting...</p>
      </div>
    );
  }
  
  return <Component />;
}

// ProtectedPlatformAdminRoute component for platform super admins
function ProtectedPlatformAdminRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // When this component mounts, immediately check authentication and role
  useEffect(() => {
    // Wait for loading to complete before checking auth
    if (!isLoading) {
      console.log("Protected platform admin route check:", { isAuthenticated, userRole: user?.role });
      
      if (!isAuthenticated) {
        console.log("Access denied: Not authenticated, redirecting to login");
        // Immediately replace the page content to prevent further React rendering
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><div class="loader"></div><p>Redirecting to login...</p></div></div>';
        // Force navigation without React
        setTimeout(() => window.location.href = "/login", 0);
      } else if (user?.role !== 'platformAdmin') {
        console.log("Access denied: Not a platform admin");
        // Immediately replace the page content to prevent further React rendering
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><div class="loader"></div><p>Redirecting...</p></div></div>';
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'schoolAdmin') {
          setTimeout(() => window.location.href = "/admin", 0);
        } else if (user?.role === 'user') {
          setTimeout(() => window.location.href = "/dashboard", 0);
        } else {
          setTimeout(() => window.location.href = "/", 0);
        }
      } else {
        console.log("Platform admin authenticated successfully");
      }
    }
  }, [isLoading, isAuthenticated, user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'platformAdmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
        <p className="ml-2">Redirecting...</p>
      </div>
    );
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/compare" component={Compare} />
      <Route path="/schools/:id" component={SchoolDetails} />
      <Route path="/category">
        {() => {
          // Use the new CategoryPage directly
          const CategoryPage = React.lazy(() => import("@/pages/CategoryPage"));
          return <CategoryPage />;
        }}
      </Route>
      <Route path="/quiz" component={Quiz} />
      <Route path="/ai-assistant" component={AIAssistantPage} />
      <Route path="/smart-suggestions">
        {() => <Redirect to="/smart-search" />}
      </Route>
      <Route path="/smart-search" component={SmartSearch} />
      <Route path="/blogs" component={BlogPage} />
      <Route path="/testimonials" component={BlogPage} />
      <Route path="/submit-testimonial">
        {() => <SubmitTestimonial />}
      </Route>
      <Route path="/contact" component={AboutUsPage} />
      <Route path="/about-us" component={AboutUsPage} />
      <Route path="/login" component={Login} />
      <Route path="/auth/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/auth/signup" component={Signup} />
      
      {/* Protected user routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/my-inquiries">
        <ProtectedRoute component={UserMyInquiries} />
      </Route>
      
      {/* Protected school admin routes */}
      <Route path="/admin">
        <ProtectedSchoolAdminRoute component={SchoolAdminDashboard} />
      </Route>
      <Route path="/admin/schools/:schoolId/faculty">
        <ProtectedSchoolAdminRoute component={SchoolAdminFaculty} />
      </Route>
      <Route path="/admin/schools/:schoolId/posts">
        <ProtectedSchoolAdminRoute component={SchoolAdminPosts} />
      </Route>
      <Route path="/admin/schools/:schoolId/inquiries">
        <ProtectedSchoolAdminRoute component={SchoolAdminInquiries} />
      </Route>
      <Route path="/admin/schools/:schoolId">
        <ProtectedSchoolAdminRoute component={SchoolAdminDetails} />
      </Route>
      <Route path="/admin/settings">
        <ProtectedSchoolAdminRoute component={SchoolAdminSettings} />
      </Route>
      <Route path="/admin/school-registration">
        <ProtectedSchoolAdminRoute component={SchoolRegistration} />
      </Route>
      <Route path="/admin/notifications">
        <ProtectedSchoolAdminRoute component={SchoolAdminNotifications} />
      </Route>
      
      {/* Protected platform admin routes */}
      <Route path="/dashboard/platform-admin">
        <ProtectedPlatformAdminRoute component={PlatformAdminDashboard} />
      </Route>
      <Route path="/dashboard/platform-admin/schools">
        <ProtectedPlatformAdminRoute component={PlatformAdminSchools} />
      </Route>
      <Route path="/dashboard/platform-admin/users">
        <ProtectedPlatformAdminRoute component={PlatformAdminUsers} />
      </Route>
      <Route path="/dashboard/platform-admin/reviews">
        <ProtectedPlatformAdminRoute component={PlatformAdminReviews} />
      </Route>
      <Route path="/dashboard/platform-admin/quiz">
        <ProtectedPlatformAdminRoute component={PlatformAdminQuiz} />
      </Route>
      <Route path="/dashboard/platform-admin/notifications">
        <ProtectedPlatformAdminRoute component={PlatformAdminNotifications} />
      </Route>
      <Route path="/dashboard/platform-admin/campus-requests">
        <ProtectedPlatformAdminRoute component={PlatformAdminCampusRequests} />
      </Route>
      <Route path="/dashboard/platform-admin/content">
        <ProtectedPlatformAdminRoute component={PlatformAdminContent} />
      </Route>
      <Route path="/dashboard/platform-admin/content/pages">
        <ProtectedPlatformAdminRoute component={PlatformAdminContentPages} />
      </Route>
      <Route path="/dashboard/platform-admin/content/blog">
        <ProtectedPlatformAdminRoute component={PlatformAdminBlogPosts} />
      </Route>
      <Route path="/dashboard/platform-admin/content/faq">
        <ProtectedPlatformAdminRoute component={PlatformAdminFaqItems} />
      </Route>
      <Route path="/dashboard/platform-admin/messages">
        <ProtectedPlatformAdminRoute component={PlatformAdminMessages} />
      </Route>
      <Route path="/dashboard/platform-admin/analytics">
        <ProtectedPlatformAdminRoute component={PlatformAdminAnalytics} />
      </Route>
      <Route path="/dashboard/platform-admin/settings">
        <ProtectedPlatformAdminRoute component={PlatformAdminSettings} />
      </Route>
      <Route path="/dashboard/platform-admin/logs">
        <ProtectedPlatformAdminRoute component={PlatformAdminLogs} />
      </Route>
      <Route path="/dashboard/platform-admin/school-approval">
        <ProtectedPlatformAdminRoute component={PlatformAdminSchoolApproval} />
      </Route>
      <Route path="/dashboard/platform-admin/team-management">
        <ProtectedPlatformAdminRoute component={TeamManagement} />
      </Route>
      
      {/* Add original paths for backward compatibility */}
      <Route path="/platform-admin">
        <ProtectedPlatformAdminRoute component={PlatformAdminDashboard} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        }>
          <Router />
        </React.Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
