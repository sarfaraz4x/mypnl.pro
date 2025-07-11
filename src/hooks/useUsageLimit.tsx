
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUsageLimit = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);

  const FREE_UPLOAD_LIMIT = 10;

  const fetchUploadsCount = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id', { count: 'exact' });

      if (error) throw error;

      const count = data?.length || 0;
      setUploadsCount(count);
    } catch (error) {
      console.error('Error fetching uploads count:', error);
    }
  }, []);

  const checkLifetimeAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasLifetimeAccess(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        setHasLifetimeAccess(false);
        return;
      }

      const hasLifetime = data && data.plan_type === 'lifetime';
      setHasLifetimeAccess(hasLifetime);
    } catch (error) {
      console.error('Error checking lifetime access:', error);
      setHasLifetimeAccess(false);
    }
  }, []);

  // Update limit status whenever uploads count or lifetime access changes
  useEffect(() => {
    if (!hasLifetimeAccess) {
      setHasReachedLimit(uploadsCount >= FREE_UPLOAD_LIMIT);
    } else {
      setHasReachedLimit(false);
    }
  }, [uploadsCount, hasLifetimeAccess]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchUploadsCount(), checkLifetimeAccess()]);
      } catch (error) {
        console.error('Error initializing usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchUploadsCount, checkLifetimeAccess]);

  const refreshUsageCount = useCallback(() => {
    fetchUploadsCount();
    checkLifetimeAccess();
  }, [fetchUploadsCount, checkLifetimeAccess]);

  return {
    uploadsCount,
    hasReachedLimit,
    hasLifetimeAccess,
    freeLimit: FREE_UPLOAD_LIMIT,
    loading,
    refreshUsageCount
  };
};
