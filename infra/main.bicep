targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Id of the user or app to assign application roles')
param principalId string = ''

@description('Enable Entra ID authentication for the web app (string: "true" or "false")')
param enableAadAuth string = 'false'

// Convert string parameter to boolean for downstream use
var enableAadAuthBool = toLower(enableAadAuth) == 'true'

@description('Entra ID tenant ID or domain')
param aadTenantId string = ''

@description('Client ID of the Entra ID application configured for authentication')
param aadClientId string = ''

@secure()
@description('Client secret for the Entra ID application registration')
param aadClientSecret string = ''

@description('Optional list of allowed audiences for token validation')
param aadAllowedAudiences array = []

// Tags that should be applied to all resources.
var tags = {
  'azd-env-name': environmentName
}

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

// The application backend
// Note: Dependencies and build are handled by azd prepackage hooks in azure.yaml
module web './core/host/appservice.bicep' = {
  name: 'web'
  scope: rg
  params: {
    name: 'app-${environmentName}'
    location: location
    tags: union(tags, { 'azd-service-name': 'web' })
    appServicePlanName: 'plan-${environmentName}'
    runtimeName: 'node'
    runtimeVersion: '20-lts'
    // Start command assumes dist/ folder exists from prepackage build
    appCommandLine: 'node server.js'
    enableAadAuth: enableAadAuthBool
    aadTenantId: aadTenantId
    aadClientId: aadClientId
    aadClientSecret: aadClientSecret
    aadAllowedAudiences: aadAllowedAudiences
    environmentVariables: {
      VITE_AOAI_ENDPOINT: aoaiEndpoint
      VITE_AOAI_API_KEY: aoaiApiKey
      VITE_AOAI_DEPLOYMENT: aoaiDeployment
      VITE_BING_API_KEY: bingApiKey
    }
  }
}

// Azure OpenAI parameters - these will be provided via .env or azd env
@secure()
param aoaiEndpoint string = ''
@secure()
param aoaiApiKey string = ''
param aoaiDeployment string = ''
@secure()
param bingApiKey string = ''

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output WEB_URI string = web.outputs.uri
