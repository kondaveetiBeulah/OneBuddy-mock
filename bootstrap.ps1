param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProjectId,

  [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $Apply) {
  throw 'This script deploys Firebase rules/indexes and writes seed documents. Review the project and seed-data.json, then rerun with -Apply.'
}

Push-Location $PSScriptRoot
try {
  if (-not (Test-Path -LiteralPath 'node_modules\firebase-admin')) {
    throw 'Dependencies are missing. Run npm install in firebase-bootstrap first.'
  }

  firebase deploy --config firebase.json --project $ProjectId --only firestore,database,storage
  if ($LASTEXITCODE -ne 0) { throw 'Firebase rules/index deployment failed.' }

  npm run import:seed -- --project $ProjectId --file seed-data.json --apply
  if ($LASTEXITCODE -ne 0) { throw 'Firestore seed import failed after rules/index deployment.' }

  Write-Host "Firestore rules/indexes, Realtime Database rules, Storage rules and reference seed deployed to $ProjectId."
}
finally {
  Pop-Location
}
