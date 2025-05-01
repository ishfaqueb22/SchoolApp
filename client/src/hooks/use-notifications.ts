import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserNotification } from "@shared/schema";

interface UseNotificationsReturn {
  notifications: UserNotification[] | undefined;
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<any>;
}

export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();
  const queryKey = ['/api/user/notifications'];

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = useQuery<UserNotification[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/user/notifications', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Count unread notifications
  const unreadCount = notifications?.filter(notification => !notification.isRead).length || 0;

  // Mutation to mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications cache to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
    }
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/notifications/read-all`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications cache to trigger refetch
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error("Error marking all notifications as read:", error);
    }
  });

  // Wrapped functions to handle mutations
  const markAsRead = async (id: number) => {
    await markAsReadMutation.mutateAsync(id);
  };

  const markAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch
  };
}