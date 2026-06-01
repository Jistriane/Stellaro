"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface VotingPanelProps {
  proposalId: string;
  title: string;
}

export function VotingPanel({ proposalId, title }: VotingPanelProps) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Votar na Proposta: {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2 text-sm text-muted-foreground">
          Voting está desabilitado neste build para evitar transações simuladas. Habilite apenas quando houver fluxo on-chain real (assinatura via wallet e submit/track de transação).
        </div>
        <div className="flex gap-4">
          <Button disabled className="flex-1">
            Favorável (Yes)
          </Button>
          <Button disabled variant="destructive" className="flex-1">
            Contrário (No)
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">ProposalId: {proposalId}</div>
      </CardContent>
    </Card>
  );
}
