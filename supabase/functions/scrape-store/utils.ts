export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function generateBatchId(): string {
  return crypto.randomUUID();
}

export function validateProduct(product: any): boolean {
  return !!(
    product.url &&
    product.image &&
    product.title &&
    typeof product.price === 'number'
  );
}