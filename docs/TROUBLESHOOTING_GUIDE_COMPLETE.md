# 🔧 TROUBLESHOOTING GUIDE - STELLARO

**Updated**: December 9, 2025  
**Purpose**: Diagnose and resolve common issues  
**Audience**: All users and operators  
**Coverage**: All components  

---

## 🎯 QUICK DIAGNOSIS FLOWCHART

```
Having an issue?
├─ Is Stellaro site loading?
│  ├─ NO  → Go to "Site Not Accessible"
│  └─ YES → Is Wallet connecting?
│     ├─ NO  → Go to "Wallet Connection Issues"
│     └─ YES → Is transaction failing?
│        ├─ NO  → Go to "Transaction Issues"
│        └─ YES → Specific issue? Search below
```

---

## 🌐 WEBSITE & ACCESS ISSUES

### Issue: Site Not Loading / 502 Error

**Symptoms**:
- Page shows "Service Unavailable"
- 502 Bad Gateway error
- Site times out after waiting

**Diagnosis**:
```bash
# Check if site is accessible
curl -I https://stellaro.io
ping stellaro.io

# Check service status
curl https://status.stellaro.io/
```

**Solutions** (Try in order):

1. **Clear Browser Cache**
   - Press: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - Select: All time
   - Check: Cookies, Cache, Images
   - Click: Clear data
   - Refresh: F5

2. **Try Different Browser**
   - Chrome, Firefox, Safari, Edge
   - If works in one, issue is browser-specific

3. **Try Private/Incognito Mode**
   - Press: Ctrl+Shift+N (Chrome) / Ctrl+Shift+P (Firefox)
   - Visit: https://stellaro.io
   - If works, extensions are problem

4. **Disable Browser Extensions**
   - Try: AdBlock, VPN, Crypto wallets
   - These can block resources
   - Disable one at a time to identify culprit

5. **Check Your Internet**
   - Test: speedtest.net
   - Minimum: 5 Mbps download
   - Try: Different Wi-Fi or cellular

6. **Contact Support**
   - If still not working: support@stellaro.io
   - Include: Browser, OS, error message

**Status Page**: https://status.stellaro.io/

---

## 🔐 AUTHENTICATION ISSUES

### Issue: Can't Create Account

**Symptoms**:
- Sign up button not responsive
- Form won't submit
- Email not received

**Solutions**:

1. **Check Email**
   - Look in Spam/Junk folder
   - Check all email accounts
   - Resend confirmation email
   - Wait up to 5 minutes

2. **Email Validation**
   - Valid email format: user@example.com
   - Not valid: user@invalid, just@domain
   - Try different email address

3. **Clear Form Errors**
   - Refresh page: F5
   - Clear fields manually
   - Try again with fresh data

4. **Contact Support**
   - Email: support@stellaro.io
   - Include: Email address, screenshot
   - We'll create account manually

### Issue: Can't Log In / Forgot Password

**Symptoms**:
- Login fails with "Invalid credentials"
- "Account not found" message
- Can't reset password

**Solutions**:

1. **Check Email**
   - Verify email spelling
   - Case doesn't matter: Test@Email.com = test@email.com
   - Common typos: gmial.com, gmai.l.com

2. **Reset Password**
   - Click: "Forgot Password?"
   - Enter: Your email
   - Check: Email for reset link
   - Wait: 5 minutes max
   - Click: Reset link
   - Create: New strong password (12+ chars)
   - Login: With new password

3. **Clear Cookies**
   - Browser Settings → Cookies
   - Delete cookies for stellaro.io
   - Close browser completely
   - Reopen and login

4. **Account Recovery**
   - Have backup seed phrase?
   - Use hardware wallet recovery
   - Contact support with ID verification

### Issue: MFA/2FA Not Working

**Symptoms**:
- Can't scan QR code
- Codes not generating
- Always invalid
- Lost authenticator app

**Solutions**:

1. **Rescan QR Code**
   - Screenshot QR code
   - Zoom in on screenshot
   - Try different authenticator app
   - Apps: Google Authenticator, Authy, Microsoft Authenticator

2. **Time Synchronization**
   - Phone time must match server
   - Go to: Phone Settings → Date & Time
   - Enable: Automatic time sync
   - Set correct timezone
   - Codes refresh every 30 seconds

