import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MemoryService } from '../memory/memory.service';
import { ActionsService } from '../actions/actions.service';
import axios from 'axios';

export interface ElizaConfig {
  name?: string;
  language?: string;
  // demais campos livres conforme config.json
  [key: string]: unknown;
}

@Injectable()
export class ElizaService implements OnModuleInit {
  private readonly logger = new Logger(ElizaService.name);
  private config: ElizaConfig | null = null;
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private agentServiceUrl: string;

  constructor(
    private readonly memory: MemoryService,
    private readonly actions: ActionsService,
  ) {
    // URL do serviço Python multi-agente
    this.agentServiceUrl =
      process.env.AGENT_SERVICE_URL ?? 'http://localhost:8000';
  }

  onModuleInit(): void {
    const customPath = process.env.ELIZA_CONFIG_PATH;
    const candidate =
      customPath ?? join(process.cwd(), 'tools', 'eliza', 'config.json');
    try {
      if (!existsSync(candidate)) {
        this.logger.warn(
          `Eliza config not found at ${candidate}. Skipping initialization.`,
        );
        return;
      }
      const raw = readFileSync(candidate, 'utf-8');
      this.config = JSON.parse(raw) as ElizaConfig;
      this.logger.log(
        `Eliza initialized for persona: ${this.config?.name ?? 'unknown'}`,
      );
      if ((process.env.ELIZA_ENABLED ?? 'true') === 'true') {
        void this.start();
      }
    } catch (err) {
      this.logger.error('Failed to initialize Eliza:', err as Error);
    }
  }

  getConfig(): ElizaConfig | null {
    return this.config;
  }

  getStatus(): { running: boolean; intervalMs: number | null } {
    return { running: this.running, intervalMs: this.timer ? 5000 : null };
  }

  start(): { started: boolean } {
    if (this.running) return { started: true };
    this.running = true;
    const intervalMs = Number(process.env.ELIZA_TICK_MS ?? '5000');
    this.timer = setInterval(() => {
      void this.tick().catch((e) =>
        this.logger.error('Eliza tick failed', e as Error),
      );
    }, intervalMs);
    
    // Prevent timer from blocking process exit in tests
    this.timer.unref();
    
    this.logger.log(`Eliza agent started. Tick interval: ${intervalMs}ms`);
    return { started: true };
  }

  stop(): { stopped: boolean } {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
    this.logger.log('Eliza agent stopped.');
    return { stopped: true };
  }

  // Núcleo do agente: exemplo simples
  private async tick(): Promise<void> {
    // 1) Heartbeat do agente na memória
    await this.memory.logEvent('agent', 'HEARTBEAT', {
      at: new Date().toISOString(),
      status: 'ACTIVE',
    });

    // 2) Simulação de Auditoria de RWA (Automática)
    if (Math.random() > 0.7) {
      await this.orchestrateWorkflow('rwa_audit_ai', {
        assetId: `RWA-${Math.floor(Math.random() * 1000)}`,
        trigger: 'periodic_audit',
      });
      this.logger.log('Eliza: RWA Audit performed automatically.');
    }

    // 3) Simulação de Monitoramento de DAO
    if (Math.random() > 0.8) {
      await this.orchestrateWorkflow('dao_governance_monitor', {
        proposalId: `dao-${Math.floor(Math.random() * 100)}`,
        trigger: 'new_proposal_detected',
      });
      this.logger.log('Eliza: DAO Governance monitoring active.');
    }
  }

  // ============================================
  // Multi-Agent Integration Methods
  // ============================================

  async triggerAgentAction(
    agent: 'stellaro' | 'treasury_manager' | 'compliance_bot',
    action: string,
    payload: Record<string, unknown>,
  ): Promise<any> {
    try {
      this.logger.log(
        `Triggering ${agent} action: ${action} with payload: ${JSON.stringify(payload)}`,
      );

      // Call Python agent service via HTTP
      const url = `${this.agentServiceUrl}/agent/action`;
      const response = await axios.post(url, {
        agent,
        action,
        payload,
      });

      // Log to memory
      await this.memory.logEvent('multi-agent', `${agent}.${action}`, {
        payload,
        result: response.data.result,
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to trigger ${agent}.${action}`,
        error as Error,
      );
      
      // Fallback to mock response for development
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Using mock response for ${agent}.${action}`);
        const mockResponse = {
          agent,
          action,
          timestamp: new Date().toISOString(),
          result: {
            success: true,
            message: `${agent}.${action} executed successfully (MOCK)`,
            payload,
          },
        };
        
        await this.memory.logEvent('multi-agent', `${agent}.${action}`, {
          payload,
          result: mockResponse.result,
          mock: true,
        });
        
        return mockResponse;
      }
      
      throw error;
    }
  }

