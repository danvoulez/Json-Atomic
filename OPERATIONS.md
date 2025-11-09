# Operations Guide

## JSON✯Atomic v1.1.0

This guide provides operational procedures for running, monitoring, and maintaining a JSON✯Atomic deployment.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Common Workflows](#common-workflows)
4. [Monitoring](#monitoring)
5. [Key Management](#key-management)
6. [Backup & Recovery](#backup--recovery)
7. [Troubleshooting](#troubleshooting)
8. [Security Operations](#security-operations)

---

## Installation

### Prerequisites

- **Node.js**: v20.x or higher
- **Deno**: v1.x or higher (for CLI)
- **Docker**: v24.x or higher (optional)
- **Storage**: Minimum 1GB free space (grows with ledger)

### Core Library

```bash
# Install from npm
npm install logline-core@1.1.0

# Or add to package.json
{
  "dependencies": {
    "logline-core": "^1.1.0"
  }
}
```

### CLI Tools

```bash
# Clone repository
git clone https://github.com/danvoulez/JsonAtomic.git
cd JsonAtomic

# Make CLI executable (Unix/Mac)
chmod +x tools/cli/logline-cli.ts

# Add alias to shell profile
echo 'alias logline="deno run --allow-read --allow-write --allow-env tools/cli/logline-cli.ts"' >> ~/.bashrc
source ~/.bashrc
```

### Docker Deployment

```bash
# Build image
docker build -t jsonatomic:1.1.0 .

# Run with read-only filesystem (recommended)
docker run -d \
  --name jsonatomic \
  --read-only \
  -v /path/to/data:/app/data \
  --tmpfs /tmp \
  --user 1001:1001 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -p 8000:8000 \
  jsonatomic:1.1.0
```

---

## Configuration

### Environment Variables

```bash
# Signing key (keep secret!)
export SIGNING_KEY_HEX="your-private-key-here"

# Public key for verification
export PUBLIC_KEY_HEX="your-public-key-here"

# Ledger file path
export LEDGER_PATH="./data/ledger.jsonl"

# Optional: Node environment
export NODE_ENV="production"
```

### Configuration File

Create `config/production.json`:

```json
{
  "ledger": {
    "path": "/app/data/ledger.jsonl",
    "maxLineSize": 10485760,
    "backupEnabled": true,
    "backupPath": "/app/backups"
  },
  "verification": {
    "enabled": true,
    "stopOnError": false,
    "verbose": false
  },
  "security": {
    "executorEnabled": false,
    "requireSignatures": true,
    "allowedSigners": []
  }
}
```

---

## Common Workflows

### 1. Generate Keys

```bash
# Generate new Ed25519 key pair
logline generate-keys

# Output:
# Generated Ed25519 Key Pair:
#
# Private Key (SIGNING_KEY_HEX):
# a1b2c3d4...
#
# Public Key (PUBLIC_KEY_HEX):
# e5f6g7h8...
#
# ⚠️  Keep the private key secure!

# Store in environment
export SIGNING_KEY_HEX="a1b2c3d4..."
export PUBLIC_KEY_HEX="e5f6g7h8..."

# Or store in secure vault (recommended)
echo "a1b2c3d4..." | vault kv put secret/jsonatomic/signing-key value=-
```

### 2. Create and Sign Atomic

Create `atomic.json`:

```json
{
  "schema_version": "1.1.0",
  "entity_type": "file",
  "this": "/documents/contract.pdf",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "did": {
    "actor": "did:example:alice",
    "action": "create"
  },
  "metadata": {
    "created_at": "2025-11-09T12:00:00Z"
  }
}
```

Sign it:

```bash
# Sign atomic
logline sign \
  --input atomic.json \
  --private-key $SIGNING_KEY_HEX \
  --output json > atomic-signed.json

# View result
cat atomic-signed.json
```

### 3. Verify Ledger

```bash
# Basic verification
logline verify --ledger data/ledger.jsonl

# With public key verification
logline verify \
  --ledger data/ledger.jsonl \
  --key $PUBLIC_KEY_HEX \
  --verbose

# Filter by trace_id
logline verify \
  --ledger data/ledger.jsonl \
  --trace-id "550e8400-e29b-41d4-a716-446655440000"

# Stop on first error (for debugging)
logline verify \
  --ledger data/ledger.jsonl \
  --stop-on-error \
  --verbose

# JSON output for automation
logline verify \
  --ledger data/ledger.jsonl \
  --output json > verification-results.json
```

### 4. Query Atomics

```bash
# Query by trace_id
logline query \
  --ledger data/ledger.jsonl \
  --trace-id "550e8400-e29b-41d4-a716-446655440000" \
  --output json

# Get statistics
logline stats \
  --ledger data/ledger.jsonl \
  --output table
```

### 5. Compute Hash

```bash
# Compute hash of atomic
logline hash --input atomic.json

# Output:
# {"hash":"a1b2c3d4e5f6..."}
```

---

## Monitoring

### Health Checks

```bash
# Check if service is healthy (if running as server)
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-09T12:00:00Z"}
```

### Metrics

Monitor these key metrics:

1. **Ledger Size**: Track growth rate
   ```bash
   ls -lh data/ledger.jsonl
   ```

2. **Verification Performance**: Time to verify
   ```bash
   time logline verify --ledger data/ledger.jsonl
   ```

3. **Error Rate**: Track invalid entries
   ```bash
   logline verify --output json | jq '.invalid'
   ```

4. **Fork Detection**: Check for forks
   ```bash
   logline verify --output json | jq '.forks'
   ```

### Logging

Enable verbose logging:

```bash
export LOG_LEVEL=debug
export LOG_FORMAT=json

# Or use CLI verbose flag
logline verify --verbose --ledger data/ledger.jsonl
```

### Alerts

Set up alerts for:

- Verification failures
- Fork detection
- Ledger corruption
- Key expiration (when rotation implemented)
- Disk space < 10%

Example Prometheus alert:

```yaml
groups:
  - name: jsonatomic
    rules:
      - alert: VerificationFailure
        expr: jsonatomic_verification_invalid_total > 0
        for: 5m
        annotations:
          summary: "Ledger verification failed"
```

---

## Key Management

### Key Generation

```bash
# Generate keys
logline generate-keys > keys.json

# Extract keys
PRIVATE_KEY=$(jq -r '.privateKey' keys.json)
PUBLIC_KEY=$(jq -r '.publicKey' keys.json)

# Store securely (example with Vault)
vault kv put secret/jsonatomic/keys \
  private_key="$PRIVATE_KEY" \
  public_key="$PUBLIC_KEY"

# Delete local copy
shred -u keys.json
```

### Key Storage

**Development:**
- Environment variables
- `.env` file (gitignored)

**Production:**
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Hardware Security Module (HSM)

**DO NOT:**
- ❌ Commit keys to git
- ❌ Store in plaintext
- ❌ Share via email/chat
- ❌ Use same key across environments

### Key Rotation

**Manual Process (until automated):**

1. Generate new key pair
2. Sign new atomic with new key
3. Include reference to old key in atomic metadata
4. Update configuration with new public key
5. Archive old key securely
6. Update documentation

```bash
# 1. Generate new key
logline generate-keys > new-keys.json

# 2. Extract new keys
NEW_PRIVATE=$(jq -r '.privateKey' new-keys.json)
NEW_PUBLIC=$(jq -r '.publicKey' new-keys.json)

# 3. Create rotation atomic
cat > rotation.json <<EOF
{
  "schema_version": "1.1.0",
  "entity_type": "law",
  "this": "key-rotation",
  "trace_id": "$(uuidgen)",
  "did": {
    "actor": "did:system:keymgmt",
    "action": "rotate"
  },
  "metadata": {
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "old_public_key": "$PUBLIC_KEY_HEX",
    "new_public_key": "$NEW_PUBLIC"
  }
}
EOF

# 4. Sign with old key
logline sign --input rotation.json \
  --private-key $SIGNING_KEY_HEX \
  --output json > rotation-signed.json

# 5. Update environment
export SIGNING_KEY_HEX="$NEW_PRIVATE"
export PUBLIC_KEY_HEX="$NEW_PUBLIC"

# 6. Verify rotation worked
logline hash --input rotation-signed.json
```

---

## Backup & Recovery

### Backup Strategy

**Daily Backups:**

```bash
#!/bin/bash
# backup-ledger.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/jsonatomic"
LEDGER_FILE="data/ledger.jsonl"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy ledger with timestamp
cp "$LEDGER_FILE" "$BACKUP_DIR/ledger-$DATE.jsonl"

# Compress
gzip "$BACKUP_DIR/ledger-$DATE.jsonl"

# Verify backup
gunzip -c "$BACKUP_DIR/ledger-$DATE.jsonl.gz" | \
  logline verify --ledger /dev/stdin --output json

# Keep last 30 days
find "$BACKUP_DIR" -name "ledger-*.jsonl.gz" -mtime +30 -delete

echo "Backup complete: ledger-$DATE.jsonl.gz"
```

Add to crontab:

```bash
0 2 * * * /path/to/backup-ledger.sh
```

**Off-site Backups:**

```bash
# Upload to S3
aws s3 cp ledger-$DATE.jsonl.gz \
  s3://my-bucket/backups/jsonatomic/

# Or to Azure Blob Storage
az storage blob upload \
  --container backups \
  --file ledger-$DATE.jsonl.gz \
  --name jsonatomic/ledger-$DATE.jsonl.gz
```

### Disaster Recovery

**Scenario 1: Ledger Corruption**

```bash
# 1. Stop all writes
systemctl stop jsonatomic

# 2. Verify current state
logline verify --ledger data/ledger.jsonl --output json > verification.json

# 3. Identify corruption point
jq '.results[] | select(.valid == false)' verification.json

# 4. Restore from last good backup
cp /backups/ledger-20251108.jsonl.gz .
gunzip ledger-20251108.jsonl.gz
mv ledger-20251108.jsonl data/ledger.jsonl

# 5. Verify restored ledger
logline verify --ledger data/ledger.jsonl

# 6. Restart service
systemctl start jsonatomic
```

**Scenario 2: Key Compromise**

```bash
# 1. Immediately revoke old key (update config)
# 2. Generate new key pair
logline generate-keys

# 3. Create revocation atomic
# 4. Re-sign all recent atomics with new key
# 5. Audit ledger for unauthorized entries
# 6. Notify affected parties
```

**Recovery Time Objectives:**

- **RTO**: 1 hour (time to recover)
- **RPO**: 1 day (acceptable data loss)

---

## Troubleshooting

### Common Issues

#### 1. Verification Fails

**Symptom:**
```
❌ Error [HASH_MISMATCH]: Computed hash does not match stored hash
```

**Diagnosis:**
```bash
# Check if using v1.0.0 format
logline verify --ledger data/ledger.jsonl --verbose
```

**Solution:**
- Migrate to v1.1.0 format (see MIGRATION.md)
- Ensure domain separation is used
- Check for manual edits to ledger

#### 2. Fork Detected

**Symptom:**
```
🔀 Forks detected: 1
   - 550e8400-e29b-41d4-a716-446655440000: 2 branches
```

**Diagnosis:**
```bash
logline verify \
  --trace-id "550e8400-e29b-41d4-a716-446655440000" \
  --output json
```

**Solution:**
- Identify canonical chain
- Remove or mark forked entries
- Investigate source of fork (multiple writers?)

#### 3. Out of Memory

**Symptom:**
```
FATAL ERROR: Reached heap limit
```

**Diagnosis:**
- Check ledger file size
- Check line sizes

**Solution:**
```bash
# Streaming verification (no memory issue)
logline verify --ledger data/ledger.jsonl

# If specific lines are too large
logline verify --ledger data/ledger.jsonl --verbose | grep LINE_TOO_LARGE
```

#### 4. Signature Verification Fails

**Symptom:**
```
❌ Error [INVALID_SIGNATURE]: Signature verification failed
```

**Diagnosis:**
```bash
# Check public key
echo $PUBLIC_KEY_HEX

# Verify signature structure
jq '.signature' atomic.json
```

**Solution:**
- Verify correct public key is used
- Check signature format (should be object, not string)
- Ensure atomic wasn't modified after signing

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with verbose output
logline verify --ledger data/ledger.jsonl --verbose --stop-on-error

# Check for parse errors
logline verify --ledger data/ledger.jsonl --output json | \
  jq '.results[] | select(.error.code == "PARSE_ERROR")'
```

### Support

- **GitHub Issues**: https://github.com/danvoulez/JsonAtomic/issues
- **Documentation**: https://github.com/danvoulez/JsonAtomic/blob/main/README.md
- **Security**: See THREAT_MODEL.md

---

## Security Operations

### Security Checklist

**Daily:**
- [ ] Verify ledger integrity
- [ ] Check for forks
- [ ] Review logs for anomalies
- [ ] Monitor disk space

**Weekly:**
- [ ] Run security scans (Trivy, npm audit)
- [ ] Update dependencies (Dependabot PRs)
- [ ] Review access logs
- [ ] Test backups

**Monthly:**
- [ ] Review threat model
- [ ] Audit key usage
- [ ] Test disaster recovery
- [ ] Security training

**Quarterly:**
- [ ] Penetration testing
- [ ] Key rotation
- [ ] Compliance review
- [ ] Update runbooks

### Incident Response

**Detection:**
- Automated alerts (monitoring)
- Manual verification
- User reports

**Response:**
1. Assess severity (Critical/High/Medium/Low)
2. Contain threat (stop writes, revoke keys)
3. Investigate root cause
4. Remediate (restore, patch, update)
5. Document and communicate
6. Post-incident review

**Contacts:**
- Security Team: security@example.com
- On-call: pagerduty.com/services/...

### Compliance

**Audit Trail:**
```bash
# Export full ledger for audit
logline verify --ledger data/ledger.jsonl --output ndjson > audit-trail.ndjson

# Filter by date range
jq 'select(.metadata.created_at >= "2025-01-01" and .metadata.created_at < "2025-02-01")' \
  audit-trail.ndjson
```

**Retention:**
- **Ledger**: 7 years (configurable)
- **Backups**: 1 year
- **Logs**: 90 days
- **Keys**: Archive after rotation

---

## Performance Tuning

### Optimization Tips

1. **Large Ledgers**: Use streaming verification
2. **Fast Verification**: Add indexes (future feature)
3. **High Throughput**: Use batch append (future feature)
4. **Disk I/O**: Use SSD for ledger storage
5. **Network**: Use CDN for playground

### Benchmarks

Typical performance on modern hardware:

- **Hash Computation**: ~500K ops/sec
- **Signature Verification**: ~50K ops/sec
- **Ledger Append**: ~10K ops/sec
- **Streaming Verification**: ~100K lines/sec

---

## Advanced Topics

### Multi-Node Setup

(Future feature - documented for planning)

```bash
# Configure replication
export LEDGER_REPLICAS="node2:8000,node3:8000"

# Enable consensus
export CONSENSUS_ENABLED=true
export CONSENSUS_THRESHOLD=2
```

### Custom Policies

(Future feature - documented for planning)

```json
{
  "policies": {
    "ttl": {
      "enabled": true,
      "max_age_seconds": 86400
    },
    "throttle": {
      "enabled": true,
      "max_per_minute": 100
    },
    "circuit_breaker": {
      "enabled": true,
      "failure_threshold": 10
    }
  }
}
```

---

**Document Version**: 1.1.0  
**Last Updated**: 2025-11-09  
**Next Review**: 2025-12-09
