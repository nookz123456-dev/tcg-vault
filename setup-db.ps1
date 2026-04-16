$supabaseUrl = "https://hezbxloxsgqwbondebjt.supabase.co"
$anonKey = "sb_publishable_Y4STzv-8E-iXcivRYswjgQ_H1rFRXdI"

# Read the schema SQL
$sql = Get-Content "C:\Users\suwij\.openclaw\workspace\tcg-vault\supabase\schema.sql" -Raw

$headers = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $anonKey"
    "Prefer" = "return=representation"
}

# Try to create tables via REST API
# First, let's check if we can reach the Supabase instance
Write-Host "Testing Supabase connection..."
try {
    $testRes = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers $headers -Method GET -ErrorAction Stop
    Write-Host "Connection OK: $($testRes | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Connection test: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}

# List existing tables
Write-Host "`nChecking existing tables..."
try {
    $tables = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers $headers -Method GET
    Write-Host "Tables: $($tables | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error listing tables: $($_.Exception.Message)"
}

Write-Host "`nDone! You need to run the schema SQL in Supabase Dashboard manually."
Write-Host "Go to: $supabaseUrl/project/default/sql"