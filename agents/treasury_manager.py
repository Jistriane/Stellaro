"""
TreasuryManager Agent - Automated Yield Optimization & Treasury Management
Manages protocol treasury, auto-compounds yields, rebalances pools
"""
import os
import httpx
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class TreasuryManagerAgent:
    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3000")
        self.min_compound_threshold = 50  # $50 min to justify gas fees
        self.target_apy = 0.08  # 8% target APY
        
    async def optimize_treasury_yield(self, treasury_address: str) -> Dict[str, Any]:
        """Otimiza yield da tesouraria do protocolo"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            # Get current treasury positions (fallback vazio se endpoint inexistente)
            positions: List[Dict[str, Any]] = []
            try:
                positions_resp = await client.get(
                    f"{self.backend_url}/defi/blend/positions/{treasury_address}"
                )
                if positions_resp.status_code == 200:
                    positions = positions_resp.json()
            except httpx.HTTPError:
                positions = []
            
            optimization_plan = []
            total_earnings = 0
            
            for pos in positions:
                asset = pos.get("asset")
                value_usd = pos.get("valueUSD", 0)
                current_apy = pos.get("apy", 0)
                
                # Find optimal pool for this asset
                try:
                    pool_resp = await client.get(
                        f"{self.backend_url}/defi/blend/optimal-pool/{asset}"
                    )
                    if pool_resp.status_code == 200:
                        optimal_pool = pool_resp.json()
                        optimal_apy = optimal_pool.get("estimatedAPY", 0)
                        if optimal_apy > current_apy + 0.02:  # 2% improvement threshold
                            potential_gain = value_usd * (optimal_apy - current_apy)
                            optimization_plan.append({
                                "asset": asset,
                                "current_pool": pos.get("poolId"),
                                "optimal_pool": optimal_pool.get("poolId"),
                                "current_apy": current_apy,
                                "optimal_apy": optimal_apy,
                                "position_value": value_usd,
                                "estimated_annual_gain": potential_gain,
                                "action": "MIGRATE_POOL"
                            })
                            total_earnings += potential_gain
                except httpx.HTTPError:
                    pass
            
            return {
                "treasury_address": treasury_address,
                "total_positions": len(positions),
                "optimization_opportunities": len(optimization_plan),
                "estimated_annual_gain": total_earnings,
                "optimization_plan": optimization_plan,
                "recommendation": self._generate_optimization_recommendation(optimization_plan)
            }
    
    async def auto_compound_yields(self, treasury_address: str) -> Dict[str, Any]:
        """Auto-compounding de yields acumulados"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            try:
                positions_resp = await client.get(
                    f"{self.backend_url}/defi/blend/positions/{treasury_address}"
                )
                positions = positions_resp.json() if positions_resp.status_code == 200 else []
            except httpx.HTTPError:
                positions = []
            
            compounds_executed = []
            total_compounded = 0
            
            for pos in positions:
                asset = pos.get("asset")
                accrued_interest = pos.get("accruedInterestUSD", 0)
                
                if accrued_interest >= self.min_compound_threshold:
                    # Execute auto-compound
                    try:
                        compound_resp = await client.post(
                            f"{self.backend_url}/defi/blend/auto-compound",
                            json={
                                "userAddress": treasury_address,
                                "asset": asset,
                                "poolId": pos.get("poolId")
                            }
                        )
                        if compound_resp.status_code == 200:
                            result = compound_resp.json()
                            compounds_executed.append({
                                "asset": asset,
                                "amount_compounded": accrued_interest,
                                "new_balance": result.get("newBalance"),
                                "transaction_hash": result.get("transactionHash")
                            })
                            total_compounded += accrued_interest
                    except httpx.HTTPError:
                        pass
            
            return {
                "treasury_address": treasury_address,
                "compounds_executed": len(compounds_executed),
                "total_compounded_usd": total_compounded,
                "details": compounds_executed
            }
    
    def _generate_optimization_recommendation(self, plan: List[Dict]) -> str:
        """Gera recomendação de otimização"""
        if not plan:
            return "Treasury is optimally allocated. No migration needed."
        
        total_gain = sum(p["estimated_annual_gain"] for p in plan)
        
        if total_gain > 10_000:
            return f"HIGH PRIORITY: Migrate {len(plan)} position(s) to earn ${total_gain:,.2f}/year more."
        elif total_gain > 1_000:
            return f"RECOMMENDED: Optimize {len(plan)} position(s) for ${total_gain:,.2f}/year gain."
        else:
            return f"Optional: Minor optimization available (${total_gain:,.2f}/year)."
    
    async def rebalance_treasury(self, treasury_address: str) -> Dict[str, Any]:
        """Rebalanceia tesouraria entre pools"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            try:
                resp = await client.post(
                    f"{self.backend_url}/defi/blend/rebalance",
                    json={"userAddress": treasury_address}
                )
                return resp.json() if resp.status_code == 200 else {"error": "Rebalance failed"}
            except httpx.HTTPError as e:
                return {"error": f"Rebalance request failed: {str(e)}"}
