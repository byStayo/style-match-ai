export async function fetchHMProducts() {
  console.log('Fetching H&M products...');
  try {
    const response = await fetch('https://www2.hm.com/en_us/women/products/view-all.html');
    const html = await response.text();
    const products = [];
    
    const productMatches = html.match(/<article class="product-item".*?<\/article>/gs) || [];
    
    for (const productHtml of productMatches) {
      const urlMatch = productHtml.match(/href="([^"]+)"/);
      const imageMatch = productHtml.match(/data-src="([^"]+)"/);
      const titleMatch = productHtml.match(/data-title="([^"]+)"/);
      const priceMatch = productHtml.match(/data-price="([^"]+)"/);
      
      if (urlMatch && imageMatch && titleMatch && priceMatch) {
        products.push({
          url: `https://www2.hm.com${urlMatch[1]}`,
          image: imageMatch[1],
          title: titleMatch[1],
          price: parseFloat(priceMatch[1])
        });
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching H&M products:', error);
    return [];
  }
}