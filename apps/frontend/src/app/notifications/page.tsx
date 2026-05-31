"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Lock,
  Zap,
  CheckCircle,
  Settings,
} from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const mockNotifications = [
      {
        id: "n1",
        type: "loan-liquidation",
        title: "Loan Liquidation Warning",
        message: "Your STLT-USDC loan is approaching liquidation. Current collateral ratio: 1.8x",
        timestamp: "5 minutes ago",
        read: false,
        severity: "critical",
        icon: AlertTriangle,
        color: "text-destructive",
      },
      {
        id: "n2",
        type: "apy-increase",
        title: "APY Increased",
        message: "Your DeFi pool APY increased to 45.2%. You're earning more rewards!",
        timestamp: "1 hour ago",
        read: false,
        severity: "info",
        icon: TrendingUp,
        color: "text-primary",
      },
      {
        id: "n3",
        type: "payment-reminder",
        title: "Payment Due Soon",
        message: "Your loan payment is due in 2 days. Amount: 500 STLT",
        timestamp: "2 hours ago",
        read: false,
        severity: "warning",
        icon: Bell,
        color: "text-primary",
      },
      {
        id: "n4",
        type: "transaction",
        title: "Transaction Completed",
        message: "Your bridge transaction from Stellar to Ethereum has completed successfully",
        timestamp: "5 hours ago",
        read: true,
        severity: "success",
        icon: CheckCircle,
        color: "text-primary",
      },
      {
        id: "n5",
        type: "governance",
        title: "Governance Proposal Vote",
        message: "New proposal on protocol fees. Vote now to participate!",
        timestamp: "1 day ago",
        read: true,
        severity: "info",
        icon: Zap,
        color: "text-primary",
      },
      {
        id: "n6",
        type: "security",
        title: "Login from New Device",
        message: "Your account was accessed from a new device (Safari, macOS)",
        timestamp: "2 days ago",
        read: true,
        severity: "warning",
        icon: Lock,
        color: "text-primary",
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
    setLoading(false);
  }, []);

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.severity === filter);

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.read) {
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="relative">
            <Bell className="w-8 h-8 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("total")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{notifications.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("all_time")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("unread")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{unreadCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("need_attention")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("critical")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">
                {notifications.filter((n) => n.severity === "critical").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("require_action")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            {t("all_filter")}
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            size="sm"
            className={unreadCount > 0 ? "relative" : ""}
          >
            {t("unread_filter")} {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          <Button
            variant={filter === "critical" ? "default" : "outline"}
            onClick={() => setFilter("critical")}
            size="sm"
          >
            {t("critical_filter")}
          </Button>
          <Button
            variant={filter === "warning" ? "default" : "outline"}
            onClick={() => setFilter("warning")}
            size="sm"
          >
            {t("warnings_filter")}
          </Button>
          <Button
            variant={filter === "success" ? "default" : "outline"}
            onClick={() => setFilter("success")}
            size="sm"
          >
            {t("success_filter")}
          </Button>
        </div>

        {/* Action Buttons */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-primary"
          >
            {t("mark_all_read")}
          </Button>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const IconComponent = notif.icon;
              return (
                <Card
                  key={notif.id}
                  className={`transition-all ${
                    notif.read ? "opacity-75" : "border-l-4 border-l-primary"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${notif.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{notif.title}</h3>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mt-1">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notif.timestamp}</p>
                          </div>

                          {/* Severity Badge */}
                          <div className="flex-shrink-0">
                            {notif.severity === "critical" && (
                              <Badge variant="destructive">Critical</Badge>
                            )}
                            {notif.severity === "warning" && (
                              <Badge variant="outline" className="text-primary">Warning</Badge>
                            )}
                            {notif.severity === "info" && (
                              <Badge variant="outline" className="text-primary">Info</Badge>
                            )}
                            {notif.severity === "success" && (
                              <Badge variant="secondary" className="text-primary">Success</Badge>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          {!notif.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-primary hover:text-primary/90"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {t("mark_as_read")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notif.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t("dismiss")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">{t("no_notifications")}</p>
                <p className="text-sm text-muted-foreground">
                  {filter === "all"
                    ? t("all_caught_up")
                    : t("no_match")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t("settings_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium">{t("email_notifications")}</p>
                <p className="text-sm text-muted-foreground">{t("email_desc")}</p>
              </div>
              <input type="checkbox" id="email-notif" title="Enable email notifications" aria-label="Email notifications" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium">{t("push_notifications")}</p>
                <p className="text-sm text-muted-foreground">{t("push_desc")}</p>
              </div>
              <input type="checkbox" id="push-notif" title="Enable push notifications" aria-label="Push notifications" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium">{t("critical_only")}</p>
                <p className="text-sm text-muted-foreground">{t("critical_sms")}</p>
              </div>
              <input type="checkbox" id="critical-sms" title="Only send critical alerts via SMS" aria-label="Critical alerts SMS only" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium">{t("quiet_hours")}</p>
                <p className="text-sm text-muted-foreground">{t("quiet_hours_desc")}</p>
              </div>
              <input type="checkbox" id="quiet-hours" title="Enable quiet hours" aria-label="Quiet hours" className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
