# Deployment Guide

This document provides instructions for deploying your TechRehub chatbot to different environments.

## Deployment Options

There are several options for deploying your chatbot:

1. **Traditional hosting** (VPS, dedicated server)
2. **Platform as a Service** (Heroku, DigitalOcean App Platform)
3. **Serverless** (AWS Lambda + API Gateway)
4. **Container-based** (Docker + Kubernetes)

This guide focuses on the most common deployment methods.

## Prerequisites

- A MongoDB database (MongoDB Atlas recommended for production)
- WhatsApp Business Account and API credentials
- Facebook Developer Account and Messenger API credentials
- A domain name (optional but recommended)

## Option 1: Traditional Server Deployment

### Step 1: Set Up the Server

1. **Provision a server**:

   - Ubuntu 20.04 LTS recommended
   - Minimum specs: 1 CPU, 1GB RAM, 25GB SSD

2. **Install dependencies**:

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2

   # Install MongoDB (if hosting locally)
   sudo apt install -y mongodb
   sudo systemctl enable mongodb
   sudo systemctl start mongodb
   ```

### Step 2: Deploy the Application

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd chatbot
   ```

2. **Install dependencies**:

   ```bash
   npm install --production
   ```

3. **Create .env file**:

   ```bash
   nano .env
   ```

   Add all required environment variables.

4. **Start the application with PM2**:
   ```bash
   pm2 start src/app.js --name techrehub-chatbot
   pm2 save
   pm2 startup
   ```

### Step 3: Set Up Reverse Proxy with Nginx

1. **Install Nginx**:

   ```bash
   sudo apt install -y nginx
   ```

2. **Configure Nginx**:

   ```bash
   sudo nano /etc/nginx/sites-available/chatbot.conf
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/chatbot.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 4: Set Up SSL with Let's Encrypt

1. **Install Certbot**:

   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**:

   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Set up auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

### Step 5: Update Webhook URLs

Update your webhook URLs in the WhatsApp Business Platform and Facebook Developer Portal to point to:

- WhatsApp: `https://your-domain.com/api/webhook/whatsapp`
- Messenger: `https://your-domain.com/api/webhook/messenger`

## Option 2: Heroku Deployment

### Step 1: Prepare the Application

1. **Create a Procfile**:
   Create a file named `Procfile` in the root of your project with the following content:

   ```
   web: node src/app.js
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   heroku config:set WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   heroku config:set WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id
   heroku config:set WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
   heroku config:set MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token
   heroku config:set MESSENGER_VERIFY_TOKEN=your_verify_token
   heroku config:set MESSENGER_APP_SECRET=your_app_secret
   heroku config:set ADMIN_PHONE_NUMBERS=phone1,phone2
   ```

### Step 2: Deploy to Heroku

1. **Install Heroku CLI**:
   Follow instructions at: https://devcenter.heroku.com/articles/heroku-cli

2. **Create a Heroku app**:

   ```bash
   heroku create techrehub-chatbot
   ```

3. **Push to Heroku**:

   ```bash
   git push heroku main
   ```

4. **Ensure at least one dyno is running**:
   ```bash
   heroku ps:scale web=1
   ```

### Step 3: Update Webhook URLs

Update your webhook URLs in the WhatsApp Business Platform and Facebook Developer Portal to point to:

- WhatsApp: `https://techrehub-chatbot.herokuapp.com/api/webhook/whatsapp`
- Messenger: `https://techrehub-chatbot.herokuapp.com/api/webhook/messenger`

## Option 3: AWS Elastic Beanstalk

### Step 1: Prepare the Application

1. **Install AWS CLI and EB CLI**:
   Follow instructions at: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html

2. **Initialize EB**:
   ```bash
   eb init
   ```
   Follow the prompts to set up your application.

### Step 2: Configuration

1. **Create `.ebextensions` directory**:

   ```bash
   mkdir .ebextensions
   ```

2. **Create a configuration file**:

   ```bash
   nano .ebextensions/nodecommand.config
   ```

   Add:

   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm start"
   ```

3. **Create environment variables**:
   ```bash
   nano .ebextensions/env.config
   ```
   Add:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       # Add other environment variables here
   ```

### Step 3: Deploy

1. **Create environment**:

   ```bash
   eb create techrehub-chatbot-env
   ```

2. **Set environment variables**:

   ```bash
   eb setenv MONGODB_URI=your_mongodb_uri WHATSAPP_ACCESS_TOKEN=your_token ...
   ```

3. **Deploy**:
   ```bash
   eb deploy
   ```

### Step 4: Update Webhook URLs

Update your webhook URLs with the Elastic Beanstalk environment URL.

## Post-Deployment

Regardless of the deployment method, after deploying:

1. **Test the API connections**:

   ```bash
   curl https://your-domain.com/health
   ```

2. **Test the webhooks**:
   Use the webhook simulator or send test messages.

3. **Monitor the application**:
   - Check logs regularly
   - Set up alerts for errors
   - Monitor server resources

## Security Considerations

1. **Keep access tokens secure**:

   - Never commit tokens to version control
   - Rotate tokens periodically

2. **Implement rate limiting**:

   - Protect against abuse
   - Consider using a service like CloudFlare

3. **Set up firewall rules**:

   - Only allow necessary ports
   - Restrict database access

4. **Regular updates**:
   - Keep dependencies updated
   - Apply security patches

## Backup and Recovery

1. **Database backups**:

   - Set up automated MongoDB backups
   - Test restoration procedures

2. **Application backups**:

   - Back up configuration files
   - Document deployment process

3. **Disaster recovery plan**:
   - Document steps to recover from failures
   - Test recovery procedures periodically
