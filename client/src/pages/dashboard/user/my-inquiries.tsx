import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Wifi, WifiOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Inquiry } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';

// Enhanced inquiry type that includes the school name
type EnhancedInquiry = Inquiry & {
  schoolName?: string;
};

const UserMyInquiries: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();
  
  // Fetch user inquiries
  const { data: inquiries, isLoading, isError, error } = useQuery<EnhancedInquiry[]>({
    queryKey: ['/api/user/inquiries'],
    retry: 1,
  });
  
  // Listen for WebSocket messages about inquiry updates
  useEffect(() => {
    if (lastMessage?.type === 'notification') {
      // If we receive an inquiry update notification
      if (lastMessage.data?.type === 'inquiry_update') {
        // Show a toast notification
        toast({
          title: 'Inquiry Updated',
          description: `${lastMessage.data.schoolName || 'A school'} has responded to your inquiry about "${lastMessage.data.subject || 'your question'}"`,
          variant: 'default',
        });
        
        // Invalidate the inquiries query to reload the data
        queryClient.invalidateQueries({ queryKey: ['/api/user/inquiries'] });
      }
    }
  }, [lastMessage, toast, queryClient]);

  // Helper function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'in progress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-purple-500">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Helper to format date
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <UserLayout title="My Inquiries - School Finder">
      <div className="container py-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
            <p className="text-muted-foreground">
              Track your inquiries and responses from schools
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm mr-2">
              {isConnected ? 'Live Updates' : 'Offline Mode'}
            </span>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Inquiries</CardTitle>
            <CardDescription>
              View and manage all your submitted inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="loader"></div>
                <p className="ml-3 text-muted-foreground">Loading your inquiries...</p>
              </div>
            ) : isError ? (
              <div className="text-center p-4 text-red-500">
                <p>Error loading inquiries: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : inquiries?.length === 0 ? (
              <div className="text-center p-10 border rounded-md bg-muted/10">
                <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't sent any inquiries to schools yet.
                </p>
                <Button variant="default" onClick={() => window.location.href = '/discover'}>
                  Explore Schools
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[550px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries?.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">{inquiry.schoolName || 'Unknown School'}</TableCell>
                        <TableCell>{inquiry.subject}</TableCell>
                        <TableCell>{getStatusBadge(inquiry.status || 'Unknown')}</TableCell>
                        <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                        <TableCell>
                          {inquiry.response ? (
                            <div>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Responded {formatDate(inquiry.responseDate)}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              Awaiting Response
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (inquiry.response) {
                                toast({
                                  title: "Response from " + inquiry.schoolName,
                                  description: inquiry.response,
                                });
                              } else {
                                toast({
                                  title: "No response yet",
                                  description: "The school hasn't responded to this inquiry yet.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Response</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default UserMyInquiries;