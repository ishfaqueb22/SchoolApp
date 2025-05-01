import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, BuildingIcon, User2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("user");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  
  console.log("Login page mounted");

  // Immediate check on page load to redirect already logged-in users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User already authenticated with role:", user.role);
      redirectUserBasedOnRole(user.role);
      return; // Important - don't run any further code in this component
    }
  }, [isAuthenticated, user]);

  // Direct redirection function that properly handles redirections
  const redirectUserBasedOnRole = (role: string) => {
    console.log("Redirecting user with role:", role);
    
    // Use window.location.replace to fully replace the URL in the history
    // This prevents going back to the login page after successful login
    if (role === "platformAdmin") {
      console.log("Redirecting to platform admin dashboard");
      window.location.replace("/dashboard/platform-admin");
    } else if (role === "schoolAdmin" || role === "school") {
      console.log("Redirecting to school admin dashboard");
      window.location.replace("/admin");
    } else {
      console.log("Redirecting to user dashboard");
      window.location.replace("/dashboard");
    }
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Direct API call instead of using the auth context
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }
      
      const userData = await response.json();
      console.log("Login successful. User data:", userData);
      
      toast({
        title: "Login successful",
        description: "Welcome back to SmartSchool Finder!",
      });
      
      // Immediately redirect based on role
      console.log("Redirecting immediately after login");
      redirectUserBasedOnRole(userData.role);
      
    } catch (error) {
      console.error("Login failed:", error);
      
      if (error instanceof Error) {
        setLoginError(error.message || "Invalid username or password. Please try again.");
      } else {
        setLoginError("Invalid username or password. Please try again.");
      }
      
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
      
      setIsLoading(false);
    }
  };

  // Helper function to set appropriate values in form when demo account is selected
  const selectDemoAccount = (accountType: string) => {
    if (accountType === "user") {
      form.setValue("username", "user");
      form.setValue("password", "admin123");
    } else if (accountType === "schoolAdmin") {
      form.setValue("username", "schooladmin");
      form.setValue("password", "admin123");
    } else if (accountType === "platformAdmin") {
      form.setValue("username", "platformadmin");
      form.setValue("password", "admin123");
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | SmartSchool Finder</title>
        <meta name="description" content="Log in to your SmartSchool Finder account to access your saved schools, preferences, and more." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <svg className="h-10 w-10 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3Z" />
                </svg>
                <span className="ml-2 text-2xl font-bold text-primary-600">SmartSchool</span>
              </div>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Log in to your SmartSchool Finder account to access your personalized dashboard.
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Forgot your password?
                    </a>
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </div>

                <div className="text-center text-xs text-gray-500 mt-2">
                  Demo accounts: user/admin123, schooladmin/admin123, platformadmin/admin123
                </div>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <Button
                    variant="outline"
                    className="w-full inline-flex justify-center"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.4203 0 3.4703 2.625 1.3203 6.43998L5.1653 9.42998C6.3403 6.735 8.9903 4.75 12.0003 4.75Z" fill="#EA4335" />
                      <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.645 21.07C21.825 19 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                      <path d="M5.16501 14.56C4.92001 13.78 4.77501 12.95 4.77501 12C4.77501 11.05 4.92001 10.22 5.16501 9.44L1.32001 6.44998C0.485009 8.13 0.000488281 10.01 0.000488281 12C0.000488281 13.99 0.485009 15.87 1.32001 17.55L5.16501 14.56Z" fill="#FBBC05" />
                      <path d="M12.0004 24C15.2404 24 17.9654 22.935 19.6454 21.075L16.0804 18.105C15.0054 18.815 13.6204 19.235 12.0004 19.235C8.9904 19.235 6.3404 17.25 5.1654 14.555L1.3204 17.545C3.4704 21.36 7.4204 24 12.0004 24Z" fill="#34A853" />
                    </svg>
                    <span className="ml-2">Google</span>
                  </Button>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="w-full inline-flex justify-center"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" fill="#1877F2" />
                    </svg>
                    <span className="ml-2">Facebook</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
