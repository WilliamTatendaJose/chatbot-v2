import { techrehubProducts } from './src/config/index.js';

console.log('Checking product title lengths:');
techrehubProducts.forEach(product => {
  console.log(`"${product.name}" - Length: ${product.name.length} ${product.name.length > 24 ? '❌ TOO LONG' : '✅ OK'}`);
});

console.log('\nTruncating long product titles:');
techrehubProducts.forEach(product => {
  if (product.name.length > 24) {
    const truncated = product.name.substring(0, 21) + '...';
    console.log(`"${product.name}" → "${truncated}" (${truncated.length} chars)`);
  }
});
