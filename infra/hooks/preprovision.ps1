# Load environment variables from .env file into azd environment

$ErrorActionPreference = "Stop"

$EnvFile = ".env"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Error: .env file not found. Please copy .env_sample to .env and configure your settings."
    exit 1
}

Write-Host "Loading environment variables from $EnvFile..."

# Read .env file and set azd environment variables
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
        return
    }
    
    # Parse key=value
    $parts = $line -split '=', 2
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        # Skip if key is empty
        if ([string]::IsNullOrWhiteSpace($key)) {
            return
        }
        
        # Remove surrounding double quotes if present (prevents azd from double-quoting values)
        if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        # Set the environment variable in azd
        # VITE_BING_API_KEY is optional, so we allow empty values
        if (-not [string]::IsNullOrWhiteSpace($value) -or $key -eq "VITE_BING_API_KEY") {
            Write-Host "Setting $key..."
            azd env set $key $value
        }
        else {
            Write-Host "Warning: $key is empty and will not be set (except VITE_BING_API_KEY which is optional)"
        }
    }
}

Write-Host "Environment variables loaded successfully."
