import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutGrid,
  School,
  Building,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { SchoolSelector } from "@/components/admin/school-selector";

interface SchoolAdminLayoutProps {
  children: React.ReactNode;
}

export function SchoolAdminLayout({ children }: SchoolAdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const schoolId = user?.schoolId || 1;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sidebarLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutGrid,
    },
    {
      name: "School Details",
      href: `/admin/schools/${schoolId}`,
      icon: School,
    },
    {
      name: "Faculty",
      href: `/admin/schools/${schoolId}/faculty`,
      icon: Users,
    },
    {
      name: "Posts",
      href: `/admin/schools/${schoolId}/posts`,
      icon: FileText,
    },
    {
      name: "Inquiries",
      href: `/admin/schools/${schoolId}/inquiries`,
      icon: MessageSquare,
    },
    {
      name: "Notifications",
      href: "/admin/notifications",
      icon: BellRing,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    // Development/testing tool
    {
      name: "Test Notification",
      href: "/admin/test-notification",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-card shadow-md",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & App name */}
          <div className="p-4 border-b">
            <Link href="/admin">
              <div className="flex items-center space-x-2 cursor-pointer">
                <School className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">SmartSchool Finder</h1>
              </div>
            </Link>
          </div>

          {/* Admin info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {user?.fullName?.substring(0, 2).toUpperCase() || "SA"}
                </AvatarFallback>
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName || "School Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "admin@school.edu"}</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {sidebarLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <div 
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm",
                        location === link.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top navigation bar */}
        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-8 bg-background/95 backdrop-blur-sm">
          <div className="lg:hidden">
            <h1 className="text-xl font-bold">SmartSchool Finder</h1>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin/school-registration">
                <School className="mr-2 h-4 w-4" />
                Register School
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* School Selector */}
            <SchoolSelector />
            
            {/* Notification Badge */}
            <div className="hidden sm:block">
              <NotificationBadge />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.fullName?.substring(0, 2).toUpperCase() || "SA"}
                    </AvatarFallback>
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  </Avatar>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}