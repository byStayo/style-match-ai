export async function fetchUniqloProducts() {
  console.log('Fetching Uniqlo products...');
  try {
    const response = await fetch('https://www.uniqlo.com/us/api/commerce/v5/en/products?path=women&offset=0&limit=40');
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      url: `https://www.uniqlo.com/us/en/products/${item.productId}`,
      image: item.images.main,
      title: item.name,
      price: item.prices.base,
      description: item.description
    }));
  } catch (error) {
    console.error('Error fetching Uniqlo products:', error);
    return [];
  }
}