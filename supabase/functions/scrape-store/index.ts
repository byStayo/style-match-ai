import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { coordinateScraping } from './coordinator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store, userId } = await req.json();
    
    if (!store) {
      throw new Error('Store name is required');
    }

    console.log('Starting product indexing for store:', store);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store details
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('name', store)
      .single();

    if (storeError || !storeData) {
      throw new Error('Store not found');
    }

    const stats = await coordinateScraping(storeData, supabase);

    // If userId provided, trigger matching
    if (userId) {
      console.log('Triggering product matching for user:', userId);
      await supabase.functions.invoke('match-products', {
        body: { 
          userId,
          storeFilter: [storeData.id],
          minSimilarity: 0.7,
          limit: 20
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-store function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});