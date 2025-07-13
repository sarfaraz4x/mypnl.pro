
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const useUsageLimit = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const { subscription } = useSubscription();

  const FREE_UPLOAD_LIMIT = 20;

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

  const hasLifetimeAccess = subscription?.plan_type === 'lifetime';
  const hasPaidPlan = subscription?.plan_type === 'monthly' || subscription?.plan_type === 'yearly' || subscription?.plan_type === 'lifetime';

  // Update limit status whenever uploads count or subscription changes
  useEffect(() => {
    if (hasLifetimeAccess) {
      // Lifetime users have unlimited uploads
      setHasReachedLimit(false);
    } else if (hasPaidPlan) {
      // Paid users (monthly/yearly) have unlimited uploads
      setHasReachedLimit(false);
    } else {
      // Free users are limited to 10 uploads
      setHasReachedLimit(uploadsCount >= FREE_UPLOAD_LIMIT);
    }
  }, [uploadsCount, hasLifetimeAccess, hasPaidPlan]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchUploadsCount();
      } catch (error) {
        console.error('Error initializing usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchUploadsCount]);

  const refreshUsageCount = useCallback(() => {
    fetchUploadsCount();
  }, [fetchUploadsCount]);

  return {
    uploadsCount,
    hasReachedLimit,
    hasLifetimeAccess,
    hasPaidPlan,
    freeLimit: FREE_UPLOAD_LIMIT,
    loading,
    refreshUsageCount
  };
};
