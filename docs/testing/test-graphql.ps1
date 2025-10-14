# GraphQL API Testing Script
# Tests Services and Assets GraphQL operations

$SUPABASE_URL = "https://nchzfhijvbwygqnxzten.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaHpmaGlqdmJ3eWdxbnh6dGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDQ2NDgsImV4cCI6MjA3MzY4MDY0OH0.TdN9ImImJTjDn4bbUOr3A23Gcw3hFeA0kObpKzQmubE"
$GRAPHQL_ENDPOINT = "$SUPABASE_URL/graphql/v1"

Write-Host "🧪 Testing GraphQL Endpoints" -ForegroundColor Cyan
Write-Host "Endpoint: $GRAPHQL_ENDPOINT" -ForegroundColor Gray
Write-Host ""

# Test 1: Query Service Categories
Write-Host "📋 Test 1: Query Service Categories" -ForegroundColor Yellow
$query1 = '{"query":"query GetServiceCategories { service_categoriesCollection(first: 5) { edges { node { id name description icon is_active } } } }"}'

$response1 = curl.exe -X POST $GRAPHQL_ENDPOINT `
  -H "Content-Type: application/json" `
  -H "apikey: $ANON_KEY" `
  -d $query1

Write-Host "Response:" -ForegroundColor Green
Write-Host $response1
Write-Host ""

# Test 2: Query Services
Write-Host "📋 Test 2: Query Services" -ForegroundColor Yellow
$query2 = '{"query":"query GetServices { servicesCollection(first: 5) { edges { node { id name description status is_requestable estimated_delivery_days } } } }"}'

$response2 = curl.exe -X POST $GRAPHQL_ENDPOINT `
  -H "Content-Type: application/json" `
  -H "apikey: $ANON_KEY" `
  -d $query2

Write-Host "Response:" -ForegroundColor Green
Write-Host $response2
Write-Host ""

# Test 3: Query Assets
Write-Host "📋 Test 3: Query Assets" -ForegroundColor Yellow
$query3 = '{"query":"query GetAssets { assetsCollection(first: 5) { edges { node { id name asset_tag hostname ip_address status criticality } } } }"}'

$response3 = curl.exe -X POST $GRAPHQL_ENDPOINT `
  -H "Content-Type: application/json" `
  -H "apikey: $ANON_KEY" `
  -d $query3

Write-Host "Response:" -ForegroundColor Green
Write-Host $response3
Write-Host ""

# Test 4: Query Asset Types
Write-Host "📋 Test 4: Query Asset Types" -ForegroundColor Yellow
$query4 = '{"query":"query GetAssetTypes { asset_typesCollection(first: 5) { edges { node { id name description icon is_active } } } }"}'

$response4 = curl.exe -X POST $GRAPHQL_ENDPOINT `
  -H "Content-Type: application/json" `
  -H "apikey: $ANON_KEY" `
  -d $query4

Write-Host "Response:" -ForegroundColor Green
Write-Host $response4
Write-Host ""

Write-Host "✅ All GraphQL tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Run 'npm run dev' and navigate to:" -ForegroundColor Cyan
Write-Host "   - http://localhost:3000/services (Services)" -ForegroundColor White
Write-Host "   - http://localhost:3000/admin/catalog (Service Catalog)" -ForegroundColor White  
Write-Host "   - http://localhost:3000/assets (Assets)" -ForegroundColor White
