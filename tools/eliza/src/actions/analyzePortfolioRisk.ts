import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import axios from "axios";

interface RiskAnalysisResult {
  userAddress: string;
  totalPositions: number;
  risksDetected: number;
  risks: Array<{
    type: string;
    asset: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    [key: string]: any;
  }>;
  recommendation: string;
}

export const analyzePortfolioRiskAction: Action = {
  name: "ANALYZE_PORTFOLIO_RISK",
  similes: [
    "CHECK_PORTFOLIO_RISK",
    "ASSESS_MY_RISK",
    "RISK_ANALYSIS",
    "PORTFOLIO_HEALTH",
  ],
  description: "Analyzes user's portfolio for DeFi risks including volatility and liquidity",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Valida se há endereço Stellar no contexto
    const userAddress = message.content.userAddress || 
                       runtime.getSetting("STELLAR_ADDRESS");
    return !!userAddress;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<boolean> => {
    try {
      const backendUrl = runtime.getSetting("backendUrl") || "http://localhost:3001";
      const userAddress = message.content.userAddress || 
                         runtime.getSetting("STELLAR_ADDRESS");
      
      // Busca análise de risco do backend
      const response = await axios.get<RiskAnalysisResult>(
        `${backendUrl}/risk/analyze/${userAddress}`
      );
      
      const analysis = response.data;
      
      // Formata resposta baseada no nível de risco
      const criticalRisks = analysis.risks.filter(r => r.severity === "CRITICAL");
      const highRisks = analysis.risks.filter(r => r.severity === "HIGH");
      
      let emoji = "✅";
      if (criticalRisks.length > 0) emoji = "🔴";
      else if (highRisks.length > 0) emoji = "⚠️";
      else if (analysis.risksDetected > 0) emoji = "🟡";
      
      let responseText = `${emoji} Portfolio Risk Analysis for ${userAddress.slice(0, 8)}...\n\n`;
      responseText += `📊 Positions: ${analysis.totalPositions}\n`;
      responseText += `⚠️ Risks Detected: ${analysis.risksDetected}\n\n`;
      
      if (analysis.risksDetected > 0) {
        responseText += "Risk Breakdown:\n";
        analysis.risks.forEach(risk => {
          responseText += `• ${risk.type}: ${risk.asset} - ${risk.severity}\n`;
        });
        responseText += `\n💡 Recommendation: ${analysis.recommendation}`;
      } else {
        responseText += "✅ No significant risks detected. Portfolio appears healthy.";
      }
      
      callback({
        text: responseText,
        action: "ANALYZE_PORTFOLIO_RISK",
        metadata: {
          risksDetected: analysis.risksDetected,
          criticalRisks: criticalRisks.length,
          highRisks: highRisks.length,
        },
      });
      
      return true;
    } catch (error) {
      console.error("Error analyzing portfolio risk:", error);
      callback({
        text: "❌ Failed to analyze portfolio risk. Please try again later.",
        error: error.message,
      });
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What's my portfolio risk?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Analyzing your portfolio for risks...",
          action: "ANALYZE_PORTFOLIO_RISK",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Check my DeFi positions for issues" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Running comprehensive risk analysis...",
          action: "ANALYZE_PORTFOLIO_RISK",
        },
      },
    ],
  ],
};