3. **Backup Codes**
   - During setup, were backup codes saved?
   - Check: Notes, password manager, email
   - Each code use once only
   - After all used, reset MFA

4. **Reset MFA (If Locked Out)**
   - Contact: support@stellaro.io
   - Provide: Email, government ID photo
   - Verification: 24-48 hours
   - We: Disable MFA temporarily
   - You: Re-enable fresh MFA

---

## 💰 WALLET & ACCOUNT ISSUES

### Issue: Can't Connect Wallet

**Symptoms**:
- "Connect Wallet" button not working
- Extension not responding
- Always shows disconnected

**Diagnosis**:
```bash
# Check wallet extension installed
# Check browser console for errors: F12
# Look for: "extension not found" or "denied" messages
```

**Solutions**:

1. **Freighter Wallet (Most Common)**
   - Install: https://www.freighter.app/
   - Refresh: F5
   - Try: Connect again
   - Approve: Popup (may be behind window)

2. **Check Wallet Settings**
   - Open: Freighter/Ledger/Albedo
   - Verify: Account is active
   - Check: Network is Stellar Mainnet (not testnet)
   - Try: Logout/Login in wallet

3. **Reinstall Wallet**
   - Remove: Browser extension
   - Clear: Browser cache
   - Restart: Browser
   - Reinstall: Fresh from official source

4. **Try Different Wallet**
   - Freighter: https://www.freighter.app/
   - Ledger: https://ledger.com
   - Albedo: https://albedo.link
   - One wallet might work if another doesn't

5. **Check Browser Console**
   - Press: F12 (Developer Tools)
   - Click: "Console" tab
   - Look for: Error messages
   - Screenshot: Include in support ticket

### Issue: Wallet Shows Zero Balance

**Symptoms**:
- Connected but balance shows $0
- Recently funded but not showing
- Balance disappeared

**Solutions**:

1. **Wait for Confirmation**
   - Blockchain: 5-10 seconds typical
   - Chain indexing: 1-2 minutes sometimes
   - Exchange: 5-30 minutes from exchange

2. **Refresh & Reload**
   - Refresh: Stellaro page (F5)
   - Reload: Wallet extension (close & reopen)
   - Restart: Browser completely
   - Clear: Cache (Ctrl+Shift+Delete)

3. **Check Blockchain Directly**
   - Visit: https://stellar.expert/
   - Search: Your Stellar address
   - Shows: True balance from blockchain
   - If shows balance there, Stellaro will sync

4. **Check Network**
   - Wallet showing: Stellar Mainnet?
   - If Testnet: Balance is separate account
   - Switch to: Correct network
   - Or use: Different account

5. **Verify Funding**
   - Check: Exchange transaction receipt
   - Status: Should show "completed"
   - If: "pending", wait more
   - If: "failed", contact exchange support

### Issue: Insufficient Balance / Minimum Balance Error

**Symptoms**:
- "Insufficient balance" error
- Can't perform transaction even with funds
- "Minimum balance required" message

**Solutions**:

1. **Understand Minimum Balance**
   - Stellar requires: 2 XLM minimum
   - For: Basic account operations
   - If you have: 1.5 XLM, need: 0.5 more
   - Buy: More XLM on exchange

2. **Calculate Required Balance**
   ```
   Required = Base (2 XLM) + Entries (0.5 XLM each)
   
   Example:
   - Base: 2 XLM
   - Trust lines (STLT): 0.5 XLM each
   - Open positions: may add more
   - For trading: Need 2-5 XLM buffer
   ```

3. **Check What's Using Balance**
   - Open: Wallet settings
   - View: All trust lines (STLT, other tokens)
   - Each adds: 0.5 XLM requirement
   - Reduce: Remove unused trust lines

4. **Buy More XLM**
   - If need: Just 0.5-1 XLM more
   - Cost: $0.06-$0.12 USD
   - Purchase: Coinbase, Kraken, other exchange
   - Withdraw: To your Stellar address
   - Wait: 5-10 minutes

---

## 🔄 TRANSACTION ISSUES

### Issue: Transaction Pending / Stuck

**Symptoms**:
- Transaction shows "pending" for >5 minutes
- No error but not confirmed
- Funds seem stuck

**Solutions**:

