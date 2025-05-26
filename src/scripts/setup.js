import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Helper function to execute shell commands
function executeCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error(`Command failed: ${error.message}`);
    return null;
  }
}

// Helper function to update .env file
function updateEnvFile(envVars) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  
  // Read existing .env file or create a new one
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('Creating new .env file');
  }
  
  // Update each env var
  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (envContent.match(regex)) {
      // Replace existing value
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new value
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
    }
  }
  
  // Write back to file
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated .env file with ${Object.keys(envVars).length} variables`);
}

// Main function
async function main() {
  console.log('====================================');
  console.log('TechRehub Chatbot Setup');
  console.log('====================================');
  
  // Check if node_modules exists, if not install dependencies
  if (!fs.existsSync(path.join(__dirname, '..', '..', 'node_modules'))) {
    console.log('Installing dependencies...');
    executeCommand('npm install');
  }
  
  // Setup environment variables
  console.log('\n1. Setting up environment variables');
  const envVars = {};
  
  // General config
  envVars.PORT = await prompt('Port to run the server on (default: 3000): ') || '3000';
  envVars.NODE_ENV = await prompt('Environment (development/production, default: development): ') || 'development';
  
  // MongoDB config
  console.log('\n2. MongoDB Configuration');
  envVars.MONGODB_URI = await prompt('MongoDB URI (default: mongodb://localhost:27017/techrehub-chatbot): ') || 'mongodb://localhost:27017/techrehub-chatbot';
  
  // WhatsApp API config
  console.log('\n3. WhatsApp Cloud API Configuration');
  console.log('Follow instructions at: docs/whatsapp-api-setup.md');
  envVars.WHATSAPP_ACCESS_TOKEN = await prompt('WhatsApp Access Token: ');
  envVars.WHATSAPP_PHONE_NUMBER_ID = await prompt('WhatsApp Phone Number ID: ');
  envVars.WHATSAPP_BUSINESS_ACCOUNT_ID = await prompt('WhatsApp Business Account ID: ');
  envVars.WHATSAPP_WEBHOOK_VERIFY_TOKEN = await prompt('WhatsApp Webhook Verify Token (custom string): ') || 'techrehub_verify_token_' + Math.random().toString(36).substring(2, 10);
    // Facebook Messenger config
  console.log('\n4. Facebook Messenger Configuration');
  envVars.MESSENGER_PAGE_ACCESS_TOKEN = await prompt('Messenger Page Access Token: ');
  envVars.MESSENGER_VERIFY_TOKEN = await prompt('Messenger Verify Token (custom string): ') || 'techrehub_messenger_token_' + Math.random().toString(36).substring(2, 10);
  envVars.MESSENGER_APP_SECRET = await prompt('Messenger App Secret: ');
  
  // Paynow payment config
  console.log('\n5. Paynow Payment Configuration (Zimbabwe)');
  envVars.PAYNOW_INTEGRATION_ID = await prompt('Paynow Integration ID: ');
  envVars.PAYNOW_INTEGRATION_KEY = await prompt('Paynow Integration Key: ');
  envVars.PAYNOW_RESULT_URL = await prompt('Paynow Result URL (callback, default: https://your-domain.com/api/payments/callback): ') || 'https://your-domain.com/api/payments/callback';
  envVars.PAYNOW_RETURN_URL = await prompt('Paynow Return URL (user redirect, default: https://your-domain.com/payments/return): ') || 'https://your-domain.com/payments/return';
  
  // Admin config
  console.log('\n6. Admin Configuration');
  envVars.ADMIN_PHONE_NUMBERS = await prompt('Admin Phone Numbers (comma-separated, with country code): ');
  
  // Test recipient config (for testing scripts)
  console.log('\n7. Test Configuration');
  envVars.TEST_RECIPIENT_NUMBER = await prompt('Test WhatsApp Recipient Number (for test script): ');
  envVars.TEST_RECIPIENT_ID = await prompt('Test Messenger Recipient ID (for test script): ');
  envVars.LOCAL_WEBHOOK_URL = await prompt('Local Webhook URL (for simulator, default: http://localhost:3000): ') || 'http://localhost:3000';
  
  // Update .env file
  updateEnvFile(envVars);
  
  console.log('\nSetup complete!');
  console.log('\nNext steps:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Test WhatsApp API: node src/scripts/whatsapp-test.js');
  console.log('3. Test Messenger API: node src/scripts/messenger-test.js');
  console.log('4. Simulate webhooks: node src/scripts/webhook-simulator.js');
  console.log('\nFor more information, refer to the README.md and docs/ folder.');
  
  rl.close();
}

// Run the main function
main().catch(console.error);
