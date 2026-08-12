#!/bin/sh
set -eu

: "${TURN_REALM:?TURN_REALM must be set}"
: "${TURN_EXTERNAL_IP:?TURN_EXTERNAL_IP must be set}"
: "${TURN_SHARED_SECRET:?TURN_SHARED_SECRET must be set}"

# A heredoc avoids interpreting special characters in the shared secret as sed syntax.
cat > /tmp/turnserver.conf <<EOF
listening-port=3478
fingerprint
use-auth-secret
static-auth-secret=${TURN_SHARED_SECRET}
realm=${TURN_REALM}
external-ip=${TURN_EXTERNAL_IP}
min-port=49160
max-port=49200
no-cli
no-tls
no-dtls
no-loopback-peers
no-multicast-peers
stale-nonce=600
user-quota=12
total-quota=180
max-bps=3000000
bps-capacity=9000000
EOF

exec turnserver -c /tmp/turnserver.conf --log-file=stdout