1. **Check Blockchain Status**
   ```bash
   # Visit Stellar Expert
   https://stellar.expert/explorer/public
   
   # Search your transaction ID
   # Should show: "Success" or "Pending"
   ```

2. **Wait (Usually Fixes)** ⏱️
   - Typical confirmation: 5-10 seconds
   - Maximum: 30 seconds
   - If over 5 min: Issue may exist
   - After 30 min: Consider stuck

3. **Refresh & Check**
   - Refresh: Stellaro (F5)
   - Check: Updated status
   - Often: Page needs refresh
   - Transaction: Already completed

4. **Check Network**
   - Visit: https://status.stellar.org/
   - Look for: Any network issues
   - If: Outage, wait until fixed
   - Check: Status page for updates

5. **If Truly Stuck (Rare)**
   - Stellaro: Can't cancel transactions
   - Blockchain: Already processing
   - Wait: Another 30-60 minutes
   - If persists: Contact support

**Never try to**: Double-submit same transaction

### Issue: Transaction Failed / Rejected

**Symptoms**:
- Error message: "Transaction failed"
- "Insufficient funds" (but have balance)
- "Invalid operation"

**Solutions**:

1. **Read Error Message Carefully**
   - Most errors: Self-explanatory
   - Common: "Insufficient funds", "Invalid amount"
   - If unclear: Write down exact message

2. **Common Error Solutions**

   **"Insufficient Funds"**
   - Even with balance visible
   - Reason: Blockchain has different balance
   - Solution: Refresh (F5) and wait 1 minute

   **"Invalid Amount"**
   - Entered: Non-number or negative
   - Solution: Use valid number (e.g., 10.5)
   - Check: Decimal places (8 max)

   **"Destination Invalid"**
   - Address format: Wrong
   - Solution: Copy-paste address correctly
   - Verify: Starts with "G" (mainnet)

   **"Account Not Found"**
   - Destination: Doesn't exist
   - Solution: Verify address is correct
   - Or: Destination needs activation

   **"Operation Failed"**
   - Generic error
   - Try: Refresh page and retry
   - If persists: Check balance again

3. **Still Getting Error?**
   - Note: Exact error message
   - Screenshot: Full error
   - Check: Amount, address format
   - Contact: support@stellaro.io

### Issue: High Transaction Fees

**Symptoms**:
- Fee higher than expected
- Paying: More than 0.00001 XLM per operation
- Network congestion notice

**Information**:
- Normal fee: 0.00001 XLM (~0.000001 USD)
- During congestion: May be higher (rare)
- Stellaro: Doesn't add fees
- Fee goes to: Stellar network

**Solutions**:
- Fees: Set by network, not Stellaro
- Can't: Reduce or negotiate
- Wait: For network uncongestion
- Or: Pay current fee

---

## 💳 TRADING & DEFI ISSUES

### Issue: Can't Mint Stablecoin (STLT)

**Symptoms**:
- Mint button disabled
- Error: "Cannot mint"
- No STLT received after transaction

**Solutions**:

1. **Check Wallet Connection**
   - Connected? Yes/No
   - Correct network? Stellar Mainnet
   - Sufficient XLM? At least 1 XLM

2. **Understand Mint Requirements**
   - Need: 1 XLM minimum per STLT
   - So: To mint 10 STLT need 10 XLM
   - Plus: 0.5 XLM for trust line
   - Total needed: ~10.5 XLM for 10 STLT

3. **Add Trust Line First**
   - STLT: Needs trust from your account
   - In Freighter: "Add Token" → STLT-BRL
   - Cost: 0.5 XLM one-time
   - Then: Can mint

4. **Verify Funds**
   - Have: Enough XLM?
   - Check: Wallet balance directly
   - Confirm: Minimum 2 XLM + amount to mint

### Issue: Can't Earn Interest / Join Pool

**Symptoms**:
- Deposit button disabled
- Error after deposit attempt
- Funds not in pool after transaction

**Solutions**:

1. **Check Pool Status**
   - Open: Lending Pools section
   - Look for: Red warnings
   - Check: Pool not full/closed
   - Verify: Pool is active

2. **Have STLT?**
   - Need: STLT-BRL stablecoin
   - If no: Mint first (see above)
   - Amount: Can deposit any amount > 0

