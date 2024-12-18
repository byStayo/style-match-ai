export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
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
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }
  
  return results;
}