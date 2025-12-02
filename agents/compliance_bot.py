"""
ComplianceBot Agent - KYC/AML Monitoring & Regulatory Compliance
Monitors transactions for suspicious activity, enforces compliance rules
"""
import os
import httpx
from typing import Dict, Any, List
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class ComplianceBotAgent:
    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        self.max_daily_volume = 100_000  # $100k daily limit
        self.max_single_tx = 50_000  # $50k single transaction limit
        self.suspicious_countries = ["XX", "YY"]  # Blocked jurisdictions
        
    async def check_transaction_compliance(
        self, 
        user_address: str, 
        amount_usd: float, 
        asset: str,
        destination: str = None
    ) -> Dict[str, Any]:
        """Verifica compliance de uma transação"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            violations = []
            risk_score = 0
            
            # Check single transaction limit
            if amount_usd > self.max_single_tx:
                violations.append({
                    "type": "SINGLE_TX_LIMIT_EXCEEDED",
                    "limit": self.max_single_tx,
                    "amount": amount_usd,
                    "severity": "HIGH"
                })
                risk_score += 50
            
            # Check daily volume limit
            daily_volume = await self._get_daily_volume(user_address)
            if daily_volume + amount_usd > self.max_daily_volume:
                violations.append({
                    "type": "DAILY_VOLUME_LIMIT_EXCEEDED",
                    "limit": self.max_daily_volume,
                    "current_volume": daily_volume,
                    "attempted_amount": amount_usd,
                    "severity": "CRITICAL"
                })
                risk_score += 80
            
            # Check user KYC status (backend atual não expõe kyc-status; aplicar defaults seguros)
            try:
                kyc_resp = await client.get(
                    f"{self.backend_url}/compliance/kyc-status/{user_address}"
                )
                if kyc_resp.status_code == 200:
                    kyc_data = kyc_resp.json()
                    kyc_level = kyc_data.get("level", 2)  # default 2
                    if kyc_level < 2 and amount_usd > 10_000:
                        violations.append({
                            "type": "INSUFFICIENT_KYC_LEVEL",
                            "required_level": 2,
                            "current_level": kyc_level,
                            "amount": amount_usd,
                            "severity": "HIGH"
                        })
                        risk_score += 70
                    country = kyc_data.get("country")
                    if country in self.suspicious_countries:
                        violations.append({
                            "type": "BLOCKED_JURISDICTION",
                            "country": country,
                            "severity": "CRITICAL"
                        })
                        risk_score += 100
            except httpx.HTTPError:
                # Sem endpoint, assumir KYC nível 2 como default para dev
                pass
            
            # Pattern analysis (velocity check)
            velocity_risk = await self._check_transaction_velocity(user_address)
            if velocity_risk > 0.7:
                violations.append({
                    "type": "HIGH_TRANSACTION_VELOCITY",
                    "velocity_score": velocity_risk,
                    "severity": "MEDIUM"
                })
                risk_score += 30
            
            approved = len(violations) == 0 or risk_score < 50
            
            return {
                "user_address": user_address,
                "amount_usd": amount_usd,
                "asset": asset,
                "approved": approved,
                "risk_score": min(risk_score, 100),
                "violations": violations,
                "action": "APPROVE" if approved else "BLOCK",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def monitor_aml_patterns(self, user_address: str) -> Dict[str, Any]:
        """Monitora padrões suspeitos de lavagem de dinheiro"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            # Get transaction history (tolerante a falhas)
            try:
                history_resp = await client.get(
                    f"{self.backend_url}/memory/history/{user_address}?limit=100"
                )
                if history_resp.status_code != 200:
                    return {
                        "user_address": user_address,
                        "patterns_detected": 0,
                        "patterns": [],
                        "recommendation": "No history available. Continue monitoring.",
                    }
                transactions = history_resp.json().get("events", [])
            except httpx.HTTPError:
                return {
                    "user_address": user_address,
                    "patterns_detected": 0,
                    "patterns": [],
                    "recommendation": "No history available (network error). Continue monitoring.",
                }
            
            # AML pattern detection
            patterns = []
            
            # Structuring detection (breaking large amounts into smaller ones)
            small_txs = [tx for tx in transactions if 9_000 < tx.get("amount", 0) < 10_000]
            if len(small_txs) > 5:
                patterns.append({
                    "type": "STRUCTURING",
                    "description": "Multiple transactions just below reporting threshold",
                    "count": len(small_txs),
                    "severity": "HIGH"
                })
            
            # Rapid movement (layering)
            rapid_txs = [tx for tx in transactions if 
                         (datetime.utcnow() - datetime.fromisoformat(tx.get("timestamp", "2000-01-01"))).seconds < 3600]
            if len(rapid_txs) > 10:
                patterns.append({
                    "type": "RAPID_MOVEMENT",
                    "description": "Unusual high-frequency transactions (layering)",
                    "count": len(rapid_txs),
                    "severity": "MEDIUM"
                })
            
            # Round amount transactions (common in money laundering)
            round_txs = [tx for tx in transactions if tx.get("amount", 0) % 1000 == 0]
            if len(round_txs) > 8:
                patterns.append({
                    "type": "ROUND_AMOUNTS",
                    "description": "Frequent round-number transactions",
                    "count": len(round_txs),
                    "severity": "LOW"
                })
            
            return {
                "user_address": user_address,
                "patterns_detected": len(patterns),
                "patterns": patterns,
                "recommendation": self._generate_aml_recommendation(patterns)
            }
    
    async def _get_daily_volume(self, user_address: str) -> float:
        """Calcula volume de transações das últimas 24h"""
        # Stub: In production, query actual transaction history
        return 0.0
    
    async def _check_transaction_velocity(self, user_address: str) -> float:
        """Calcula score de velocidade de transações (0-1)"""
        # Stub: In production, analyze transaction frequency patterns
        return 0.0
    
    def _generate_aml_recommendation(self, patterns: List[Dict]) -> str:
        """Gera recomendação baseada em padrões AML"""
        if not patterns:
            return "No suspicious patterns detected. Continue monitoring."
        
        high_severity = sum(1 for p in patterns if p["severity"] == "HIGH")
        
        if high_severity > 0:
            return f"ALERT: {high_severity} high-severity AML pattern(s) detected. Escalate to compliance team."
        else:
            return f"INFO: {len(patterns)} low/medium pattern(s) detected. Monitor closely."
