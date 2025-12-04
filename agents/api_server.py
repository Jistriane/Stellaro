"""
FastAPI server for Stellaro Multi-Agent System
Exposes orchestrator endpoints for backend integration
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
from orchestrator import StellaroAgentOrchestrator

app = FastAPI(title="Stellaro Multi-Agent API", version="1.0.0")
orchestrator = StellaroAgentOrchestrator()


# ============================================
# Request/Response Models
# ============================================

class AgentActionRequest(BaseModel):
    agent: str  # 'stellaro', 'treasury_manager', 'compliance_bot'
    action: str
    payload: Dict[str, Any]


class WorkflowRequest(BaseModel):
    workflow: str  # 'safe_optimization', 'transaction_compliance', 'monitor_mitigate'
    payload: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    version: str
    agents: Dict[str, str]


# ============================================
# Health & Status Endpoints
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "agents": {
            "stellaro": "active",
            "treasury_manager": "active",
            "compliance_bot": "active",
        },
    }


@app.get("/")
async def root():
    return {
        "service": "Stellaro Multi-Agent API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ============================================
# Agent Action Endpoints
# ============================================

@app.post("/agent/action")
async def trigger_agent_action(request: AgentActionRequest):
    """
    Trigger a specific agent action
    
    Examples:
    - agent: 'stellaro', action: 'analyze_risk'
    - agent: 'treasury_manager', action: 'optimize_yield'
    - agent: 'compliance_bot', action: 'check_compliance'
    """
    try:
        agent = request.agent.lower()
        action = request.action
        payload = request.payload
        
        if agent == "stellaro":
            if action == "analyze_risk":
                result = await orchestrator.stellaro.analyze_portfolio_risk(
                    payload.get("user_address", "")
                )
            elif action == "execute_mitigation":
                result = await orchestrator.stellaro.execute_risk_mitigation(
                    payload.get("user_address", ""),
                    payload.get("action_type", "")
                )
            else:
                raise HTTPException(
                    status_code=400, detail=f"Unknown action '{action}' for agent '{agent}'"
                )
        
        elif agent == "treasury_manager":
            if action == "optimize_yield":
                result = await orchestrator.treasury_manager.optimize_treasury_yield(
                    payload.get("treasury_address", "")
                )
            elif action == "auto_compound":
                result = await orchestrator.treasury_manager.auto_compound_yields(
                    payload.get("treasury_address", "")
                )
            else:
                raise HTTPException(
                    status_code=400, detail=f"Unknown action '{action}' for agent '{agent}'"
                )
        
        elif agent == "compliance_bot":
            if action == "check_compliance":
                result = await orchestrator.compliance_bot.check_transaction_compliance(
                    payload.get("user_address", ""),
                    payload.get("amount_usd", 0),
                    payload.get("asset", ""),
                    payload.get("destination")
                )
            elif action == "monitor_aml":
                result = await orchestrator.compliance_bot.monitor_aml_patterns(
                    payload.get("user_address", "")
                )
            else:
                raise HTTPException(
                    status_code=400, detail=f"Unknown action '{action}' for agent '{agent}'"
                )
        
        else:
            raise HTTPException(
                status_code=400, detail=f"Unknown agent '{agent}'"
            )
        
        return {
            "success": True,
            "agent": agent,
            "action": action,
            "result": result,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Workflow Orchestration Endpoints
# ============================================

@app.post("/orchestrate/workflow")
async def orchestrate_workflow(request: WorkflowRequest):
    """
    Execute complex multi-agent workflows
    
    Workflows:
    - 'safe_optimization': Compliance → Risk → Yield optimization
    - 'transaction_compliance': Compliance gate → Execute → Risk monitoring
    - 'monitor_mitigate': Concurrent risk & AML monitoring → Auto-mitigation
    """
    try:
        workflow = request.workflow.lower()
        payload = request.payload
        
        if workflow == "safe_optimization":
            treasury_address = payload.get("treasury_address")
            if not treasury_address:
                raise HTTPException(
                    status_code=400, detail="treasury_address required for safe_optimization"
                )
            
            result = await orchestrator.execute_safe_treasury_optimization(treasury_address)
        
        elif workflow == "transaction_compliance":
            user_address = payload.get("user_address")
            amount_usd = payload.get("amount_usd")
            asset = payload.get("asset")
            
            if not all([user_address, amount_usd, asset]):
                raise HTTPException(
                    status_code=400,
                    detail="user_address, amount_usd, asset required for transaction_compliance",
                )
            
            result = await orchestrator.execute_transaction_with_compliance(
                user_address,
                amount_usd,
                asset,
                payload.get("destination")
            )
        
        elif workflow == "monitor_mitigate":
            user_address = payload.get("user_address")
            if not user_address:
                raise HTTPException(
                    status_code=400, detail="user_address required for monitor_mitigate"
                )
            
            result = await orchestrator.monitor_and_mitigate_risks(user_address)
        
        else:
            raise HTTPException(
                status_code=400, detail=f"Unknown workflow '{workflow}'"
            )
        
        return {
            "success": True,
            "workflow": workflow,
            "result": result,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Direct Orchestrator Endpoints (Convenience)
# ============================================

@app.post("/treasury/optimize")
async def optimize_treasury(treasury_address: str):
    """Quick endpoint for treasury optimization"""
    result = await orchestrator.execute_safe_treasury_optimization(treasury_address)
    return result


@app.post("/transaction/check")
async def check_transaction(
    user_address: str,
    amount_usd: float,
    asset: str,
    destination: Optional[str] = None
):
    """Quick endpoint for transaction compliance check"""
    result = await orchestrator.execute_transaction_with_compliance(
        user_address, amount_usd, asset, destination
    )
    return result


@app.post("/risk/monitor")
async def monitor_risks(user_address: str):
    """Quick endpoint for risk monitoring and mitigation"""
    result = await orchestrator.monitor_and_mitigate_risks(user_address)
    return result


# ============================================
# Server Startup
# ============================================

if __name__ == "__main__":
    import os
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"""
    🚀 Stellaro Multi-Agent API Server
    ===================================
    Host: {host}
    Port: {port}
    Docs: http://{host}:{port}/docs
    
    Available Agents:
    - Stellaro (Risk Analysis & Mitigation)
    - Treasury Manager (Yield Optimization)
    - Compliance Bot (AML/KYC Checks)
    
    Ready to serve! 🌟
    """)
    
    uvicorn.run(app, host=host, port=port, log_level="info")
