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
  difficulty: "Fácil" | "Médio" | "Difícil";
  category: string;
  thumbnail: string;
}

export default function LearnPage() {
  const t = useTranslations("learn");
  const [activeCategory, setActiveCategory] = useState("all");

  const courses: Course[] = [
    {
      id: "course-1",
      title: "Introdução ao Stellaro",
      description:
        "Aprenda os fundamentos da plataforma Stellaro e como começar a usar.",
      instructor: "Equipe Stellaro",
      duration: "2 horas",
      level: "beginner",
      icon: <BookOpen className="w-6 h-6" />,
      rating: 4.9,
      students: 2341,
      lessons: 8,
    },
    {
      id: "course-2",
      title: "Trading DeFi Avançado",
      description:
        "Estratégias de trading avançadas, análise técnica e gerenciamento de risco.",
      instructor: "Dr. Analista Crypto",
      duration: "5 horas",
      level: "advanced",
      icon: <TrendingUp className="w-6 h-6" />,
      rating: 4.8,
      students: 1563,
      lessons: 12,
    },
    {
      id: "course-3",
      title: "Segurança em Criptomoedas",
      description:
        "Proteja seus ativos com melhores práticas de segurança e gerenciamento de chaves.",
      instructor: "Prof. Segurança",
      duration: "3 horas",
      level: "beginner",
      icon: <Zap className="w-6 h-6" />,
      rating: 4.9,
      students: 3421,
      lessons: 10,
    },
    {
      id: "course-4",
      title: "Gestão de Portfólio DeFi",
      description:
        "Como construir e gerenciar um portfólio diversificado em DeFi.",
      instructor: "Gestor de Carteiras",
      duration: "4 horas",
      level: "intermediate",
      icon: <Award className="w-6 h-6" />,
      rating: 4.7,
      students: 1892,
      lessons: 11,
    },
    {
      id: "course-5",
      title: "Empréstimos e Colateral",
      description:
        "Entenda como funcionam empréstimos, colateral e liquidação em DeFi.",
      instructor: "Especialista Financeiro",
      duration: "3.5 horas",
      level: "intermediate",
      icon: <BookOpen className="w-6 h-6" />,
      rating: 4.8,
      students: 2134,
      lessons: 9,
    },
    {
      id: "course-6",
      title: "Governança e DAO",
      description:
        "Participe da governança, entenda votação e propostas em DAOs.",
      instructor: "Especialista DAO",
      duration: "2.5 horas",
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
      title: "Como Conectar Sua Carteira",
      description: "Passo a passo para conectar diferentes carteiras ao Stellaro",
      duration: "5 min",
      difficulty: "Fácil",
      category: "Getting Started",
      thumbnail: "🔗",
    },
    {
      id: "tut-2",
      title: "Sua Primeira Transação",
      description: "Realize sua primeira transação de forma segura",
      duration: "8 min",
      difficulty: "Fácil",
      category: "Getting Started",
      thumbnail: "💳",
    },
    {
      id: "tut-3",
      title: "Configurar Segurança 2FA",
      description: "Proteja sua conta com autenticação de dois fatores",
      duration: "6 min",
      difficulty: "Fácil",
      category: "Segurança",
      thumbnail: "🔐",
    },
    {
      id: "tut-4",
      title: "Estratégia de Yield Farming",
      description: "Maximize seus rendimentos com yield farming",
      duration: "15 min",
      difficulty: "Médio",
      category: "Trading",
      thumbnail: "🌾",
    },
    {
      id: "tut-5",
      title: "Liquidez em Pools",
      description: "Como fornecer liquidez e ganhar comissões",
      duration: "12 min",
      difficulty: "Médio",
      category: "Trading",
      thumbnail: "💧",
    },
    {
      id: "tut-6",
      title: "Estratégia Avançada de Colateral",
      description: "Técnicas avançadas para otimizar seu colateral",
      duration: "20 min",
      difficulty: "Difícil",
      category: "Empréstimos",
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
      case "Fácil":
        return "bg-green-500/20 text-green-700";
      case "Médio":
        return "bg-yellow-500/20 text-yellow-700";
      case "Difícil":
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
                        ? "Iniciante"
                        : course.level === "intermediate"
                          ? "Intermediário"
                          : "Avançado"}
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
                      <span>{course.lessons} aulas</span>
                    </div>
                    <div className="text-muted-foreground">
                      {course.students.toLocaleString("pt-BR")} alunos
                    </div>
                  </div>
                  <Button className="w-full">Começar Curso</Button>
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
              Tudo
            </Button>
            <Button
              variant={activeCategory === "Getting Started" ? "default" : "outline"}
              onClick={() => setActiveCategory("Getting Started")}
              size="sm"
            >
              Começando
            </Button>
            <Button
              variant={activeCategory === "Trading" ? "default" : "outline"}
              onClick={() => setActiveCategory("Trading")}
              size="sm"
            >
              Trading
            </Button>
            <Button
              variant={activeCategory === "Segurança" ? "default" : "outline"}
              onClick={() => setActiveCategory("Segurança")}
              size="sm"
            >
              Segurança
            </Button>
            <Button
              variant={activeCategory === "Empréstimos" ? "default" : "outline"}
              onClick={() => setActiveCategory("Empréstimos")}
              size="sm"
            >
              Empréstimos
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
                        Ver Vídeo <ArrowRight className="w-3 h-3 ml-1" />
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
                Webinários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Assista webinários ao vivo com especialistas da comunidade
              </p>
              <Button variant="outline" size="sm">
                Ver Webinários
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5" />
                Artigos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Leia artigos aprofundados sobre DeFi e Stellaro
              </p>
              <Button variant="outline" size="sm">
                Ler Artigos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Comunidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte-se com outros usuários e compartilhe experiências
              </p>
              <Button variant="outline" size="sm">
                Entrar na Comunidade
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
