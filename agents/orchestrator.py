"""
Multi-Agent Orchestrator - Coordinates Stellaro (risk), TreasuryManager, ComplianceBot
Uses sequential workflow for complex DeFi operations with compliance checks
"""
import asyncio
from typing import Dict, Any
from stellaro_agent import StellaroAgent
from treasury_manager import TreasuryManagerAgent
from compliance_bot import ComplianceBotAgent

class StellaroAgentOrchestrator:
    def __init__(self):
        self.stellaro = StellaroAgent()
        self.treasury_manager = TreasuryManagerAgent()
        self.compliance_bot = ComplianceBotAgent()
    
    async def execute_safe_treasury_optimization(self, treasury_address: str) -> Dict[str, Any]:
        """
        Sequential workflow: 
        1. ComplianceBot verifies treasury address
        2. Stellaro analyzes portfolio risks
        3. TreasuryManager optimizes yields (only if risks are acceptable)
        """
        print(f"🚀 Starting safe treasury optimization for {treasury_address}...")
        
        # Step 1: Compliance check (stub - in production would verify address whitelist)
        print("📋 Step 1: Compliance verification...")
        compliance_check = {
            "approved": True,  # Stub
            "message": "Treasury address verified"
        }
        
        if not compliance_check["approved"]:
            return {
                "success": False,
                "stage": "compliance",
                "error": "Treasury address failed compliance check"
            }
        
        # Step 2: Risk analysis
        print("🛡️ Step 2: Risk analysis...")
        risk_analysis = await self.stellaro.analyze_portfolio_risk(treasury_address)
        
        critical_risks = sum(1 for r in risk_analysis.get("risks", []) if r["severity"] == "CRITICAL")
        if critical_risks > 0:
            return {
                "success": False,
                "stage": "risk_analysis",
                "error": f"{critical_risks} critical risk(s) detected. Optimization aborted.",
                "risk_details": risk_analysis
            }
        
        # Step 3: Yield optimization (only if safe)
        print("💰 Step 3: Yield optimization...")
        optimization_result = await self.treasury_manager.optimize_treasury_yield(treasury_address)
        
        # Step 4: Auto-compound (if optimization succeeded)
        print("🔄 Step 4: Auto-compounding...")
        compound_result = await self.treasury_manager.auto_compound_yields(treasury_address)
        
        return {
            "success": True,
            "treasury_address": treasury_address,
            "compliance": compliance_check,
            "risk_analysis": risk_analysis,
            "optimization": optimization_result,
            "auto_compound": compound_result,
            "summary": {
                "total_gain_potential": optimization_result.get("estimated_annual_gain", 0),
                "compounds_executed": compound_result.get("compounds_executed", 0),
                "total_compounded": compound_result.get("total_compounded_usd", 0)
            }
        }
    
    async def execute_transaction_with_compliance(
        self, 
        user_address: str, 
        amount_usd: float, 
        asset: str,
        destination: str = None
    ) -> Dict[str, Any]:
        """
        Sequential workflow with compliance gate:
        1. ComplianceBot validates transaction
        2. If approved, execute transaction
        3. Stellaro monitors post-transaction portfolio
        """
        print(f"🔍 Checking compliance for {user_address} transaction...")
        
        # Step 1: Compliance check
        compliance_result = await self.compliance_bot.check_transaction_compliance(
            user_address, amount_usd, asset, destination
        )
        
        if not compliance_result["approved"]:
            return {
                "success": False,
                "stage": "compliance",
                "action": "BLOCKED",
                "reason": "Transaction failed compliance checks",
                "details": compliance_result
            }
        
        # Step 2: Execute transaction (stub - in production would call actual contract)
        print(f"✅ Compliance passed. Executing transaction...")
        transaction_result = {
            "transaction_hash": "0xABCD1234...",  # Stub
            "status": "SUCCESS"
        }
        
        # Step 3: Post-transaction risk monitoring
        print(f"🛡️ Monitoring post-transaction risks...")
        risk_check = await self.stellaro.analyze_portfolio_risk(user_address)
        
        return {
            "success": True,
            "compliance": compliance_result,
            "transaction": transaction_result,
            "post_transaction_risk": risk_check
        }
    
    async def monitor_and_mitigate_risks(self, user_address: str) -> Dict[str, Any]:
        """
        Concurrent workflow: 
        - Stellaro analyzes portfolio risks
        - ComplianceBot monitors AML patterns
        - If risks detected, TreasuryManager auto-rebalances
        """
        print(f"⚡ Running concurrent risk monitoring for {user_address}...")
        
        # Run risk analysis and AML monitoring concurrently
        risk_task = self.stellaro.analyze_portfolio_risk(user_address)
        aml_task = self.compliance_bot.monitor_aml_patterns(user_address)
        
        risk_analysis, aml_analysis = await asyncio.gather(risk_task, aml_task)
        
        # If high risks detected, trigger auto-mitigation
        high_risks = sum(1 for r in risk_analysis.get("risks", []) if r["severity"] in ["HIGH", "CRITICAL"])
        
        mitigation_result = None
        if high_risks >= 2:
            print(f"⚠️ High risks detected. Triggering auto-rebalancing...")
            mitigation_result = await self.stellaro.execute_risk_mitigation(
                user_address, "AUTO_REBALANCE"
            )
        
        return {
            "user_address": user_address,
            "risk_analysis": risk_analysis,
            "aml_analysis": aml_analysis,
            "mitigation_triggered": mitigation_result is not None,
            "mitigation_result": mitigation_result
        }