3. **Understand APY**
   - Shown: Current APY (5-12% typical)
   - Not: Guaranteed return
   - Changes: Daily with supply/demand
   - Your interest: Accrues in real-time

4. **Check Transaction**
   - Confirm: Transaction went through
   - View: Transaction receipt
   - Check: Funds in wallet still?
   - If yes: Try again or contact support

### Issue: Can't Borrow / Collateral Issue

**Symptoms**:
- Borrow disabled
- "Insufficient collateral" error
- Collateral showing zero

**Solutions**:

1. **Understand Borrowing**
   - Can borrow: Up to 80% of collateral value
   - So: 1 STLT collateral = borrow 0.8 STLT
   - Need: Deposit first as collateral

2. **Deposit Collateral**
   - Go: DeFi → Borrowing
   - Click: "Add Collateral"
   - Choose: STLT or other token
   - Amount: To use as collateral
   - Then: Can borrow against it

3. **Calculate Borrowing Power**
   ```
   Borrowing Power = Collateral Value × 0.8
   
   Example:
   - Deposit: 100 STLT ($100)
   - Can borrow: $80 (0.8 × 100)
   - If borrow: $80, power used: 100%
   - If borrow: $40, power used: 50%
   ```

4. **Monitor Loan Health**
   - Health ratio: Shows safety
   - Below 100%: Liquidation risk
   - Below 80%: Dangerous
   - Check daily: Avoid liquidation

---

## 🗳️ GOVERNANCE ISSUES

### Issue: Can't Vote / Voting Disabled

**Symptoms**:
- Vote button grayed out
- Error: "Cannot vote"
- Proposal locked

**Solutions**:

1. **Check Voting Window**
   - Proposals: Have time limit
   - During voting: Can vote
   - After ended: Cannot vote
   - Check: Time remaining on proposal

2. **Have Voting Rights?**
   - Need: Minimum STLT balance
   - Amount: Varies by governance model
   - Check: "Voting requirements" section
   - If insufficient: Buy more STLT

3. **Delegate Voting Power**
   - Haven't delegated? Can't vote
   - Go: Settings → Governance
   - Click: "Delegate voting power"
   - To: Your own address (or other)
   - Then: Can vote in proposals

### Issue: Proposal Not Created

**Symptoms**:
- Submit button disabled
- Error after submitting
- Proposal not visible

**Solutions**:

1. **Check Requirements**
   - Need: Minimum balance
   - Need: Voting power delegated
   - Need: Proper formatting
   - All met? Try again

2. **Verify Content**
   - Title: Required, non-empty
   - Description: Required, substantive
   - Duration: Valid duration
   - No profanity/spam

3. **Try Again**
   - Refresh: Page (F5)
   - Clear: Form completely
   - Resubmit: Fresh data
   - Check: Success message

---

## 📊 DATA & BALANCE ISSUES

### Issue: Balance Shows Incorrect / Not Updating

**Symptoms**:
- Balance stuck at old amount
- Made transaction but not showing
- Different in wallet vs Stellaro

**Solutions**:

1. **Refresh Browser**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
   - Clear: Cache completely
   - Close: Tab completely
   - Reopen: Fresh

