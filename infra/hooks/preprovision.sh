#!/bin/bash
# Load environment variables from .env file into azd environment

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found. Please copy .env_sample to .env and configure your settings."
    exit 1
fi

echo "Loading environment variables from $ENV_FILE..."

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

    # Set the environment variable in azd
    # VITE_BING_API_KEY is optional, so we allow empty values
    if [[ -n "$value" || "$key" == "VITE_BING_API_KEY" ]]; then
        echo "Setting $key..."
        azd env set "$key" "$value"
    else
        echo "Warning: $key is empty and will not be set (except VITE_BING_API_KEY which is optional)"
    fi
done < "$ENV_FILE"

echo "Environment variables loaded successfully."
