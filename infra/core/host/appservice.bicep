param name string
param location string = resourceGroup().location
param tags object = {}

param appServicePlanName string
param runtimeName string
param runtimeVersion string
param appCommandLine string = ''

@secure()
param environmentVariables object = {}

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
      appSettings: [for key in objectKeys(environmentVariables): {
        name: key
        value: environmentVariables[key]
      }]
    }
  }
}

output uri string = 'https://${appService.properties.defaultHostName}'
output name string = appService.name
output id string = appService.id
