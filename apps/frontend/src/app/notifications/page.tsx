"use client";

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
        color: "text-red-400",
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
        color: "text-green-400",
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
        color: "text-yellow-400",
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
        color: "text-green-400",
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
        color: "text-blue-400",
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
        color: "text-orange-400",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
            <p className="text-gray-400">{t("subtitle")}</p>
          </div>
          <div className="relative">
            <Bell className="w-8 h-8 text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{notifications.length}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">{unreadCount}</p>
              <p className="text-xs text-gray-400 mt-1">Need your attention</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">
                {notifications.filter((n) => n.severity === "critical").length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Require immediate action</p>
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
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            size="sm"
            className={unreadCount > 0 ? "relative" : ""}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          <Button
            variant={filter === "critical" ? "default" : "outline"}
            onClick={() => setFilter("critical")}
            size="sm"
          >
            Critical
          </Button>
          <Button
            variant={filter === "warning" ? "default" : "outline"}
            onClick={() => setFilter("warning")}
            size="sm"
          >
            Warnings
          </Button>
          <Button
            variant={filter === "success" ? "default" : "outline"}
            onClick={() => setFilter("success")}
            size="sm"
          >
            Success
          </Button>
        </div>

        {/* Action Buttons */}
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-blue-400"
          >
            Mark all as read
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
                  className={`border-slate-700 transition-all ${
                    notif.read ? "bg-slate-800 opacity-75" : "bg-slate-800 border-l-4 border-l-blue-500"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center ${notif.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{notif.title}</h3>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{notif.timestamp}</p>
                          </div>

                          {/* Severity Badge */}
                          <div className="flex-shrink-0">
                            {notif.severity === "critical" && (
                              <Badge className="bg-red-900 text-red-200">Critical</Badge>
                            )}
                            {notif.severity === "warning" && (
                              <Badge className="bg-yellow-900 text-yellow-200">Warning</Badge>
                            )}
                            {notif.severity === "info" && (
                              <Badge variant="outline" className="bg-blue-900 text-blue-200">
                                Info
                              </Badge>
                            )}
                            {notif.severity === "success" && (
                              <Badge className="bg-green-900 text-green-200">Success</Badge>
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
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notif.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-8 pb-8 text-center">
                <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No notifications here</p>
                <p className="text-sm text-gray-500">
                  {filter === "all"
                    ? "You're all caught up!"
                    : "No notifications match this filter."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notification Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive alerts via email</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-400">Receive browser push alerts</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Critical Only</p>
                <p className="text-sm text-gray-400">Only critical alerts via SMS</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium">Quiet Hours</p>
                <p className="text-sm text-gray-400">10:00 PM - 8:00 AM</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
