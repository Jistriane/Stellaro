"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Lock,
  Eye,
  Palette,
  Code,
  Shield,
  LogOut,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function SettingsAdvancedPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("security");
  const [copied, setCopied] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  useEffect(() => {
    const mockApiKeys = [
      {
        id: "key-1",
        name: "Trading Bot",
        key: "stripe_mock_key_removed...***",
        fullKey: "stripe_mock_key_removed",
        created: "2025-10-15",
        lastUsed: "2 hours ago",
        status: "active",
      },
      {
        id: "key-2",
        name: "Analytics Dashboard",
        key: "stripe_mock_key_removed...***",
        fullKey: "stripe_mock_key_removed",
        created: "2025-09-20",
        lastUsed: "30 minutes ago",
        status: "active",
      },
      {
        id: "key-3",
        name: "Archive Key",
        key: "stripe_mock_key_removed...***",
        fullKey: "stripe_mock_key_removed",
        created: "2025-08-10",
        lastUsed: "Never",
        status: "inactive",
      },
    ];

    setApiKeys(mockApiKeys);
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const walletAddress = "stellar1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">Advanced settings and integrations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap border-b border-border">
          {[
            { id: "security", label: "Security", icon: Lock },
            { id: "api", label: "API Keys", icon: Code },
            { id: "integrations", label: "Integrations", icon: RefreshCw },
            { id: "privacy", label: "Privacy", icon: Eye },
            { id: "appearance", label: "Appearance", icon: Palette },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Two-Factor Auth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">TOTP/Authenticator app</p>
                  </div>
                  <Badge className="bg-primary/10 border border-primary/25 text-primary">✓ Enabled</Badge>
                </div>
                <Button variant="outline" size="sm">
                  Reconfigure
                </Button>
              </CardContent>
            </Card>

            {/* Wallet Security */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Address & Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="public-address">Public Address</label>
                  <div className="flex gap-2">
                    <input
                      id="public-address"
                      type="text"
                      value={walletAddress}
                      title="Your public wallet address"
                      aria-label="Public wallet address"
                      readOnly
                      className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyKey(walletAddress)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="private-key">Private Key</label>
                  <div className="flex gap-2">
                    <input
                      id="private-key"
                      type={showPrivateKey ? "text" : "password"}
                      value="•••••••••••••••••••••••••••••••••••••••"
                      title="Your private key (hidden)"
                      aria-label="Private key"
                      readOnly
                      className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Never share your private key with anyone
                  </p>
                </div>

                <Button variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rotate Private Key
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Safari on macOS</p>
                    <p className="text-xs text-muted-foreground">IP: 192.168.1.1 • Last active: now</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 border-primary/25 text-primary">
                    Current
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Chrome on Windows</p>
                    <p className="text-xs text-muted-foreground">IP: 203.0.113.42 • Last active: 2 days ago</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold mb-1">API Keys</h3>
                <p className="text-sm text-muted-foreground">Manage your API keys for integrations</p>
              </div>
              <Button size="sm">
                + New Key
              </Button>
            </div>

            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Created {key.created}</p>
                    </div>
                    <Badge
                      variant={key.status === "active" ? "default" : "outline"}
                      className={key.status === "active" ? "bg-primary/10 border border-primary/25 text-primary" : "bg-secondary/30 border border-border/60 text-foreground"}
                    >
                      {key.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Key</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={key.key}
                        readOnly
                        title="API Key"
                        aria-label="API Key value"
                        className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyKey(key.fullKey)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last used: {key.lastUsed}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-4">
            {[
              {
                name: "GitHub",
                connected: true,
                icon: "🐙",
                description: "Connect your GitHub account",
              },
              {
                name: "Discord",
                connected: false,
                icon: "📱",
                description: "Get alerts via Discord",
              },
              {
                name: "Telegram",
                connected: true,
                icon: "✈️",
                description: "Receive notifications on Telegram",
              },
              {
                name: "Email",
                connected: true,
                icon: "📧",
                description: "Email notifications",
              },
            ].map((integration) => (
              <Card key={integration.name}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={integration.connected ? "outline" : "default"}
                  >
                    {integration.connected ? "Disconnect" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            {[
              {
                title: "Data Collection",
                description: "Allow Stellaro to collect usage analytics",
                enabled: true,
              },
              {
                title: "Profile Visibility",
                description: "Make your profile visible in governance voting",
                enabled: true,
              },
              {
                title: "Transaction History",
                description: "Public blockchain transactions are always visible",
                enabled: true,
              },
              {
                title: "Marketing Communications",
                description: "Receive updates about new features",
                enabled: false,
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border/60">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    id={`privacy-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
                    title={item.title}
                    aria-label={item.description}
                    defaultChecked={item.enabled}
                    className="w-5 h-5 rounded"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle>Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Dark", color: "bg-background" },
                    { name: "Light", color: "bg-secondary" },
                    { name: "System", color: "bg-gradient-to-r from-background to-secondary" },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme.name === "Dark"
                          ? "border-primary"
                          : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-full h-20 rounded ${theme.color} mb-2`} />
                      <p className="text-sm font-medium">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle>Compact Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Reduce spacing and font sizes</p>
                  <input type="checkbox" id="compact-mode" title="Compact mode" aria-label="Reduce spacing and font sizes" className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle>Language</CardTitle>
              </CardHeader>
              <CardContent>
                <select id="language-select" title="Select language" aria-label="Select language" className="w-full px-3 py-2 bg-secondary/30 border border-border/60 rounded text-foreground focus:outline-none focus:border-primary">
                  <option>English (US)</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Danger Zone */}
        <Card className="bg-destructive/10 border-destructive/25">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout All Sessions
            </Button>
            <Button variant="outline" className="w-full text-destructive border-destructive/40 hover:bg-destructive/10">
              Delete Account & Data
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Discard</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
        </div>
      </div>
      </div>
    </div>
  );
}
