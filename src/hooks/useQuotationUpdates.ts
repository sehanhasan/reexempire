
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useQuotationUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscription for quotation status changes
    const quotationChannel = supabase
      .channel('quotation-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotations'
        },
        (payload) => {
          console.log('Quotation updated:', payload);
          
          // Invalidate and refetch quotation queries
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
          queryClient.invalidateQueries({ queryKey: ['quotation', payload.new.id] });
          
          // If specific quotation was updated, update its cache
          if (payload.new) {
            queryClient.setQueryData(['quotation', payload.new.id], payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(quotationChannel);
    };
  }, [queryClient]);
}
