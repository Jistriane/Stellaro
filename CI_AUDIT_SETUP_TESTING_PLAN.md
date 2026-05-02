# CI Automated Auditing Setup — Testing & Validation Plan

**Date:** 2026-05-02  
**Feature:** Automated npm, cargo, and pip-audit in CI pipeline  
**Scope:** All pushes and pull requests  
**Impact:** Early detection of security vulnerabilities in dependencies

## Overview

This PR adds three automated security audit jobs to the GitHub Actions CI pipeline:

1. **npm audit** — checks Node.js/npm dependencies for known CVEs
2. **cargo audit** — checks Rust crate dependencies for security issues
3. **pip-audit** — checks Python package dependencies for vulnerabilities

Each job:
- Runs on every push and PR
- Uses `continue-on-error: true` to not block CI on warnings
- Comments results on PRs for visibility
- Enables early vulnerability detection before deployment

## No Breaking Changes Expected ✅

This PR is **non-breaking** — it adds new jobs to the CI pipeline without modifying existing code, dependencies, or application behavior.

## Testing & Validation Checklist

### Phase 1: GitHub Actions Workflow Validation 🔄
- [ ] Workflow file syntax is valid (no YAML errors)
- [ ] Workflow triggers correctly on push to all branches
- [ ] Workflow triggers correctly on PR to `master`
- [ ] Jobs run in parallel without race conditions
- [ ] Job logging is clear and readable

### Phase 2: npm audit Job Testing 📦
- [ ] npm audit job runs successfully
- [ ] Audit report is generated in JSON format
- [ ] Job identifies known vulnerabilities (should find some)
- [ ] Vulnerabilities are reported in PR comments
- [ ] Job doesn't block CI even if vulnerabilities found (`continue-on-error: true`)
- [ ] No false negatives (verify against `npm audit --json` locally)

### Phase 3: cargo audit Job Testing 🦀
- [ ] cargo audit job runs successfully
- [ ] Cargo workspace is parsed correctly
- [ ] Audit report identifies any known Rust CVEs
- [ ] Job skips if no vulnerabilities (graceful exit)
- [ ] No false positives/negatives
- [ ] Works with Soroban contracts workspace

### Phase 4: pip-audit Job Testing 🐍
- [ ] Python 3.12 environment is set up
- [ ] pip-audit tool installs correctly
- [ ] agents/requirements.txt is scanned
- [ ] Report generated in JSON format
- [ ] Job handles missing packages gracefully
- [ ] No false positives/negatives

### Phase 5: PR Comment Functionality 💬
- [ ] PR comment is posted on pull requests
- [ ] Comment includes all three audit results
- [ ] Comment is readable and actionable
- [ ] Comment links to workflow logs for details
- [ ] No duplicate comments posted

### Phase 6: Integration Testing 🔗
- [ ] First PR with this workflow passes CI
- [ ] Subsequent PRs use cached workflow without re-running setup
- [ ] Results are consistent across multiple runs
- [ ] No race conditions between parallel jobs
- [ ] Job order doesn't affect results

### Phase 7: Known Issue Handling ✅
- [ ] Workflow correctly handles existing vulnerabilities in dependencies
- [ ] Results match `npm audit --json` output
- [ ] Results match `cargo-audit audit --json` output
- [ ] Results match `pip-audit -r requirements.txt --json` output
- [ ] Warnings and errors are properly categorized

## Validation Procedure

### Step 1: Local Validation
```bash
# Verify workflow syntax
cd .github/workflows
yamllint ci.yml  # if yamllint installed

# Or use GitHub's validator online
```

### Step 2: First PR Run
1. Create a test PR or run against existing PR
2. Monitor workflow execution in "Actions" tab
3. Verify all three audit jobs complete
4. Check PR comments for audit results
5. Verify CI passes/fails correctly based on configuration

### Step 3: Verify Against Real Data
```bash
# Verify npm audit matches
npm audit --json > /tmp/local-npm-audit.json
# Compare with PR comment output

# Verify cargo audit matches
cd contracts
cargo-audit audit --json > /tmp/local-cargo-audit.json
# Compare with PR comment output

# Verify pip audit matches
cd agents
pip-audit -r requirements.txt --json > /tmp/local-pip-audit.json
# Compare with PR comment output
```

### Step 4: Test Edge Cases
- [ ] PR with no vulnerabilities → jobs pass silently
- [ ] PR with high-severity vulns → comment is posted
- [ ] PR that fixes vulns → audit reports improvement
- [ ] Force push doesn't cause duplicate comments

### Step 5: Performance Testing ⏱️
- [ ] Workflow completes in < 10 minutes total
- [ ] Parallel job execution reduces time vs sequential
- [ ] No significant slowdown to CI pipeline

## Expected Audit Results

### Current State (from local scan 2026-05-02)

| Scope | Tool | Status | Details |
|-------|------|--------|---------|
| npm | npm audit | 38 vulnerabilities | 13 high, 23 moderate, 2 low; fixes applied in PR #1 |
| Rust | cargo audit | No CVEs | Some `unmaintained` warnings; no known advisories |
| Python | pip-audit | Not yet scanned | See PR #1 for initial recommendations |

## Monitoring & Maintenance

### After Merge

1. **First Week:** Monitor CI runs closely
   - Check that audit jobs run on every PR
   - Verify results accuracy
   - Adjust comment formatting if needed

2. **Ongoing:** Review audit results in PRs
   - Address high-severity vulnerabilities promptly
   - Track vulnerability trends over time
   - Update dependencies based on audit recommendations

3. **Quarterly:** Review audit job configuration
   - Consider adding SAST/DAST tools
   - Evaluate license compliance scanning
   - Consider adding supply-chain security (SBOM)

## Rollback Plan

If workflow causes issues:

1. Delete or disable the `audit-dependencies` job from `.github/workflows/ci.yml`
2. Change `continue-on-error` to `false` for stricter enforcement
3. Adjust Python version or tool versions if compatibility issues

## No Code Changes Required 🎯

This PR only modifies CI configuration. No application code changes needed.

## Compliance & Security

✅ **BCB Compliance:** Automated auditing aligns with BCB Res. 519/520/521 for security controls  
✅ **LGPD Compliance:** Demonstrates proactive security monitoring for LGPD audits  
✅ **Best Practices:** Follows GitHub Actions best practices for security scanning

## Resources

- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [cargo-audit](https://github.com/rustsec/cargo-audit)
- [pip-audit](https://github.com/pypa/pip-audit)
- [GitHub Actions](https://docs.github.com/en/actions)

## Notes

- All audit jobs use `continue-on-error: true` so CI doesn't fail on audit warnings
- Consider enforcing stricter audit requirements (e.g., `continue-on-error: false`) as maturity increases
- Audit results should inform dependency update strategy but not block releases
- Keep audit tools updated: `npm audit`, `cargo install cargo-audit --force`, `pip install --upgrade pip-audit`

---

**Owner:** DevOps / Security Team  
**Priority:** Medium (observability improvement)  
**Status:** Ready for review and testing  
**Expected Merge Date:** 2026-05-03+
