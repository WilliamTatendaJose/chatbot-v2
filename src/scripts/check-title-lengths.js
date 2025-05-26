import { techrehubServices } from './src/config/index.js';

console.log('Checking service title lengths:');
techrehubServices.forEach(service => {
  console.log(`"${service.name}" - Length: ${service.name.length} ${service.name.length > 24 ? '❌ TOO LONG' : '✅ OK'}`);
});

console.log('\nWhatsApp Interactive List Requirements:');
console.log('- Row title max length: 24 characters');
console.log('- Row description max length: 72 characters');

console.log('\nTruncating long titles:');
techrehubServices.forEach(service => {
  if (service.name.length > 24) {
    const truncated = service.name.substring(0, 21) + '...';
    console.log(`"${service.name}" → "${truncated}" (${truncated.length} chars)`);
  }
});
