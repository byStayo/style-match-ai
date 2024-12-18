const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 1000; // 1 second between batches

export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  onProgress?: (processed: number) => Promise<void>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          return await processor(item);
        } catch (error) {
          console.error('Error processing item:', error);
          return null;
        }
      })
    );
    
    results.push(...batchResults.filter(Boolean));
    
    if (onProgress) {
      await onProgress(Math.min(i + BATCH_SIZE, items.length));
    }
    
    // Rate limiting between batches
    if (i + BATCH_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }
  
  return results;
}