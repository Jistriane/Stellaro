import { AgentRuntime, elizaLogger } from "@elizaos/core";
import { TelegramClient } from "@elizaos/client-telegram";
import { DiscordClient } from "@elizaos/client-discord";
import { config } from "dotenv";

// Import characters
import { stellaroRiskAgent } from "./characters/stellaro-risk.js";
import { complianceBotAgent } from "./characters/compliance-bot.js";
import { treasuryManagerAgent } from "./characters/treasury-manager.js";

// Import actions
import { analyzePortfolioRiskAction } from "./actions/analyzePortfolioRisk.js";
import { checkTransactionComplianceAction } from "./actions/checkTransactionCompliance.js";
import {
  optimizeTreasuryYieldAction,
  autoCompoundYieldsAction,
} from "./actions/optimizeTreasuryYield.js";

// Load environment variables
config();

const logger = elizaLogger.child({ module: "stellaro-agents" });

async function main() {
  logger.info("🚀 Starting Stellaro AI Agents...");

  // Validate required environment variables
  const requiredEnvVars = [
    "ANTHROPIC_API_KEY",
    "STELLAR_SECRET_KEY",
    "BACKEND_URL",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Initialize agents
  const agents = [
    {
      character: stellaroRiskAgent,
      actions: [analyzePortfolioRiskAction],
    },
    {
      character: complianceBotAgent,
      actions: [checkTransactionComplianceAction],
    },
    {
      character: treasuryManagerAgent,
      actions: [optimizeTreasuryYieldAction, autoCompoundYieldsAction],
    },
  ];

  // Create agent runtimes
  const runtimes: AgentRuntime[] = [];

  for (const { character, actions } of agents) {
    logger.info(`🤖 Initializing agent: ${character.name}`);

    const runtime = new AgentRuntime({
      character,
      actions,
      providers: [],
      databaseAdapter: null, // Can add database adapter later
      token: process.env.ANTHROPIC_API_KEY!,
      serverUrl: process.env.BACKEND_URL || "http://localhost:3001",
    });

    // Register clients
    if (character.clients?.includes("telegram" as any) && process.env.TELEGRAM_BOT_TOKEN) {
      logger.info(`📱 Registering Telegram client for ${character.name}`);
      const telegramClient = new TelegramClient(runtime, process.env.TELEGRAM_BOT_TOKEN);
      await telegramClient.start();
    }

    if (character.clients?.includes("discord" as any) && process.env.DISCORD_BOT_TOKEN) {
      logger.info(`💬 Registering Discord client for ${character.name}`);
      const discordClient = new DiscordClient(runtime, process.env.DISCORD_BOT_TOKEN);
      await discordClient.start();
    }

    runtimes.push(runtime);
    logger.info(`✅ Agent ${character.name} initialized successfully`);
  }

  logger.info(`🎉 All ${runtimes.length} agents are running!`);
  logger.info("Press Ctrl+C to stop");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("\n👋 Shutting down agents...");
    
    for (const runtime of runtimes) {
      await runtime.stop();
    }
    
    logger.info("✅ All agents stopped successfully");
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  logger.error("❌ Fatal error:", error);
  process.exit(1);
});
