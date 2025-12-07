"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { CheckCircle, Clock, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { LinearProgress } from "@/components/ui/progress";

export default function GovernanceVotePage() {
  const t = useTranslations("governance");
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockProposals = [
      {
        id: 1,
        title: "Increase APY to 9% for 90 days",
        description: "Boost yields to attract more liquidity during low market conditions",
        status: "Active",
        votesFor: 2800,
        votesAgainst: 200,
        totalVotes: 3000,
        daysRemaining: 5,
        quorum: 80,
        votedYes: false,
        yourTokens: 100,
      },
      {
        id: 2,
        title: "Enable flash loan feature",
        description: "Allow atomic flash loans for advanced trading strategies",
        status: "Active",
        votesFor: 3200,
        votesAgainst: 300,
        totalVotes: 3500,
        daysRemaining: 3,
        quorum: 70,
        votedYes: true,
        yourTokens: 100,
      },
      {
        id: 3,
        title: "Reduce reserve requirement to 115%",
        description: "Optimize capital efficiency while maintaining safety",
        status: "Pending",
        votesFor: 1500,
        votesAgainst: 1000,
        totalVotes: 2500,
        daysRemaining: 10,
        quorum: 75,
        votedYes: false,
        yourTokens: 100,
      },
    ];

    setProposals(mockProposals);
    setLoading(false);
  }, []);

  const handleVote = (proposalId: number, vote: boolean) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              votedYes: vote,
              votesFor: vote ? p.votesFor + 100 : p.votesFor,
              votesAgainst: !vote ? p.votesAgainst + 100 : p.votesAgainst,
            }
          : p
      )
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t("vote.title")}</h1>
          <p className="text-gray-400">{t("vote.subtitle")}</p>
        </div>

        {/* Voting Power Card */}
        <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-blue-200 text-sm">Voting Tokens</p>
                <p className="text-3xl font-bold">100 STLT</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Voting Power</p>
                <p className="text-3xl font-bold">0.33%</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Proposals Voted</p>
                <p className="text-3xl font-bold">1 of 3</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Voting Status</p>
                <p className="text-xl font-bold text-green-300">Active ✓</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Proposals */}
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const forPercent = (proposal.votesFor / proposal.totalVotes) * 100;
            const againstPercent = (proposal.votesAgainst / proposal.totalVotes) * 100;

            return (
              <Card key={proposal.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {proposal.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm">
                        {proposal.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          proposal.status === "Active"
                            ? "bg-green-900 text-green-200"
                            : "bg-blue-900 text-blue-200"
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Voting Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-green-400">
                          <ThumbsUp className="w-4 h-4" />
                          For
                        </span>
                        <span className="text-sm">
                          {proposal.votesFor.toLocaleString()} ({forPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${forPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-red-400">
                          <ThumbsDown className="w-4 h-4" />
                          Against
                        </span>
                        <span className="text-sm">
                          {proposal.votesAgainst.toLocaleString()} (
                          {againstPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${againstPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quorum */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">
                        Quorum ({proposal.quorum}%)
                      </span>
                      <span className="text-sm font-semibold">
                        {((proposal.totalVotes / 5000) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((proposal.totalVotes / 5000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Voting Time */}
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {proposal.daysRemaining} days remaining
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    {proposal.votedYes ? (
                      <div className="flex items-center gap-2 text-green-400 flex-1">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">You voted FOR</span>
                      </div>
                    ) : proposal.votedYes === false && proposal.status === "Active" ? (
                      <>
                        <Button
                          onClick={() => handleVote(proposal.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Vote For
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Vote Against
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          disabled
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Vote For
                        </Button>
                        <Button
                          disabled
                          variant="outline"
                          className="flex-1"
                        >
                          Vote Against
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Voting History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Your Voting History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  title: "Enable flash loan feature",
                  date: "Dec 5, 2025",
                  vote: "FOR",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-700 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-gray-400">{item.date}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-200">
                    {item.vote}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
