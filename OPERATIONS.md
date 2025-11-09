# Operations Guide

This guide covers production operations for JsonAtomic/LogLineOS.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
4. [Key Management](#key-management)
5. [Workflows](#workflows)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Backup & Recovery](#backup--recovery)

## Quick Start

### Installation

```bash
# NPM package
npm install logline-core

# Docker
docker pull jsonatomic/core:1.1.0

# From source
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic
npm install
npm run build
```

### Basic Usage

```bash
# Generate keys
logline-cli generate-keys > keys.txt

# Export keys (DO NOT COMMIT)
export SIGNING_KEY_HEX="<private_key>"
export PUBLIC_KEY_HEX="<public_key>"

# Sign an atomic
logline-cli sign atomic.json --output json > signed.json

# Append to ledger
cat signed.json >> data/ledger.jsonl

# Verify ledger
logline-cli verify --ledger data/ledger.jsonl --check-prev-chain
```

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     JsonAtomic System                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   CLI    │  │   API    │  │Playground│  │ Agents  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │              │             │      │
│       └─────────────┴──────────────┴─────────────┘      │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │    Core Library     │                    │
│              │  • Crypto           │                    │
│              │  • Canonical        │                    │
│              │  • Validator        │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │   Ledger (NDJSON)   │                    │
│              │  • Append-only      │                    │
│              │  • Chain-validated  │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Writing Atomics:**
```
1. Create atomic JSON
2. Canonicalize → Hash (BLAKE3 + context)
3. Sign with Ed25519 → Structured signature
4. Append to ledger (NDJSON)
```

**Reading/Verifying:**
```
1. Stream ledger line-by-line
2. Parse JSON
3. Validate schema
4. Recompute hash → Compare
5. Verify signature (if present)
6. Validate prev chain (if enabled)
```

## Deployment

### Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  jsonatomic:
    image: jsonatomic/core:1.1.0
    container_name: jsonatomic
    restart: unless-stopped
    
    # Security
    user: "1001:1001"
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    
    # Environment
    environment:
      - NODE_ENV=production
      - LEDGER_PATH=/app/data/ledger.jsonl
      - PUBLIC_KEY_HEX=${PUBLIC_KEY_HEX}
      # Add SIGNING_KEY_HEX only if signing is needed
    
    # Volumes
    volumes:
      - ./data:/app/data:rw
      - /tmp:/tmp:rw
    
    # Ports
    ports:
      - "8000:8000"  # API
      - "9090:9090"  # Metrics
    
    # Resources
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
    
    # Health check
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  data:
    driver: local
```

**Deploy:**
```bash
# Set environment variables
export PUBLIC_KEY_HEX="..."
export SIGNING_KEY_HEX="..."  # Optional

# Start
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify
logline-cli verify --ledger ./data/ledger.jsonl
```

### Kubernetes Deployment

**ConfigMap for public key:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jsonatomic-config
data:
  PUBLIC_KEY_HEX: "<your_public_key>"
```

**Secret for private key:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jsonatomic-secret
type: Opaque
stringData:
  SIGNING_KEY_HEX: "<your_private_key>"
```

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jsonatomic
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jsonatomic
  template:
    metadata:
      labels:
        app: jsonatomic
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: jsonatomic
        image: jsonatomic/core:1.1.0
        imagePullPolicy: Always
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
              - ALL
          readOnlyRootFilesystem: true
        env:
        - name: PUBLIC_KEY_HEX
          valueFrom:
            configMapKeyRef:
              name: jsonatomic-config
              key: PUBLIC_KEY_HEX
        - name: SIGNING_KEY_HEX
          valueFrom:
            secretKeyRef:
              name: jsonatomic-secret
              key: SIGNING_KEY_HEX
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 9090
          name: metrics
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: jsonatomic-data
      - name: tmp
        emptyDir: {}
```

## Key Management

### Key Generation

```bash
# Generate new key pair
logline-cli generate-keys

# Output:
# Private Key (SIGNING_KEY_HEX):
# <64_hex_chars>
# Public Key (PUBLIC_KEY_HEX):
# <64_hex_chars>
```

### Key Storage

**Development:**
```bash
# .env file (DO NOT COMMIT)
SIGNING_KEY_HEX=<private>
PUBLIC_KEY_HEX=<public>
```

**Production:**
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Hardware Security Module (HSM)** - future support

### Key Rotation

1. **Generate new key pair:**
   ```bash
   logline-cli generate-keys > new-keys.txt
   ```

2. **Update configuration** with new keys

3. **Create rotation atomic:**
   ```json
   {
     "entity_type": "agent",
     "intent": "key_rotation",
     "this": "/system/keys",
     "did": {
       "actor": "admin@example.com",
       "action": "rotate_signing_key"
     },
     "metadata": {
       "trace_id": "<uuid>",
       "created_at": "<timestamp>"
     },
     "payload": {
       "old_public_key": "<old_key>",
       "new_public_key": "<new_key>",
       "reason": "Scheduled rotation"
     }
   }
   ```

4. **Sign with both keys** (if multi-sig supported)

5. **Update verifiers** to accept both keys temporarily

6. **Phase out old key** after grace period

## Workflows

### Creating and Signing an Atomic

```bash
# 1. Create atomic JSON
cat > atomic.json <<EOF
{
  "schema_version": "1.1.0",
  "entity_type": "function",
  "intent": "run_code",
  "this": "/functions/hello",
  "did": {
    "actor": "user@example.com",
    "action": "create"
  },
  "metadata": {
    "trace_id": "$(uuidgen)",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "input": {
    "content": "console.log('Hello, World!')"
  }
}
EOF

# 2. Sign
logline-cli sign atomic.json --output json > signed.json

# 3. Verify
logline-cli lint signed.json
logline-cli hash signed.json

# 4. Append to ledger
cat signed.json >> data/ledger.jsonl
```

### Verifying Ledger Integrity

```bash
# Basic verification
logline-cli verify --ledger data/ledger.jsonl

# With chain validation
logline-cli verify --ledger data/ledger.jsonl --check-prev-chain --verbose

# Filter by trace ID
logline-cli verify --ledger data/ledger.jsonl --trace-id <uuid>

# JSON output
logline-cli verify --ledger data/ledger.jsonl --output json > verification-report.json
```

### Query by Trace ID

```bash
# Find all atomics for a trace
logline-cli query --trace-id <uuid> --ledger data/ledger.jsonl

# NDJSON output (one per line)
logline-cli query --trace-id <uuid> --output ndjson | jq .
```

### End-to-End Example

```bash
#!/bin/bash
set -e

# Generate keys (once)
logline-cli generate-keys > keys.txt
export SIGNING_KEY_HEX=$(grep "Private Key" keys.txt | awk '{print $NF}')
export PUBLIC_KEY_HEX=$(grep "Public Key" keys.txt | awk '{print $NF}')

# Create atomic
TRACE_ID=$(uuidgen)
cat > atomic.json <<EOF
{
  "schema_version": "1.1.0",
  "entity_type": "law",
  "intent": "law_test",
  "this": "/laws/rate_limit",
  "did": {"actor": "system", "action": "test"},
  "metadata": {
    "trace_id": "$TRACE_ID",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  },
  "payload": {
    "max_requests": 100,
    "window_seconds": 60
  }
}
EOF

# Sign and append
logline-cli sign atomic.json | tee signed.json >> data/ledger.jsonl

# Verify
logline-cli verify --ledger data/ledger.jsonl --check-prev-chain

# Query
logline-cli query --trace-id $TRACE_ID --output json

echo "✅ Workflow complete!"
```

## Monitoring

### Metrics

**Prometheus metrics (port 9090):**
```
# Ledger stats
ledger_total_atomics
ledger_valid_signatures
ledger_invalid_signatures
ledger_unsigned_atomics

# Performance
hash_computation_duration_seconds
signature_verification_duration_seconds
ledger_append_duration_seconds

# Errors
verification_errors_total{code="HASH_MISMATCH"}
verification_errors_total{code="INVALID_SIGNATURE"}
verification_errors_total{code="PREV_MISMATCH"}
```

**Grafana Dashboard:**
- Total atomics over time
- Signature verification rate
- Error rate by type
- Latency percentiles (p50, p95, p99)

### Logging

**Structured logs (JSON):**
```json
{
  "level": "info",
  "msg": "Atomic signed",
  "trace_id": "<uuid>",
  "hash": "<hash>",
  "timestamp": "2024-11-09T00:00:00Z"
}
```

**Log levels:**
- `error`: Verification failures, system errors
- `warn`: Unsigned atomics, policy violations
- `info`: Normal operations (sign, verify, query)
- `debug`: Detailed crypto operations

## Troubleshooting

### Hash Mismatch

**Symptom:** `HASH_MISMATCH` error during verification

**Causes:**
- Atomic modified after signing
- Different canonicalization implementation
- Wrong schema version (1.0.0 vs 1.1.0)

**Resolution:**
```bash
# Recompute hash
logline-cli hash atomic.json

# Compare with stored hash
cat atomic.json | jq .hash
```

### Signature Verification Failure

**Symptom:** `INVALID_SIGNATURE` error

**Causes:**
- Wrong public key
- Signature tampered
- Hash mismatch (verify hash first)

**Resolution:**
```bash
# Check public key matches
cat atomic.json | jq .signature.public_key

# Verify hash first
logline-cli verify --ledger ledger.jsonl --verbose
```

### Prev Chain Break

**Symptom:** `PREV_MISMATCH` or `MISSING_PREV` error

**Causes:**
- Missing atomic in chain
- Ledger corruption
- Out-of-order appends

**Resolution:**
```bash
# Find break point
logline-cli verify --ledger ledger.jsonl --check-prev-chain --stop-on-error

# Check for missing atomics
# Line N-1 hash should match Line N prev field
```

## Backup & Recovery

### Backup Strategy

**Daily full backup:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/backups/$DATE

# Create backup
mkdir -p $BACKUP_DIR
cp data/ledger.jsonl $BACKUP_DIR/
gzip $BACKUP_DIR/ledger.jsonl

# Encrypt
gpg --encrypt --recipient admin@example.com $BACKUP_DIR/ledger.jsonl.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/ledger.jsonl.gz.gpg s3://backups/jsonatomic/$DATE/

# Verify
logline-cli verify --ledger data/ledger.jsonl --check-prev-chain
```

**Incremental backup:**
```bash
# Last N lines only
tail -n 1000 data/ledger.jsonl > incremental-backup.jsonl
```

### Recovery

**From backup:**
```bash
# Download
aws s3 cp s3://backups/jsonatomic/20241109/ledger.jsonl.gz.gpg .

# Decrypt
gpg --decrypt ledger.jsonl.gz.gpg > ledger.jsonl.gz
gunzip ledger.jsonl.gz

# Verify integrity
logline-cli verify --ledger ledger.jsonl --check-prev-chain

# Restore
cp ledger.jsonl data/ledger.jsonl
```

**Partial recovery (after corruption):**
```bash
# Find last valid atomic
logline-cli verify --ledger ledger.jsonl --check-prev-chain --stop-on-error

# Extract valid portion (up to line N)
head -n N ledger.jsonl > ledger-recovered.jsonl

# Verify
logline-cli verify --ledger ledger-recovered.jsonl
```

## Production Checklist

- [ ] Keys stored in secure vault (not env vars in production)
- [ ] File system permissions locked down
- [ ] TLS enabled for all APIs
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Backup automation running
- [ ] Backup recovery tested
- [ ] Log aggregation configured
- [ ] Security scanning in CI/CD
- [ ] Incident response plan documented
- [ ] On-call rotation established

## Support

- **Documentation**: See README.md, THREAT_MODEL.md
- **Issues**: https://github.com/danvoulez/JsonAtomic/issues
- **Discussions**: https://github.com/danvoulez/JsonAtomic/discussions
