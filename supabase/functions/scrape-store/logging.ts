import { createClient } from '@supabase/supabase-js';
import { ScrapingLog } from './types';

export async function updateScrapingLog(
  supabase: ReturnType<typeof createClient>,
  log: Partial<ScrapingLog>
): Promise<ScrapingLog> {
  try {
    const { data, error } = await supabase
      .from('store_scrape_logs')
      .upsert({
        ...log,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating scrape log:', error);
    throw error;
  }
}