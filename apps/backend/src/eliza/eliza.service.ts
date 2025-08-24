import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MemoryService } from '../memory/memory.service';
import { ActionsService } from '../actions/actions.service';

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

  constructor(
    private readonly memory: MemoryService,
    private readonly actions: ActionsService,
  ) {}

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
    // 1) Obter sinais/eventos recentes (stub: nada por enquanto)
    // 2) Heurística/Regras simples poderiam ser chamadas via RiskService, mas aqui só registra um heartbeat
    await this.memory.logEvent('agent', 'SIGNAL_INGEST', {
      type: 'heartbeat',
      at: new Date().toISOString(),
    });

    // 3) Opcional: executar uma ação de rotina (stub desabilitado)
    // await this.actions.autoHedge({});
  }
}
