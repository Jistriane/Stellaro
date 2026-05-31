"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface VotingPanelProps {
  proposalId: string;
  title: string;
}

export function VotingPanel({ proposalId, title }: VotingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  const handleVote = async (support: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dao/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support,
          voterSecret: "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABC", // Demo
        }),
      });
      if (res.ok) setVoted(true);
    } catch (error) {
      console.error("Vote failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Votar na Proposta: {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {voted ? (
          <div className="rounded-lg bg-primary/10 p-4 text-center text-primary border border-primary/30">
            Voto registrado com sucesso on-chain!
          </div>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={() => handleVote(true)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processando..." : "Favorável (Yes)"}
            </Button>
            <Button
              onClick={() => handleVote(false)}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Processando..." : "Contrário (No)"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
