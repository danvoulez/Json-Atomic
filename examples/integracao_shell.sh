# 4. Exemplo de integração shell (bash/curl)

API_URL="http://localhost:8000"
API_KEY="changeme"

# Append atomic.json
curl -X POST "$API_URL/append" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@spans/atomic.json"

# Scan ledger
curl -X GET "$API_URL/scan" \
  -H "x-api-key: $API_KEY"

# Query por trace_id
curl -X GET "$API_URL/query?trace_id=abc-123" \
  -H "x-api-key: $API_KEY"