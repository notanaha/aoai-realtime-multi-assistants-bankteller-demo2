# Azure Deployment Guide

This guide explains how to deploy the Bank Teller Assistant application to Azure Web App using Azure Developer CLI (azd).

## Overview

The application is configured to deploy to Azure App Service (Web App) with the following architecture:
- **Frontend**: Static HTML/JS files served by Express.js
- **Hosting**: Azure App Service (Linux, Node.js 20 LTS)
- **Configuration**: Environment variables managed through Azure App Service settings

## Prerequisites

1. **Azure Developer CLI (azd)**
   - Install from: https://aka.ms/azd
   - Verify installation: `azd version`

2. **Azure Subscription**
   - Active Azure subscription
   - Permissions to create resources (App Service, App Service Plan)

3. **Azure OpenAI Resources**
   - Azure OpenAI account
   - gpt-realtime (2025-08-28) (GA) model deployment
   - Note your endpoint, API key, and deployment name

4. **Bing Search Resource (OPTIONAL)**
   - Bing Search API subscription
   - API key

## Environment Setup

1. Copy the sample environment file:
   ```bash
   cp .env_sample .env
   ```

2. Edit `.env` and configure the following variables:
   ```
   VITE_AOAI_ENDPOINT=https://<your-aoai-account>.openai.azure.com/
   VITE_AOAI_API_KEY=<your-api-key>
   VITE_AOAI_DEPLOYMENT=gpt-realtime
   ```

   **Important**: These values will be automatically read by `azd` and configured as environment variables in your Azure Web App.
   
   **Note**: `VITE_BING_API_KEY` is optional and can be left empty if not needed.

3. **(Microsoft employees - FDPO tenant)** Enable Entra ID authentication by setting these additional values before running `azd up`:
   ```
   ENABLE_AAD_AUTH=true
   AAD_TENANT_ID=fdpo.microsoft.com
   AAD_CLIENT_ID=<app-registration-client-id>
   AAD_CLIENT_SECRET=<app-registration-client-secret>
   ```
   This enforces sign-in with the FDPO tenant when accessing the deployed application.

## Deployment Steps

### First-Time Deployment

1. Navigate to the project directory:
   ```bash
   cd /path/to/aoai-realtime-multi-assistants-bankteller-demo
   ```

2. Initialize and deploy with a single command:
   ```bash
   azd up
   ```

3. Follow the interactive prompts:
   - **Environment Name**: Choose a unique name (e.g., "bankteller-prod")
   - **Subscription**: Select your Azure subscription
   - **Region**: Choose an Azure region (e.g., "eastus", "westus2")

4. Wait for deployment to complete. This process will:
   - Provision Azure resources (Resource Group, App Service Plan, App Service)
   - Configure environment variables from your `.env` file
   - Build the application (`npm run build`)
   - Deploy to Azure Web App
   - Start the application (`npm start`)

5. Once complete, note the application URL in the output:
   ```
   Deploying service web
   
   Endpoint: https://app-<your-env-name>.azurewebsites.net/
   ```

### Subsequent Deployments

After making code changes, redeploy with:
```bash
azd deploy
```

This will rebuild and redeploy the application without recreating infrastructure.

## Accessing the Application

After successful deployment:

- **Main Application**: `https://app-<your-env-name>.azurewebsites.net/`
- **Customer Window**: `https://app-<your-env-name>.azurewebsites.net/customer.html`

## Managing the Deployment

### Update Environment Variables

To update environment variables after deployment:

1. Update your `.env` file
2. Run:
   ```bash
   azd deploy
   ```

Alternatively, update directly in Azure Portal:
- Navigate to your App Service
- Go to Configuration > Application settings
- Update the values for `VITE_AOAI_ENDPOINT`, `VITE_AOAI_API_KEY`, etc.
- Click Save and restart the app

### View Application Logs

**Using azd:**
```bash
azd monitor
```

**Using Azure Portal:**
1. Navigate to your App Service
2. Go to Monitoring > Log stream
3. View real-time logs

**Using Azure CLI:**
```bash
az webapp log tail --name app-<your-env-name> --resource-group rg-<your-env-name>
```

### Scale the Application

The default deployment uses a Basic (B1) tier App Service Plan. To scale:

**Via Azure Portal:**
1. Navigate to your App Service Plan
2. Go to Scale up (App Service plan)
3. Select a different tier (e.g., Standard, Premium)

**Via Azure CLI:**
```bash
az appservice plan update --name plan-<your-env-name> --resource-group rg-<your-env-name> --sku S1
```

## Clean Up Resources

To delete all Azure resources created by this deployment:

```bash
azd down
```

This will:
- Delete the resource group and all contained resources
- Preserve your local environment configuration

**Warning**: This action cannot be undone. All data and resources will be permanently deleted.

## Troubleshooting

### Deployment Fails

1. **Check azd version**: Ensure you have the latest version
   ```bash
   azd version
   azd upgrade
   ```

2. **Check Azure permissions**: Verify you have Contributor access to the subscription

3. **Check environment variables**: Ensure `.env` file exists and contains all required values
   - The `.env` file must exist in the project root directory
   - Required variables: `VITE_AOAI_ENDPOINT`, `VITE_AOAI_API_KEY`, `VITE_AOAI_DEPLOYMENT`
   - Optional variable: `VITE_BING_API_KEY`
   - If preprovision hook fails, check the error message and verify `.env` file format

### Missing Environment Variables in Web App

If environment variables are not appearing in your Azure Web App:

1. **Verify `.env` file exists** in the project root (not just `.env_sample`)
2. **Check preprovision hook logs** during `azd up` output for any errors
3. **Manually set variables** using Azure Portal or Azure CLI:
   ```bash
   az webapp config appsettings set --name app-<your-env-name> --resource-group rg-<your-env-name> --settings VITE_AOAI_ENDPOINT=<value> VITE_AOAI_API_KEY=<value>
   ```
4. **Redeploy** with `azd up` after ensuring `.env` file is properly configured

### Application Not Starting

1. **Check application logs** in Azure Portal (App Service > Log stream)

2. **Verify environment variables** are set correctly (App Service > Configuration)

3. **Check build output**: Ensure `dist` folder contains built files

### Customer Window Not Loading

1. Verify you can access the main application first
2. Access customer window at `/customer.html` (not `/customer`)
3. Check browser console for errors

## Architecture Details

### Azure Resources Created

- **Resource Group**: `rg-<environment-name>`
- **App Service Plan**: `plan-<environment-name>` (Linux, B1 tier)
- **App Service**: `app-<environment-name>` (Node.js 20 LTS)

### Build and Deployment Process

1. **Build Phase**:
   - TypeScript compilation: `tsc`
   - Vite build: Creates optimized bundles in `dist/`
   - Output: Static HTML, CSS, and JavaScript files

2. **Deployment Phase**:
   - Files uploaded to App Service
   - Dependencies installed: `npm install`
   - Application started: `npm start`

3. **Runtime**:
   - Express.js server runs on port 8080 (or PORT environment variable)
   - Serves static files from `dist/` folder
   - Routes `/customer.html` to customer window
   - All other routes serve main application

### Environment Variables

The following environment variables are configured in Azure Web App:

- `VITE_AOAI_ENDPOINT`: Azure OpenAI endpoint URL
- `VITE_AOAI_API_KEY`: Azure OpenAI API key
- `VITE_AOAI_DEPLOYMENT`: Model deployment name
- `VITE_BING_API_KEY`: Bing Search API key (optional)
