import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { PlatformAdminLayout } from '@/components/layouts/platform-admin-layout';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search, MessageSquare, Send, MoreVertical, 
  User, CheckCircle, AlertCircle, Calendar, Mail, Phone, MessageCircle,
  Filter, Tag, RefreshCw, Eye, CheckSquare, XCircle, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { SupportRequest } from '@shared/schema';

// Types for status and priority
type MessageStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

const MessagesPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MessageStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SupportRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);

  // Fetch support requests
  const { data: supportRequests, isLoading, error } = useQuery<SupportRequest[]>({
    queryKey: ['/api/support'],
  });

  // Mutation for updating support request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MessageStatus }) => {
      return apiRequest(
        'PATCH',
        `/api/support/${id}`,
        { status }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Status updated',
        description: 'The message status has been updated successfully.',
      });
      
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['/api/support'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating status',
        description: 'There was an error updating the message status.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating support request priority
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: MessagePriority }) => {
      return apiRequest(
        'PATCH',
        `/api/support/${id}`,
        { priority }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Priority updated',
        description: 'The message priority has been updated successfully.',
      });
      
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['/api/support'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating priority',
        description: 'There was an error updating the message priority.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for sending a response
  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      return apiRequest(
        'PATCH',
        `/api/support/${id}/respond`,
        { response }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Response sent',
        description: 'Your response has been sent successfully.',
      });
      
      // Close the dialog and reset form
      setIsRespondDialogOpen(false);
      setResponseText('');
      
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['/api/support'] });
    },
    onError: (error) => {
      toast({
        title: 'Error sending response',
        description: 'There was an error sending your response.',
        variant: 'destructive',
      });
    },
  });

  // Filter messages based on search, status, and priority
  const filteredMessages = supportRequests?.filter(message => {
    const matchesSearch = !searchQuery || 
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || message.status === statusFilter;
    const matchesPriority = !priorityFilter || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  // Helper function for status badge
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function for priority badge
  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Helper function to format dates
  const formatDate = (dateValue: any) => {
    const date = new Date(dateValue);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Handle responding to a message
  const handleRespond = () => {
    if (!selectedMessage || !responseText.trim()) return;
    
    respondMutation.mutate({
      id: selectedMessage.id,
      response: responseText
    });
  };

  return (
    <>
      <Helmet>
        <title>Support Messages | Platform Admin</title>
      </Helmet>
      <PlatformAdminLayout>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Support Messages</h1>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('open')}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('resolved')}>
                      Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
                      Closed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setPriorityFilter(null)}>
                      All Priorities
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>
                      Urgent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                      High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                      Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter(null);
                    setPriorityFilter(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>
            
            {/* Apply filters indicators */}
            {(statusFilter || priorityFilter) && (
              <div className="flex gap-2 mb-4">
                {statusFilter && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Status: {statusFilter}
                    <XCircle className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setStatusFilter(null)} />
                  </Badge>
                )}
                {priorityFilter && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Priority: {priorityFilter}
                    <XCircle className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setPriorityFilter(null)} />
                  </Badge>
                )}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Clock className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center text-destructive">
                  <AlertCircle className="h-10 w-10 mx-auto mb-4" />
                  <p>Error loading messages. Please try again.</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages found</p>
                </div>
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div className="font-medium">{message.name}</div>
                          <div className="text-xs text-muted-foreground">{message.email}</div>
                        </TableCell>
                        <TableCell>{message.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {message.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={message.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={message.priority} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </div>
        
        {/* Message Details Dialog */}
        {selectedMessage && (
          <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Message Details</DialogTitle>
                <DialogDescription>
                  View and respond to support message
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Badge>{selectedMessage.category}</Badge>
                    <StatusBadge status={selectedMessage.status} />
                    <PriorityBadge priority={selectedMessage.priority} />
                  </div>
                  
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Update Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ 
                            id: selectedMessage.id, 
                            status: 'open' 
                          })}
                        >
                          <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                          Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ 
                            id: selectedMessage.id, 
                            status: 'in_progress' 
                          })}
                        >
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ 
                            id: selectedMessage.id, 
                            status: 'resolved' 
                          })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ 
                            id: selectedMessage.id, 
                            status: 'closed' 
                          })}
                        >
                          <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                          Mark as Closed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Update Priority
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => updatePriorityMutation.mutate({ 
                            id: selectedMessage.id, 
                            priority: 'low' 
                          })}
                        >
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                          Low
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePriorityMutation.mutate({ 
                            id: selectedMessage.id, 
                            priority: 'medium' 
                          })}
                        >
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
                          Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePriorityMutation.mutate({ 
                            id: selectedMessage.id, 
                            priority: 'high' 
                          })}
                        >
                          <div className="h-3 w-3 rounded-full bg-orange-500 mr-2" />
                          High
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updatePriorityMutation.mutate({ 
                            id: selectedMessage.id, 
                            priority: 'urgent' 
                          })}
                        >
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2" />
                          Urgent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription>
                      From: {selectedMessage.name} ({selectedMessage.email})
                      {selectedMessage.phone && <span> • {selectedMessage.phone}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap">{selectedMessage.message}</div>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Received: {formatDate(selectedMessage.createdAt)}
                    </div>
                  </CardFooter>
                </Card>
                
                {selectedMessage.response && (
                  <Card className="bg-muted/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Your Response</CardTitle>
                      {selectedMessage.respondedAt && (
                        <CardDescription>
                          Sent: {formatDate(selectedMessage.respondedAt)}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap">{selectedMessage.response}</div>
                    </CardContent>
                  </Card>
                )}
                
                {!selectedMessage.response && selectedMessage.status !== 'closed' && (
                  <div>
                    <Button
                      onClick={() => setIsRespondDialogOpen(true)}
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Respond to Message
                    </Button>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Respond Dialog */}
        <Dialog open={isRespondDialogOpen} onOpenChange={setIsRespondDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Message</DialogTitle>
              <DialogDescription>
                {selectedMessage && (
                  <span>Responding to {selectedMessage.name}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Type your response here..."
                className="min-h-[150px]"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRespondDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRespond} disabled={!responseText.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PlatformAdminLayout>
    </>
  );
};

export default MessagesPage;