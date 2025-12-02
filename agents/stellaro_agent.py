"""
Stellaro Agent - DeFi Risk Analysis & Mitigation
Monitors price volatility, liquidity risks, smart contract vulnerabilities
"""
import os
import httpx
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class StellaroAgent:
    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        self.threshold_volatility = 0.15  # 15% price swing
        self.threshold_liquidity = 100_000  # $100k min liquidity
        
    async def analyze_portfolio_risk(self, user_address: str) -> Dict[str, Any]:
        """Analisa riscos do portfolio do usuário"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            positions: List[Dict[str, Any]] = []
            try:
                # Endpoint pode não existir no backend atual; usar fallback vazio
                blend_resp = await client.get(
                    f"{self.backend_url}/defi/blend/positions/{user_address}"
                )
                if blend_resp.status_code == 200:
                    positions = blend_resp.json()
            except httpx.HTTPError:
                positions = []
            
            risks = []
            for pos in positions:
                asset = pos.get("asset")
                value_usd = pos.get("valueUSD", 0)
                
                # Check price via `/oracles/price` disponível
                try:
                    oracle_resp = await client.get(
                        f"{self.backend_url}/oracles/price",
                        params={"asset": asset} if asset else None,
                    )
                    if oracle_resp.status_code == 200:
                        price_data = oracle_resp.json()
                        volatility = price_data.get("volatility", 0) or 0
                        if volatility > self.threshold_volatility:
                            risks.append({
                                "type": "HIGH_VOLATILITY",
                                "asset": asset,
                                "volatility": volatility,
                                "position_value": value_usd,
                                "severity": "HIGH" if volatility > 0.3 else "MEDIUM"
                            })
                except httpx.HTTPError:
                    pass
                
                # Check liquidity risk
                try:
                    pool_resp = await client.get(
                        f"{self.backend_url}/defi/blend/optimal-pool/{asset}"
                    )
                    if pool_resp.status_code == 200:
                        pool = pool_resp.json()
                        liquidity = pool.get("totalLiquidityUSD", 0)
                        if liquidity < self.threshold_liquidity:
                            risks.append({
                                "type": "LOW_LIQUIDITY",
                                "asset": asset,
                                "liquidity_usd": liquidity,
                                "position_value": value_usd,
                                "severity": "CRITICAL" if liquidity < 50_000 else "MEDIUM"
                            })
                except httpx.HTTPError:
                    pass
            
            return {
                "user_address": user_address,
                "total_positions": len(positions),
                "risks_detected": len(risks),
                "risks": risks,
                "recommendation": self._generate_recommendation(risks)
            }
    
    def _generate_recommendation(self, risks: List[Dict]) -> str:
        """Gera recomendação baseada nos riscos"""
        if not risks:
            return "Portfolio appears healthy. Continue monitoring."
        
        critical_count = sum(1 for r in risks if r["severity"] == "CRITICAL")
        high_count = sum(1 for r in risks if r["severity"] == "HIGH")
        
        if critical_count > 0:
            return f"URGENT: {critical_count} critical risk(s) detected. Consider immediate rebalancing or partial liquidation."
        elif high_count > 2:
            return f"WARNING: {high_count} high-severity risks. Recommend diversification and hedging."
        else:
            return "Moderate risks detected. Monitor closely and consider gradual rebalancing."
    
    async def execute_risk_mitigation(self, user_address: str, action: str) -> Dict[str, Any]:
        """Executa ação de mitigação de risco"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            if action == "AUTO_REBALANCE":
                # Trigger auto-rebalance via Blend
                try:
                    resp = await client.post(
                        f"{self.backend_url}/defi/blend/rebalance",
                        json={"userAddress": user_address}
                    )
                    return resp.json() if resp.status_code == 200 else {"error": "Rebalance failed"}
                except httpx.HTTPError as e:
                    return {"error": f"Rebalance request failed: {str(e)}"}
            
            elif action == "PARTIAL_LIQUIDATION":
                # Implement partial liquidation logic
                return {"status": "NOT_IMPLEMENTED", "action": action}
            
            else:
                return {"error": f"Unknown action: {action}"}
