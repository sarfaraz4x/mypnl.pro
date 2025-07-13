import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  plan_type: string;
  status: string;
  end_date: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  updateSubscription: (newSubscription: Subscription) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status, end_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscription();
  };

  const updateSubscription = (newSubscription: Subscription) => {
    setSubscription(newSubscription);
  };

  useEffect(() => {
    fetchSubscription();

    // Set up real-time subscription to subscription changes
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Setting up real-time subscription for user:', user.id);
      
      const channel = supabase
        .channel(`subscription_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Subscription change detected for current user:', payload);
            console.log('Current subscription before update:', subscription);
            
            // Immediately update the subscription state
            if (payload.new) {
              const newSubscription = {
                plan_type: (payload.new as any).plan_type,
                status: (payload.new as any).status,
                end_date: (payload.new as any).end_date
              };
              console.log('Updating subscription to:', newSubscription);
              setSubscription(newSubscription);
            } else if (payload.eventType === 'DELETE') {
              console.log('Subscription deleted, setting to null');
              setSubscription(null);
            }
          }
        )
        .subscribe();

      return channel;
    };

    // Listen for manual subscription updates from admin panel
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      console.log('Manual subscription update received:', event.detail);
      setSubscription(event.detail);
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);

    setupRealtimeSubscription().then(channel => {
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
        window.removeEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);
      };
    });
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription,
        updateSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 