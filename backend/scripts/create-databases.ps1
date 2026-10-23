# Creates miniledger_db and miniledger_test, then writes backend/.env.
# The password is typed locally and is never printed.

$ErrorActionPreference = "Stop"

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
  Write-Host "Could not find psql at $psql"
  Write-Host "Install PostgreSQL or add psql to PATH, then run this script again."
  exit 1
}

$backendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $backendRoot

Write-Host ""
Write-Host "MiniLedger database setup"
Write-Host "You will be asked for the PostgreSQL password for user 'postgres'."
Write-Host "The password is hidden while you type and will not be printed."
Write-Host ""

$secure = Read-Host "PostgreSQL password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($plain)) {
  Write-Host "Password was empty. Setup cancelled."
  exit 1
}

$env:PGPASSWORD = $plain
$encoded = [uri]::EscapeDataString($plain)

function Invoke-Psql([string]$sql) {
  & $psql -w -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c $sql
  if ($LASTEXITCODE -ne 0) {
    throw "psql command failed."
  }
}

try {
  Write-Host "Checking PostgreSQL login..."
  Invoke-Psql "SELECT 1;" | Out-Null

  Write-Host "Ensuring databases exist..."
  $existing = & $psql -w -U postgres -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT datname FROM pg_database WHERE datname IN ('miniledger_db','miniledger_test')"
  if ($existing -notmatch 'miniledger_db') {
    Invoke-Psql "CREATE DATABASE miniledger_db;"
  }
  if ($existing -notmatch 'miniledger_test') {
    Invoke-Psql "CREATE DATABASE miniledger_test;"
  }

  $jwt = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
  $envPath = Join-Path $backendRoot ".env"
  $contents = @"
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:$encoded@localhost:5432/miniledger_db
TEST_DATABASE_URL=postgresql://postgres:$encoded@localhost:5432/miniledger_test
JWT_SECRET=$jwt
MOCK_OTP_ENABLED=true
UPLOAD_DIR=uploads
MAX_UPLOAD_BYTES=5242880
JWT_EXPIRES_IN=7d
OTP_TTL_SECONDS=300
OTP_RESEND_SECONDS=60
OTP_MAX_ATTEMPTS=5
"@
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($envPath, $contents, $utf8NoBom)
  Write-Host "Created or updated backend/.env locally. The file is gitignored."
  Write-Host "Databases miniledger_db and miniledger_test are ready."
}
catch {
  Write-Host "Database setup failed. Check that PostgreSQL is running and the password is correct."
  Write-Host $_.Exception.Message
  exit 1
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  $plain = $null
  $encoded = $null
  $secure = $null
}

Write-Host "Next: npm run migrate"
