# 4. Exemplo de integração externa em Python usando o REST API do LogLineOS

import requests

API_URL = "http://localhost:8000"
API_KEY = "changeme"

atomic = {
    "entity_type": "function",
    "intent": "run_code",
    "this": "add",
    "did": { "actor": "python-client", "action": "run_code" },
    "input": { "args": [1, 2] },
    "metadata": {
        "trace_id": "py-demo-123e",
        "created_at": "2025-11-07T13:00:00Z"
    }
}

# Append
resp = requests.post(
    f"{API_URL}/append",
    headers={"x-api-key": API_KEY, "Content-Type": "application/json"},
    json=atomic
)
print("Append result:", resp.json())

# Scan
resp = requests.get(
    f"{API_URL}/scan",
    headers={"x-api-key": API_KEY}
)
print("Scan result:", resp.json())

# Query
resp = requests.get(
    f"{API_URL}/query?trace_id=py-demo-123e",
    headers={"x-api-key": API_KEY}
)
print("Query result:", resp.json())