2. **Check Source**
   - Wallet balance: In wallet extension
   - Blockchain: Stellar Expert (https://stellar.expert)
   - Stellaro: Shows derived from blockchain
   - Authoritative: Blockchain is source of truth

3. **Wait for Indexing**
   - Transaction: ~5 seconds to confirm
   - Indexing: ~1-2 minutes to show everywhere
   - If: Just happened, wait 2-3 minutes
   - Then: Refresh and check again

4. **Verify Correct Account**
   - Multiple accounts? Using right one?
   - Mainnet vs testnet? Check network
   - Correct wallet? Switch and check

### Issue: Portfolio Shows Wrong Valuation

**Symptoms**:
- Portfolio value incorrect
- Individual positions wrong
- Performance metrics off

**Solutions**:

1. **Check Prices**
   - Prices update: Every 1 minute
   - If market: Just moved, refresh
   - Prices from: Stellar DEX and exchanges
   - May lag: 1-2 minutes behind

2. **Recalculate Position**
   - Amount × Price = Value
   - If off: Check amount and price
   - Ask in Discord: Community can verify

3. **Contact Support**
   - If persistently wrong: support@stellaro.io
   - Include: Screenshot of position
   - Include: Amount and price shown

---

## ⚡ PERFORMANCE & SPEED ISSUES

### Issue: App Running Slow / Laggy

**Symptoms**:
- Buttons slow to respond
- Pages take long to load
- Transactions slow to process

**Solutions**:

1. **Check Your Internet**
   - Speed: Run speedtest.net
   - Minimum: 5 Mbps needed
   - Network: Stable connection
   - WiFi: If slow, try cellular

2. **Clear Browser Cache**
   - Press: Ctrl+Shift+Delete
   - Select: All time
   - Check: All options
   - Click: Clear data
   - Restart: Browser

3. **Disable Extensions**
   - Try: Disable extensions one by one
   - Culprits: Ad blockers, VPNs, wallets
   - See if: App speeds up
   - Restart: Browser after each change

4. **Try Different Browser**
   - Chrome, Firefox, Safari, Edge
   - Different browser: May perform better
   - Identifies: Browser-specific issue

5. **Check Device Performance**
   - Processor: Older devices slower
   - RAM: Low RAM causes slowness
   - Close: Other applications
   - Restart: Device may help

6. **Upgrade Browser**
   - Outdated: Old browser versions slow
   - Check: For browser updates
   - Install: Latest version
   - Restart: Browser

---

## 🔒 SECURITY & ACCOUNT ISSUES

### Issue: Suspicious Activity / Account Hacked

**Symptoms**:
- Funds disappeared
- Don't recognize transactions
- Someone else accessing account

**Solutions**:

1. **IMMEDIATE - Secure Account**
   - Password: Change immediately
   - MFA: Reset to new device
   - Other accounts: Check if hacked too
   - Bank: Contact if connected

2. **Check Transaction History**
   - View: All recent transactions
   - Unrecognized? Note transaction IDs
   - Screenshot: All evidence
   - Check: With blockchain https://stellar.expert

3. **Report to Support**
   - Email: security@stellaro.io (urgent)
   - Include: Transaction IDs
   - Include: Screenshots
   - Include: Timeline of events
   - Stellaro: May be able to help

4. **Prevention Going Forward**
   - MFA: Always enable
   - Password: Very strong
   - Don't share: Seed phrase with anyone
   - Suspicious links: Never click
   - Hardware wallet: Consider using

**Remember**: If funds sent on blockchain, cannot be reversed. Prevention is critical.

### Issue: Phishing / Fake Stellaro Site

**Symptoms**:
- URL looks similar but slightly different
- Asked for password/seed phrase
- Unusual design or errors

**Solutions**:

1. **Always Verify URL**
   - Correct: https://stellaro.io
   - Check: No extra letters or numbers
   - Bookmark: Official site
   - Use: Bookmark, never type

2. **Never Enter Private Info**
   - Stellaro: Never asks for password
   - Stellaro: Never asks for seed phrase
   - Stellaro: Never asks for private keys
   - If asked: It's a scam

3. **Report Phishing**
   - Found fake site?
   - Report: security@stellaro.io
   - Include: URL of fake site
   - Include: Screenshot
   - Helps: Protect community

---

## 📞 WHEN TO CONTACT SUPPORT

**Contact support@stellaro.io if**:
- Issue not resolved by troubleshooting
- Need account-level help
- Transaction truly stuck (>1 hour)
- Suspicious activity suspected
- Bug in application

**Support Information**:
- Response time: Within 24 hours
- During: Business hours EST
- Urgent: Call +55 (11) 4000-0000
- Security: security@stellaro.io

**Have Ready**:
- Description of issue
- Screenshots
- Account email
- Transaction IDs (if applicable)
- What you've already tried

---

## 🆘 EMERGENCY CONTACTS

**Technical Issues**: support@stellaro.io
**Security Issues**: security@stellaro.io
**Business Inquiries**: business@stellaro.io
**Abuse Report**: abuse@stellaro.io
**Phone**: +55 (11) 4000-0000
**Discord**: https://discord.gg/stellaro
**Twitter**: @StellaroIo

---

**Guide Version**: 1.0  
**Created**: December 9, 2025  
**Language**: English  
**Last Updated**: December 9, 2025  
**Maintenance**: Updated regularly with new issues
