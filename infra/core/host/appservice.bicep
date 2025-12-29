param name string
param location string = resourceGroup().location
param tags object = {}

param appServicePlanName string
param runtimeName string
param runtimeVersion string
param appCommandLine string = ''

@secure()
param environmentVariables object = {}

@description('Enable Entra ID authentication (App Service Authentication)')
param enableAadAuth bool = false

@description('Tenant ID or domain to enforce sign-in (for Microsoft employees use fdpo.microsoft.com)')
param aadTenantId string = ''

@description('Application (client) ID for Entra ID authentication')
param aadClientId string = ''

@secure()
@description('Client secret for the Entra ID application registration')
param aadClientSecret string = ''

@description('Optional list of allowed audiences for token validation')
param aadAllowedAudiences array = []

var baseAppSettings = [for key in objectKeys(environmentVariables): {
  name: key
  value: environmentVariables[key]
}]

var authSecretSettings = aadClientSecret == '' ? [] : [
  {
    name: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
    value: aadClientSecret
  }
]

var mergedAppSettings = concat(baseAppSettings, authSecretSettings)

var aadTenantSegment = aadTenantId == '' ? tenant().tenantId : aadTenantId

var aadIssuer = 'https://login.microsoftonline.com/${aadTenantSegment}/v2.0'

var aadRegistration = aadClientSecret == '' ? {
  clientId: aadClientId
  openIdIssuer: aadIssuer
} : union({
  clientId: aadClientId
  openIdIssuer: aadIssuer
}, {
  clientSecretSettingName: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'
})

var allowedAudiences = length(aadAllowedAudiences) > 0 ? aadAllowedAudiences : (aadClientId == '' ? [] : [
  aadClientId
])

var loginParameters = (aadTenantId != '' && contains(aadTenantId, '.')) ? [
  'domain_hint=${aadTenantId}'
] : []

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: '${runtimeName}|${runtimeVersion}'
      appCommandLine: appCommandLine
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: mergedAppSettings
    }
    authSettingsV2: if (enableAadAuth) {
      platform: {
        enabled: true
        runtimeVersion: '~1'
      }
      globalValidation: {
        requireAuthentication: true
        unauthenticatedClientAction: 'RedirectToLoginPage'
      }
      identityProviders: {
        azureActiveDirectory: {
          enabled: true
          login: {
            loginParameters: loginParameters
          }
          registration: aadRegistration
          validation: {
            allowedAudiences: allowedAudiences
          }
        }
      }
      login: {
        tokenStore: {
          enabled: true
        }
      }
    }
  }
}

output uri string = 'https://${appService.properties.defaultHostName}'
output name string = appService.name
output id string = appService.id