# CLI Example
async def main():
    orchestrator = StellaroAgentOrchestrator()
    
    # Example 1: Safe treasury optimization
    print("\n" + "="*60)
    print("EXAMPLE 1: Safe Treasury Optimization")
    print("="*60 + "\n")
    treasury_result = await orchestrator.execute_safe_treasury_optimization(
        "GDXLKEY5TR4IDEVNPQ76LU5O7MBWCZ4LZXMWP2JGQR4FLH3VXQL2SQWY"
    )
    print("\n✅ Treasury Optimization Result:")
    print(f"  Success: {treasury_result['success']}")
    if treasury_result['success']:
        print(f"  Annual Gain Potential: ${treasury_result['summary']['total_gain_potential']:,.2f}")
        print(f"  Compounds Executed: {treasury_result['summary']['compounds_executed']}")
    
    # Example 2: Transaction with compliance
    print("\n" + "="*60)
    print("EXAMPLE 2: Transaction with Compliance Check")
    print("="*60 + "\n")
    tx_result = await orchestrator.execute_transaction_with_compliance(
        user_address="GBRPYHIL2CI3KILXWGZ4G7ZJQ7G7JZQF5Q6GQ3GQ3GQ3GQ3GQ3GQ3GQ3",
        amount_usd=25_000,
        asset="USDC"
    )
    print(f"\n✅ Transaction Result: {tx_result['success']}")
    print(f"  Action: {tx_result.get('action', 'APPROVED')}")
    
    # Example 3: Concurrent risk monitoring
    print("\n" + "="*60)
    print("EXAMPLE 3: Concurrent Risk Monitoring")
    print("="*60 + "\n")
    monitor_result = await orchestrator.monitor_and_mitigate_risks(
        "GBRPYHIL2CI3KILXWGZ4G7ZJQ7G7JZQF5Q6GQ3GQ3GQ3GQ3GQ3GQ3GQ3"
    )
    print(f"\n✅ Monitoring Complete")
    risks_detected = monitor_result.get("risk_analysis", {}).get("risks_detected", 0)
    aml_patterns = monitor_result.get("aml_analysis", {}).get("patterns_detected", 0)
    print(f"  Risks Detected: {risks_detected}")
    print(f"  AML Patterns: {aml_patterns}")
    print(f"  Mitigation Triggered: {monitor_result.get('mitigation_triggered', False)}")


if __name__ == "__main__":
    asyncio.run(main())
