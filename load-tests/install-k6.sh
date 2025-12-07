#!/bin/bash

# Install k6 for Load Testing
# https://k6.io/docs/get-started/installation/

set -e

echo "📦 Installing k6 load testing tool..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux"
    
    # Add k6 repository
    sudo gpg -k
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    
    # Install
    sudo apt-get update
    sudo apt-get install k6
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    brew install k6
    
else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "Please install k6 manually: https://k6.io/docs/get-started/installation/"
    exit 1
fi

# Verify installation
echo ""
echo "✅ k6 installed successfully!"
k6 version

echo ""
echo "Next steps:"
echo "  1. Run load tests: k6 run load-tests/k6-scenario.js"
echo "  2. Custom config: k6 run --vus 100 --duration 5m load-tests/k6-scenario.js"
