# 🚀 Quick Execution Guide - Stellaro Setup

## Current Status: 97% Complete

This guide shows you how to run the remaining validation steps to reach 100%.

---

## ✅ Option 1: Complete Setup (Recommended)

Run everything automatically:

```bash
# From project root
cd /home/jistriane/Documentos/Stellaro

# 1. ZK Circuit Setup (5-10 minutes)
cd circuits
./quick-setup.sh

# 2. Performance Tests (5-10 minutes)
cd ../load-tests
./install-k6.sh
./performance-suite.sh
```

**Total time**: ~15 minutes

---

## ✅ Option 2: Step-by-Step Setup

### Step 1: ZK Circuit Setup

```bash
cd /home/jistriane/Documentos/Stellaro/circuits

# Compile circuit
./setup-circom.sh

# Generate cryptographic keys
./generate-keys.sh

# Run tests
cd test
npm install
npm test
```

**Expected output**:
```
✅ Witness generated in <100ms
✅ Proof generated in <1s
✅ Proof verified in <50ms
✅ All tests passed!
```

### Step 2: Performance Testing

```bash
cd /home/jistriane/Documentos/Stellaro/load-tests

# Install k6
./install-k6.sh

# Make sure backend is running
cd ../apps/backend
npm run start:dev  # In another terminal

# Run performance suite
cd ../../load-tests
./performance-suite.sh
```

**Expected output**:
```
✅ Backend is running
✅ Load tests completed
✅ No security vulnerabilities
✅ Performance score: >90
```

---

## 📋 Prerequisites

### System Requirements

```bash
# Check Node.js (need v16+)
node --version

# Check npm
npm --version

# Install circom (if not installed)
npm install -g circom

# Install snarkjs (if not installed)
npm install -g snarkjs
```

### Backend Requirements

For performance tests, backend must be running:

```bash
# Terminal 1: Start backend
cd apps/backend
npm install  # if first time
npm run start:dev

# Terminal 2: Run tests
cd load-tests
./performance-suite.sh
```

---

## 🔧 Troubleshooting

### Issue: "circom: command not found"

```bash
npm install -g circom
```

### Issue: "snarkjs: command not found"

```bash
npm install -g snarkjs
```

### Issue: "k6: command not found" (after install-k6.sh)

```bash
# Reload shell
source ~/.bashrc

# Or install manually
sudo apt-get update
sudo apt-get install k6
```

### Issue: "Backend connection refused"

```bash
# Start backend first
cd apps/backend
npm run start:dev

# Wait for "Application is running on: http://localhost:3000"
```

### Issue: "Powers of Tau download failed"

```bash
cd circuits

# Download manually
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau -O pot16_final.ptau

# Then continue with generate-keys.sh
./generate-keys.sh
```

---

## 📊 What Gets Validated

### ZK Circuit Tests
- ✅ Circuit compilation (~45K constraints)
- ✅ Proof generation (<1s)
- ✅ Proof verification (<50ms)
- ✅ Security (rejects invalid inputs)

### Performance Tests
- ✅ Load testing (100-500 concurrent users)
- ✅ API response times (P95 < 500ms)
- ✅ Security audit (npm + Snyk)
- ✅ Frontend performance (Lighthouse score >90)

---

## ✅ Success Criteria

### ZK Circuit
```
🎯 Performance Targets:
   Witness < 100ms: ✅
   Proof < 1000ms: ✅
   Verify < 50ms: ✅
   
✅ All tests passed!
```

### Performance
```
Load Test Results:
   ✓ P95 latency < 500ms
   ✓ Error rate < 1%
   ✓ Success rate > 99%

Security Audit:
   ✓ No vulnerabilities found

Lighthouse:
   ✓ Performance score: >90
```

---

## 🎉 After Completion

Once all tests pass, you'll have:

1. ✅ **ZK Circuit**: Optimized and ready for production
2. ✅ **Performance**: Validated under load
3. ✅ **Security**: Audited and verified
4. ✅ **100% Project Completion**: Ready for mainnet

---

## 📝 Commands Summary

```bash
# Quick setup (all-in-one)
cd circuits && ./quick-setup.sh
cd ../load-tests && ./install-k6.sh && ./performance-suite.sh

# Or step-by-step
cd circuits
./setup-circom.sh
./generate-keys.sh
cd test && npm install && npm test

cd ../../load-tests
./install-k6.sh
./performance-suite.sh
```

---

## 📚 Related Documentation

- **ZK Circuits**: `circuits/README.md`
- **Optimization Details**: `circuits/OPTIMIZATION_GUIDE.md`
- **Integration Guide**: `circuits/INTEGRATION_GUIDE.md`
- **Performance Testing**: `load-tests/TESTING_GUIDE.md`
- **Project Status**: `PROJECT_STATUS_REPORT.md`

---

**Ready?** Start with: `cd circuits && ./quick-setup.sh` 🚀
