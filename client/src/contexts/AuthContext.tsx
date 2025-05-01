import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  register: (userData: RegisterData) => Promise<User>;
}

// Type for registration data
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: string;
}

// Create a default context value with empty implementations
const defaultContextValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {
    throw new Error("AuthContext not initialized");
  },
  refreshUser: async () => {
    throw new Error("AuthContext not initialized");
    return null;
  },
  register: async () => {
    throw new Error("AuthContext not initialized");
  }
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to check auth status that can be called from anywhere
  const refreshUser = async (): Promise<User | null> => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Important for cookies
        headers: {
          "Accept": "application/json",
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // This is expected for not logged in users, no need to log error
          setUser(null);
          return null;
        }
        throw new Error(`Auth check failed: ${response.status}`);
      }
      
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      console.log("AuthContext: Checking auth status on mount");
      try {
        const userData = await refreshUser();
        console.log("AuthContext: Auth status check result:", { userData, isAuthenticated: !!userData });
      } catch (error) {
        // User is not logged in
        console.error("AuthContext: Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    try {
      console.log("Attempting login with:", { username });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login failed with status:", response.status, errorText);
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }
      
      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<User> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      
      const newUser = await response.json();
      setUser(newUser);
      
      return newUser;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Use the correct parameter order (url, method, data) and handle non-JSON responses
      await apiRequest("/api/auth/logout", "POST");
      
      // Set user to null regardless of API response
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      
      // Even if the logout API fails, we should still clear the local user state
      setUser(null);
      
      toast({
        variant: "destructive",
        title: "Logout error",
        description: "There was a problem logging out, but your local session has been cleared.",
      });
      
      // Redirect to login page anyway for safety
      window.location.href = "/login";
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