  async orchestrateWorkflow(
    workflow:
      | 'safe_optimization'
      | 'transaction_compliance'
      | 'monitor_mitigate'
      | 'dao_governance_monitor'
      | 'rwa_audit_ai',
    payload: Record<string, unknown>,
  ): Promise<any> {
    try {
      this.logger.log(
        `Orchestrating workflow: ${workflow} with payload: ${JSON.stringify(payload)}`,
      );

      // Call Python orchestrator service via HTTP
      const url = `${this.agentServiceUrl}/orchestrate/workflow`;
      const response = await axios.post(url, {
        workflow,
        payload,
      });

      // Log to memory
      await this.memory.logEvent('orchestration', workflow, {
        payload,
        result: response.data.result,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Workflow ${workflow} failed`, error as Error);
      
      // Fallback to mock workflow execution for development
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Using mock workflow for ${workflow}`);
        
        let workflowResult;
        switch (workflow) {
          case 'safe_optimization':
            workflowResult = await this.executeSafeOptimization(payload);
            break;
          case 'transaction_compliance':
            workflowResult = await this.executeTransactionCompliance(payload);
            break;
          case 'monitor_mitigate':
            workflowResult = await this.executeMonitorMitigate(payload);
            break;
          case 'dao_governance_monitor':
            workflowResult = await this.executeDaoMonitor(payload);
            break;
          case 'rwa_audit_ai':
            workflowResult = await this.executeRwaAudit(payload);
            break;
          default:
            throw new Error(`Unknown workflow: ${workflow}`);
        }

        await this.memory.logEvent('orchestration', workflow, {
          payload,
          result: workflowResult,
          mock: true,
        });

        return {
          success: true,
          workflow,
          result: workflowResult,
        };
      }
      
      throw error;
    }
  }

  // ============================================
  // Workflow Implementations (MOCK)
  // ============================================

  private async executeSafeOptimization(
    payload: Record<string, unknown>,
  ): Promise<any> {
    const treasuryAddress = payload.treasuryAddress as string;

    // Sequential workflow: Compliance → Risk → Optimization
    const complianceCheck = { approved: true, message: 'Address verified' };
    const riskAnalysis = {
      risks_detected: 0,
      recommendation: 'Portfolio healthy',
    };
    const optimization = {
      estimated_annual_gain: 5000,
      optimization_opportunities: 3,
    };

    return {
      success: true,
      workflow: 'safe_optimization',
      treasury_address: treasuryAddress,
      steps: {
        compliance: complianceCheck,
        risk: riskAnalysis,
        optimization,
      },
      summary: {
        total_gain_potential: optimization.estimated_annual_gain,
      },
    };
  }

  private async executeTransactionCompliance(
    payload: Record<string, unknown>,
  ): Promise<any> {
    const { userAddress, amountUSD, asset } = payload;

    // Sequential workflow: Compliance → Execute → Risk
    const complianceCheck = {
      approved: true,
      risk_score: 20,
      violations: [],
    };
    const transaction = {
      transaction_hash: '0xABCD1234...',
      status: 'SUCCESS',
    };
    const postRisk = { risks_detected: 0 };

    return {
      success: true,
      workflow: 'transaction_compliance',
      user_address: userAddress,
      amount_usd: amountUSD,
      asset,
      steps: {
        compliance: complianceCheck,
        transaction,
        post_risk: postRisk,
      },
    };
  }

  private async executeMonitorMitigate(
    payload: Record<string, unknown>,
  ): Promise<any> {
    const userAddress = payload.userAddress as string;

    // Concurrent workflow: Risk + AML → Mitigation
    const riskAnalysis = { risks_detected: 1, risks: [] };
    const amlAnalysis = { patterns_detected: 0, patterns: [] };
    const mitigationTriggered = false;

    return {
      success: true,
      workflow: 'monitor_mitigate',
      user_address: userAddress,
      steps: {
        risk: riskAnalysis,
        aml: amlAnalysis,
      },
      mitigation_triggered: mitigationTriggered,
    };
  }

  private async executeDaoMonitor(
    payload: Record<string, unknown>,
  ): Promise<any> {
    const proposalId = payload.proposalId as string;
    return {
      success: true,
      workflow: 'dao_governance_monitor',
      proposal_id: proposalId,
      analysis: {
        sentiment: 'positive',
        impact_score: 85,
        risk_assessment: 'Low - Valid protocol improvement',
      },
      recommendation: 'VOTE_YES',
    };
  }

  private async executeRwaAudit(
    payload: Record<string, unknown>,
  ): Promise<any> {
    const assetId = payload.assetId as string;
    return {
      success: true,
      workflow: 'rwa_audit_ai',
      asset_id: assetId,
      audit_report: {
        legal_compliance: 'Verified',
        physical_collateral: '100% On-site confirmed',
        valuation_accuracy: '98.5%',
        fraud_risk: 'Near zero',
      },
      status: 'VERIFIED',
    };
  }
}
