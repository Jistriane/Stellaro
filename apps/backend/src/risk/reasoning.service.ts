import { Injectable } from '@nestjs/common';
import type { DecideDto } from './dto/decide.dto';
import type { DecisionProposal, ProposedAction } from './risk.service';

@Injectable()
export class ReasoningService {
  decide(input: DecideDto): DecisionProposal {
    // Heurística simples (stub). Depois: features + regras + modelos.
    const actions: ProposedAction[] = [];
    if (input.preferences?.includes('minimize_volatility')) {
      actions.push({
        type: 'hedge',
        asset: 'XLM',
        amount: '10%',
        rationale: 'minimize_volatility',
      });
    } else {
      actions.push({
        type: 'rebalance',
        asset: 'XLM',
        target: '60%',
        rationale: 'default_policy',
      });
    }

    const confidence = input.preferences?.includes('minimize_volatility')
      ? 0.75
      : 0.65;
    return {
      proposalId: 'rz-' + Math.random().toString(36).slice(2, 8),
      confidence,
      actions,
    };
  }
}
