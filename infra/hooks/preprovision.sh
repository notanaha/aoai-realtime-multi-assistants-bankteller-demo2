#!/bin/bash
# Load environment variables from .env file into azd environment

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Please copy .env_sample to .env and configure your settings."
    exit 1
fi

echo "Loading environment variables from $ENV_FILE..."

# Function to map .env variable names to Bicep parameter names (camelCase)
map_to_bicep_param() {
    local key="$1"
    case "$key" in
        "ENABLE_AAD_AUTH") echo "enableAadAuth" ;;
        "AAD_TENANT_ID") echo "aadTenantId" ;;
        "AAD_CLIENT_ID") echo "aadClientId" ;;
        "AAD_CLIENT_SECRET") echo "aadClientSecret" ;;
        *) echo "$key" ;;
    esac
}

# Read .env file and set azd environment variables
# Skip empty lines and comments
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Trim whitespace from key and value
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Skip if key is empty after trimming
    if [[ -z "$key" ]]; then
        continue
    fi
    
    # Remove surrounding double quotes if present
    if [[ ${value:0:1} == '"' && ${value: -1} == '"' ]]; then
        value=${value:1:${#value}-2}
    fi

    # Map to Bicep parameter name
    bicep_key=$(map_to_bicep_param "$key")

    # Set the environment variable in azd
    # VITE_BING_API_KEY is optional, so we allow empty values
    if [[ -n "$value" || "$key" == "VITE_BING_API_KEY" ]]; then
        echo "Setting $bicep_key..."
        azd env set "$bicep_key" "$value"
    else
        echo "Warning: $key is empty and will not be set (except VITE_BING_API_KEY which is optional)"
    fi
done < "$ENV_FILE"

echo "Environment variables loaded successfully."
