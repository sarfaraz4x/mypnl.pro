
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUsageLimit = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);

  const FREE_UPLOAD_LIMIT = 10;

  // Listen for auth state changes and refresh usage/subscription
  useEffect(() => {
    fetchUploadsCount();
    checkLifetimeAccess();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUploadsCount();
      checkLifetimeAccess();
    });
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const fetchUploadsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id', { count: 'exact' });

      if (error) throw error;

      const count = data?.length || 0;
      setUploadsCount(count);
      // Only check limit if user doesn't have lifetime access
      if (!hasLifetimeAccess) {
        setHasReachedLimit(count >= FREE_UPLOAD_LIMIT);
      } else {
        setHasReachedLimit(false);
      }
    } catch (error) {
      console.error('Error fetching uploads count:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLifetimeAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data && data.plan_type === 'lifetime') {
        setHasLifetimeAccess(true);
        setHasReachedLimit(false);
      } else {
        setHasLifetimeAccess(false);
      }
    } catch (error) {
      console.error('Error checking lifetime access:', error);
    }
  };

  const refreshUsageCount = () => {
    fetchUploadsCount();
    checkLifetimeAccess();
  };

  return {
    uploadsCount,
    hasReachedLimit,
    hasLifetimeAccess,
    freeLimit: FREE_UPLOAD_LIMIT,
    loading,
    refreshUsageCount
  };
};
