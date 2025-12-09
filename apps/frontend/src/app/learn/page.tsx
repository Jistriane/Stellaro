"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Video,
  Zap,
  Users,
  Award,
  TrendingUp,
  PlayCircle,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: "beginner" | "intermediate" | "advanced";
  icon: React.ReactNode;
  rating: number;
  students: number;
  lessons: number;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  thumbnail: string;
}

export default function LearnPage() {
  const t = useTranslations("learn");
  const [activeCategory, setActiveCategory] = useState("all");

  const courses: Course[] = [
    {
      id: "course-1",
      title: "Introduction to Stellaro",
      description:
        "Learn the fundamentals of the Stellaro platform and how to get started.",
      instructor: "Stellaro Team",
      duration: "2 hours",
      level: "beginner",
      icon: <BookOpen className="w-6 h-6" />,
      rating: 4.9,
      students: 2341,
      lessons: 8,
    },
    {
      id: "course-2",
      title: "Advanced DeFi Trading",
      description:
        "Advanced trading strategies, technical analysis, and risk management.",
      instructor: "Dr. Crypto Analyst",
      duration: "5 hours",
      level: "advanced",
      icon: <TrendingUp className="w-6 h-6" />,
      rating: 4.8,
      students: 1563,
      lessons: 12,
    },
    {
      id: "course-3",
      title: "Crypto Security",
      description:
        "Protect your assets with best security practices and key management.",
      instructor: "Security Professor",
      duration: "3 hours",
      level: "beginner",
      icon: <Zap className="w-6 h-6" />,
      rating: 4.9,
      students: 3421,
      lessons: 10,
    },
    {
      id: "course-4",
      title: "DeFi Portfolio Management",
      description:
        "How to build and manage a diversified DeFi portfolio.",
      instructor: "Portfolio Manager",
      duration: "4 hours",
      level: "intermediate",
      icon: <Award className="w-6 h-6" />,
      rating: 4.7,
      students: 1892,
      lessons: 11,
    },
    {
      id: "course-5",
      title: "Loans and Collateral",
      description:
        "Understand how loans, collateral, and liquidation work in DeFi.",
      instructor: "Financial Specialist",
      duration: "3.5 hours",
      level: "intermediate",
      icon: <BookOpen className="w-6 h-6" />,
      rating: 4.8,
      students: 2134,
      lessons: 9,
    },
    {
      id: "course-6",
      title: "Governance and DAOs",
      description:
        "Participate in governance, understand voting and proposals in DAOs.",
      instructor: "DAO Specialist",
      duration: "2.5 hours",
      level: "beginner",
      icon: <Users className="w-6 h-6" />,
      rating: 4.6,
      students: 1645,
      lessons: 7,
    },
  ];

  const tutorials: Tutorial[] = [
    {
      id: "tut-1",
      title: "How to Connect Your Wallet",
      description: "Step-by-step guide to connect different wallets to Stellaro",
      duration: "5 min",
      difficulty: "Easy",
      category: "Getting Started",
      thumbnail: "🔗",
    },
    {
      id: "tut-2",
      title: "Your First Transaction",
      description: "Make your first transaction securely",
      duration: "8 min",
      difficulty: "Easy",
      category: "Getting Started",
      thumbnail: "💳",
    },
    {
      id: "tut-3",
      title: "Set Up 2FA Security",
      description: "Protect your account with two-factor authentication",
      duration: "6 min",
      difficulty: "Easy",
      category: "Security",
      thumbnail: "🔐",
    },
    {
      id: "tut-4",
      title: "Yield Farming Strategy",
      description: "Maximize your returns with yield farming",
      duration: "15 min",
      difficulty: "Medium",
      category: "Trading",
      thumbnail: "🌾",
    },
    {
      id: "tut-5",
      title: "Liquidity in Pools",
      description: "How to provide liquidity and earn fees",
      duration: "12 min",
      difficulty: "Medium",
      category: "Trading",
      thumbnail: "💧",
    },
    {
      id: "tut-6",
      title: "Advanced Collateral Strategy",
      description: "Advanced techniques to optimize your collateral",
      duration: "20 min",
      difficulty: "Hard",
      category: "Loans",
      thumbnail: "⚙️",
    },
  ];

  const filteredTutorials =
    activeCategory === "all"
      ? tutorials
      : tutorials.filter((t) => t.category === activeCategory);

  const getLevelColor = (
    level: "beginner" | "intermediate" | "advanced"
  ) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/20 text-green-700";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-700";
      case "advanced":
        return "bg-red-500/20 text-red-700";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-700";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-700";
      case "Hard":
        return "bg-red-500/20 text-red-700";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>

        {/* Courses Section */}
        <div className="space-y-6 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t("courses.title")}</h2>
            <p className="text-muted-foreground">{t("courses.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      {course.icon}
                    </div>
                    <div
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        getLevelColor(course.level)
                      }`}
                    >
                      {course.level === "beginner"
                        ? "Beginner"
                        : course.level === "intermediate"
                          ? "Intermediate"
                          : "Advanced"}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {course.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{course.instructor}</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {course.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </span>
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="text-muted-foreground">
                      {course.students.toLocaleString("en-US")} students
                    </div>
                  </div>
                  <Button className="w-full">Start Course</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tutorials Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t("tutorials.title")}</h2>
            <p className="text-muted-foreground">{t("tutorials.subtitle")}</p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={activeCategory === "Getting Started" ? "default" : "outline"}
              onClick={() => setActiveCategory("Getting Started")}
              size="sm"
            >
              Getting Started
            </Button>
            <Button
              variant={activeCategory === "Trading" ? "default" : "outline"}
              onClick={() => setActiveCategory("Trading")}
              size="sm"
            >
              Trading
            </Button>
            <Button
              variant={activeCategory === "Security" ? "default" : "outline"}
              onClick={() => setActiveCategory("Security")}
              size="sm"
            >
              Security
            </Button>
            <Button
              variant={activeCategory === "Loans" ? "default" : "outline"}
              onClick={() => setActiveCategory("Loans")}
              size="sm"
            >
              Loans
            </Button>
          </div>

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="text-4xl">{tutorial.thumbnail}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tutorial.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <PlayCircle className="w-3 h-3" />
                          {tutorial.duration}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            getDifficultyColor(tutorial.difficulty)
                          }`}
                        >
                          {tutorial.difficulty}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                        Watch Video <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-5 h-5" />
                Webinars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Watch live webinars with community specialists
              </p>
              <Button variant="outline" size="sm">
                View Webinars
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Read in-depth articles about DeFi and Stellaro
              </p>
              <Button variant="outline" size="sm">
                Read Articles
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with other users and share experiences
              </p>
              <Button variant="outline" size="sm">
                Join the Community
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
