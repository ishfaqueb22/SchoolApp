import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Helmet } from 'react-helmet';
import { 
  LayoutDashboard, 
  School, 
  MessageSquare, 
  Heart, 
  User,
  Settings 
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'SmartSchool Finder', 
  description = 'Find the perfect school for your child with our intelligent school discovery platform.'
}) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""/>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

// User Dashboard Layout
export const UserLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'User Dashboard - SmartSchool Finder', 
  description = 'Manage your school inquiries, saved schools, and account settings.'
}) => {
  // User dashboard navigation items
  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      href: "/dashboard/user"
    },
    {
      label: "My Inquiries",
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      href: "/dashboard/my-inquiries"
    },
    {
      label: "Saved Schools",
      icon: <Heart className="h-4 w-4 mr-2" />,
      href: "/dashboard/user/saved-schools"
    },
    {
      label: "Profile",
      icon: <User className="h-4 w-4 mr-2" />,
      href: "/dashboard/user/profile"
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
      href: "/dashboard/user/settings"
    }
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <div className="flex flex-grow">
          {/* Sidebar for larger screens */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-background h-[calc(100vh-64px)] fixed">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">User Dashboard</h2>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-md hover:bg-muted ${
                    window.location.pathname === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
          
          {/* Main content */}
          <main className="flex-grow md:ml-64">
            {children}
          </main>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default MainLayout;