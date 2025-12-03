import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import axios from "axios";

interface YieldOptimizationResult {
  treasuryAddress: string;
  totalPositions: number;
  optimizationOpportunities: number;
  estimatedAnnualGain: number;
  optimizationPlan: Array<{
    asset: string;
    currentPool: string;
    optimalPool: string;
    currentApy: number;
    optimalApy: number;
    positionValue: number;
    estimatedAnnualGain: number;
    action: string;
  }>;
  recommendation: string;
}

export const optimizeTreasuryYieldAction: Action = {
  name: "OPTIMIZE_TREASURY_YIELD",
  similes: [
    "OPTIMIZE_YIELDS",
    "FIND_BETTER_APY",
    "MAXIMIZE_RETURNS",
    "IMPROVE_YIELDS",
  ],
  description: "Finds optimal DeFi pools for better yields and suggests migrations",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const treasuryAddress = message.content.treasuryAddress || 
                           runtime.getSetting("TREASURY_ADDRESS");
    return !!treasuryAddress;
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
      const treasuryAddress = message.content.treasuryAddress || 
                             runtime.getSetting("TREASURY_ADDRESS");
      
      // Busca otimizações do backend
      const response = await axios.get<YieldOptimizationResult>(
        `${backendUrl}/defi/treasury/optimize/${treasuryAddress}`
      );
      
      const result = response.data;
      
      let responseText = "💰 Yield Optimization Analysis\n\n";
      responseText += `📊 Total Positions: ${result.totalPositions}\n`;
      responseText += `🎯 Opportunities Found: ${result.optimizationOpportunities}\n`;
      responseText += `💵 Estimated Annual Gain: $${result.estimatedAnnualGain.toLocaleString()}\n\n`;
      
      if (result.optimizationOpportunities > 0) {
        responseText += "Migration Recommendations:\n";
        result.optimizationPlan.forEach((plan, idx) => {
          responseText += `\n${idx + 1}. ${plan.asset}\n`;
          responseText += `   Current APY: ${plan.currentApy.toFixed(2)}%\n`;
          responseText += `   Optimal APY: ${plan.optimalApy.toFixed(2)}%\n`;
          responseText += `   Gain: +$${plan.estimatedAnnualGain.toLocaleString()}/year\n`;
        });
        
        responseText += `\n💡 ${result.recommendation}`;
        responseText += `\n\n✅ Execute migrations? Reply 'yes' to proceed.`;
      } else {
        responseText += "✅ All positions already optimally allocated!";
        responseText += `\n💡 ${result.recommendation}`;
      }
      
      callback({
        text: responseText,
        action: "OPTIMIZE_TREASURY_YIELD",
        metadata: {
          opportunitiesFound: result.optimizationOpportunities,
          potentialGain: result.estimatedAnnualGain,
        },
      });
      
      return true;
    } catch (error) {
      console.error("Error optimizing treasury yield:", error);
      callback({
        text: "❌ Failed to optimize treasury yields. Please try again.",
        error: error.message,
      });
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Optimize my yields" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Analyzing pools for better APY opportunities...",
          action: "OPTIMIZE_TREASURY_YIELD",
        },
      },
    ],
  ],
};

export const autoCompoundYieldsAction: Action = {
  name: "AUTO_COMPOUND_YIELDS",
  similes: [
    "COMPOUND_REWARDS",
    "REINVEST_EARNINGS",
    "AUTO_COMPOUND",
  ],
  description: "Automatically claims and reinvests accrued yields",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
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
      
      // Executa auto-compound via backend
      const response = await axios.post(
        `${backendUrl}/defi/blend/auto-compound`,
        { userAddress }
      );
      
      const results = response.data;
      
      let responseText = "🔄 Auto-Compound Results\n\n";
      let totalCompounded = 0;
      
      results.forEach((result: any, idx: number) => {
        responseText += `${idx + 1}. ${result.asset}\n`;
        responseText += `   Claimed: $${result.amountCompounded.toFixed(2)}\n`;
        responseText += `   Redeposited: ✅\n`;
        responseText += `   TX: ${result.transactionHash.slice(0, 12)}...\n\n`;
        totalCompounded += result.amountCompounded;
      });
      
      responseText += `💰 Total Compounded: $${totalCompounded.toFixed(2)}\n`;
      responseText += `✅ All rewards successfully reinvested!`;
      
      callback({
        text: responseText,
        action: "AUTO_COMPOUND_YIELDS",
        metadata: {
          compoundsExecuted: results.length,
          totalCompounded,
        },
      });
      
      return true;
    } catch (error) {
      console.error("Error auto-compounding yields:", error);
      callback({
        text: "❌ Failed to auto-compound yields. Please try again.",
        error: error.message,
      });
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Auto-compound my rewards" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Claiming and reinvesting accrued rewards...",
          action: "AUTO_COMPOUND_YIELDS",
        },
      },
    ],
  ],
};
