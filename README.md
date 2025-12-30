# Bank Teller Assistant
<h3>

[Read testing.md](./TESTING.md)<br>

[For Azure deployment, AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)<br>

[Demo script](./sample_script_bankteller_en.txt)<br>

</h3>
<br>

Original README follows.
# Azure OpenAI /realtime: an interactive chat with multi-assistants

This repo contains a node sample application that uses AOAI Realtime Audio endpoint. See more detail about the SDK at [AOAI Realtime Audio SDK](https://github.com/Azure-Samples/aoai-realtime-audio-sdk)

This sample switches multiple assistants (system prompt + tools set) seamlessly depending on your intent.

## 🚀 Quick Deploy to Azure

Deploy the application to Azure Web App with a single command:
```bash
azd up
```

See [Deployment to Azure Web App](#deployment-to-azure-web-app) for detailed instructions.

## Scenario

You can ask about mobile service, such as 

- Weather
- Mobile phone billing
- Mobile phoen current plan
- Mobile phone options
- Consulation on usage
- Mobile phoe store related question, etc.

You can find the assistant definitions at [assistants.ts](./src//assistants.ts).
See all tools set for each assistant to understand what each assistant can do, or modify as you need.

## Prereqs

### For Local Development
1. Node.js installation (https://nodejs.org)
1. Azure Open AI account
1. GPT-4o realtime model
1. Bing Search Resource

### For Azure Deployment
1. Azure Developer CLI (azd) installation (https://aka.ms/azd)
1. Azure subscription with permissions to create resources
1. Azure Open AI account with GPT-4o realtime model deployment
1. Bing Search Resource

## Deployment to Azure Web App

This application can be deployed to Azure Web App with a single command using Azure Developer CLI (azd).

### Prerequisites
1. Install Azure Developer CLI: https://aka.ms/azd
1. Copy `.env_sample` to `.env` and configure your environment variables:
   ```
   VITE_AOAI_ENDPOINT=https://<your-aoai-account>.openai.azure.com/
   VITE_AOAI_API_KEY=<your-api-key>
   VITE_AOAI_DEPLOYMENT=gpt-4o-realtime-preview
   VITE_BING_API_KEY=<your-bing-api-key>
   ```
   
   **Note**: `VITE_BING_API_KEY` is optional and can be left empty if not needed.

   **Microsoft employees (FDPO tenant)**: to require Entra ID sign-in on the deployed app, set the following in `.env` before running `azd up`:
   ```
   ENABLE_AAD_AUTH=true
   AAD_TENANT_ID=fdpo.microsoft.com
   AAD_CLIENT_ID=<app-registration-client-id>
   AAD_CLIENT_SECRET=<app-registration-client-secret>
   ```

### Deploy to Azure
1. Navigate to this folder
1. Run the following command to provision and deploy:
   ```bash
   azd up
   ```
1. Follow the prompts to:
   - Select your Azure subscription
   - Choose a region (e.g., eastus, westus2)
   - Provide an environment name (e.g., "bankteller-prod")

The `azd up` command will:
- Read environment variables from your `.env` file
- Provision Azure resources (App Service Plan and App Service)
- Configure environment variables in the Azure Web App
- Build the application
- Deploy to Azure Web App

After deployment completes, the application will be available at the URL shown in the output (e.g., `https://app-<your-env-name>.azurewebsites.net`).

### Accessing the Application
- Main window: `https://app-<your-env-name>.azurewebsites.net/`
- Customer window: `https://app-<your-env-name>.azurewebsites.net/customer.html`

### Managing the Deployment
- **Update deployment**: Run `azd deploy` to redeploy after making code changes
- **View logs**: Run `azd monitor` or check logs in Azure Portal
- **Clean up resources**: Run `azd down` to delete all Azure resources

## Using the sample

1. Navigate to this folder
1. Run `npm install` to download a small number of dependency packages (see `package.json`)
1. Rename `.env_sample` to `.env` and update variables
1. Run `npm run dev` to start the web server, navigating any firewall permissions prompts
1. Use any of the provided URIs from the console output, e.g. `http://localhost:5173/`, in a browser
1. **[NEW]** Click "Open Customer Window" button to open the customer information display in a separate window (or manually navigate to `http://localhost:5173/customer.html`)
1. If you want to debug the application, press F5 that will launch the browser for debug.
1. Check `Chat Only` if you prefer to use text input only, otherwise you can use both Speech and text.
1. Click the "Start" button to start the session; accept any microphone permissions dialog
1. You should see a `<< Session Started >>` message in the left-side output, after which you can speak to the app
1. **[NEW]** Customer information tagged with `###InfoToCustomer###` will automatically appear in the customer window
1. You can interrupt the chat at any time by speaking and completely stop the chat by using the "Stop" button
1. Optionally, you can use chat area to talk to the bot rather than speak to.
1. Assitant name will be displayed in the assistant name text input whenever an assistant is loaded.
1. To delete the specific message, enter the Id of the message to `Delete Item` which you can find in the chat history and click `Delete` that will strike sthough the idem.

## New Features

### Customer Window
- **Separate Customer Display**: The "Info to Customer" pane is now displayed in an independent browser window
- **Professional Interface**: Clean, customer-facing design suitable for customer-facing screens
- **Real-time Communication**: Automatically receives and displays information tagged with `###InfoToCustomer###`
- **Easy Access**: Click "Open Customer Window" button or navigate to `http://localhost:5173/customer.html`
- **Responsive Design**: Works on various screen sizes and can be moved to different monitors

For detailed information about the customer window, see [CUSTOMER_WINDOW.md](CUSTOMER_WINDOW.md).

## Known issues

1. Connection errors are not yet gracefully handled and looping error spew may be observed in script debug output. Please just refresh the web page if an error appears.
1. Voice selection is not yet supported.
1. More authentication mechanisms, including keyless support via Entra, will come in a future service update.

## Code description

This sample uses a custom client to simplify the usage of the realtime API. The client package is included  in this repo in the `rt-client-0.4.7.tgz` file. Check the  [AOAI Realtime Audio SDK](https://github.com/Azure-Samples/aoai-realtime-audio-sdk) to see if there is a newer version of the package if you need the latest version of the SDK.

The primary file demonstrating `/realtime` use is [src/main.ts](./src/main.ts); the first few functions demonstrate connecting to `/realtime` using the client, sending an inference configuration message, and then processing the send/receive of messages on the connection.

## Assistants

In this repo, we define an assistant as:

- has system prompt
- has tools (function calling definitions)

We use `function calling` feature to switch to other assistant. 

For example, the generic assistant has following function calling definition.

```typescript
{
    name: 'Assistant_MobileAssistant',
    description: 'Help user to answer mobile related question, such as billing, contract, etc.',
    parameters: {
        type: 'object',
        properties: {}
    },
    returns: async (arg: string) => "Assistant_MobileAssistant"
}
```

This function will be called whenever you asked about mobile phone related question. When we excute the function, instead of returns the function calling result back to the LLM, we send:

1. `SessionUpdateMessage` to switch the assistant.
1. `response.create` to let the model to continue the message.

### Function Calling 

To simplify the demo, we define the function calling metadata and the function defintion into one object. The `returns` property contains the anonymous function that returns the function calling result.

The below example is the `get weather` function, that always returns the weather as `40F and rainy` with the `location` name.

```typescript
{
    name: 'get_weather',
    description: 'get the weather of the locaion',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string', description: 'location for the weather' }
        }
    },
    returns: async (arg: string) => `the weather of ${JSON.parse(arg).location} is 40F and rainy`
}
```

