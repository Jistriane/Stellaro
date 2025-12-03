import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import axios from "axios";

interface ComplianceCheckResult {
  userAddress: string;
  amountUsd: number;
  asset: string;
  approved: boolean;
  riskScore: number;
  violations: Array<{
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    [key: string]: any;
  }>;
  action: "APPROVE" | "BLOCK";
}

export const checkTransactionComplianceAction: Action = {
  name: "CHECK_TRANSACTION_COMPLIANCE",
  similes: [
    "VALIDATE_TRANSACTION",
    "CHECK_KYC",
    "COMPLIANCE_CHECK",
    "CAN_I_SEND",
  ],
  description: "Checks if a transaction meets compliance requirements and regulatory limits",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const { userAddress, amount, asset } = message.content;
    return !!(userAddress && amount && asset);
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
      const { userAddress, amount, asset, destination } = message.content;
      
      // Checa compliance via backend
      const response = await axios.post<ComplianceCheckResult>(
        `${backendUrl}/compliance/check-transaction`,
        {
          userAddress,
          amountUsd: amount,
          asset,
          destination,
        }
      );
      
      const result = response.data;
      
      // Formata resposta baseada no resultado
      let emoji = result.approved ? "✅" : "🔴";
      let responseText = `${emoji} Transaction Compliance Check\n\n`;
      responseText += `Amount: $${result.amountUsd.toLocaleString()}\n`;
      responseText += `Asset: ${result.asset}\n`;
      responseText += `Risk Score: ${result.riskScore}/100\n`;
      responseText += `Status: ${result.action}\n\n`;
      
      if (result.violations.length > 0) {
        responseText += "⚠️ Violations Detected:\n";
        result.violations.forEach(violation => {
          responseText += `• ${violation.type} (${violation.severity})\n`;
          if (violation.limit) {
            responseText += `  Limit: $${violation.limit.toLocaleString()}\n`;
          }
        });
        
        if (!result.approved) {
          responseText += "\n🚫 Transaction BLOCKED for your protection.";
          responseText += "\n💡 Contact support to resolve compliance issues.";
        }
      } else {
        responseText += "✅ All compliance checks passed!";
      }
      
      callback({
        text: responseText,
        action: "CHECK_TRANSACTION_COMPLIANCE",
        metadata: {
          approved: result.approved,
          riskScore: result.riskScore,
          violationsCount: result.violations.length,
        },
      });
      
      return true;
    } catch (error) {
      console.error("Error checking transaction compliance:", error);
      callback({
        text: "❌ Failed to check transaction compliance. Please try again.",
        error: error.message,
      });
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can I send $60k USDC to this address?",
          userAddress: "GXXX...XXX",
          amount: 60000,
          asset: "USDC",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Checking compliance requirements...",
          action: "CHECK_TRANSACTION_COMPLIANCE",
        },
      },
    ],
  ],
};
