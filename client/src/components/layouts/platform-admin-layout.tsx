import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, School, Clipboard, Settings, Users, BarChart,
  BellRing, LogOut, Menu, Building, MessagesSquare, ShieldAlert, BookText, 
  ChevronDown, ChevronRight, Mail, CheckCircle, Link2 as Link2Icon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

export function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/authentication/login');
    } else if (isAuthenticated && user && user.role !== 'platformAdmin' && user.role !== 'admin') {
      // If authenticated but not a platform admin, redirect to dashboard
      navigate('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Display loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'AD';

  const links = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard/platform-admin',
      active: location === '/dashboard/platform-admin',
    },
    {
      title: 'Schools',
      icon: School,
      href: '/dashboard/platform-admin/schools',
      active: location === '/dashboard/platform-admin/schools',
    },
    {
      title: 'School Approval',
      icon: CheckCircle,
      href: '/dashboard/platform-admin/school-approval',
      active: location === '/dashboard/platform-admin/school-approval',
    },
    {
      title: 'Users',
      icon: Users,
      href: '/dashboard/platform-admin/users',
      active: location === '/dashboard/platform-admin/users',
    },
    {
      title: 'Team Management',
      icon: Users,
      href: '/dashboard/platform-admin/team-management',
      active: location === '/dashboard/platform-admin/team-management',
    },
    {
      title: 'Content',
      icon: BookText,
      href: '/dashboard/platform-admin/content',
      active: location === '/dashboard/platform-admin/content',
    },
    {
      title: 'Reviews Moderation',
      icon: Clipboard,
      href: '/dashboard/platform-admin/reviews',
      active: location === '/dashboard/platform-admin/reviews',
    },
    {
      title: 'Messages',
      icon: MessagesSquare,
      href: '/dashboard/platform-admin/messages',
      active: location === '/dashboard/platform-admin/messages',
      badge: 3,
    },
    {
      title: 'Analytics',
      icon: BarChart,
      href: '/dashboard/platform-admin/analytics',
      active: location === '/dashboard/platform-admin/analytics',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/dashboard/platform-admin/settings',
      active: location === '/dashboard/platform-admin/settings',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setOpen(false)}
              >
                <SchoolIcon className="h-6 w-6" />
                <span className="font-bold">SmartSchool Finder</span>
              </Link>
              <Separator className="my-4" />
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg 
                  ${
                    link.active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.title}
                  {link.badge && (
                    <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-medium text-primary-foreground">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <SchoolIcon className="h-6 w-6" />
            <span className="hidden font-bold md:inline-block">SmartSchool Finder</span>
          </Link>
          <div className="hidden md:flex">
            <Separator orientation="vertical" className="mx-4 h-8" />
            <Link
              to="/dashboard/platform-admin"
              className="text-sm font-medium text-muted-foreground"
            >
              Platform Admin Dashboard
            </Link>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <BellRing className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.5rem] font-medium text-primary-foreground">
                  4
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid gap-1">
                <Button variant="ghost" className="h-auto justify-start px-4 py-2 text-left">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">School Approval Required</p>
                      <p className="text-xs text-muted-foreground">
                        A new school needs approval
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        5 minutes ago
                      </p>
                    </div>
                  </div>
                </Button>
                <Button variant="ghost" className="h-auto justify-start px-4 py-2 text-left">
                  <div className="flex items-start gap-2">
                    <Clipboard className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">3 Reviews Need Moderation</p>
                      <p className="text-xs text-muted-foreground">
                        New reviews have been submitted
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/dashboard/platform-admin/notifications" className="flex w-full items-center">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="Avatar" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/platform-admin/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/platform-admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2 p-4">
            <nav className="grid gap-1 text-sm font-medium">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2
                  ${
                    link.active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                  {link.badge && (
                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-medium text-primary-foreground">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex flex-1 flex-col bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 22 10-10 10 10" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    </svg>
  );
}