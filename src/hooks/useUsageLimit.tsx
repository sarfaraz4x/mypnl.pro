
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUsageLimit = () => {
  const [uploadsCount, setUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  const FREE_UPLOAD_LIMIT = 10;

  useEffect(() => {
    fetchUploadsCount();
  }, []);

  const fetchUploadsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('id', { count: 'exact' });

      if (error) throw error;

      const count = data?.length || 0;
      setUploadsCount(count);
      setHasReachedLimit(count >= FREE_UPLOAD_LIMIT);
    } catch (error) {
      console.error('Error fetching uploads count:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsageCount = () => {
    fetchUploadsCount();
  };

  return {
    uploadsCount,
    hasReachedLimit,
    freeLimit: FREE_UPLOAD_LIMIT,
    loading,
    refreshUsageCount
  };
};
