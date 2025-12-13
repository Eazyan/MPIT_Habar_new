"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles, Send, Link as LinkIcon, Settings, Radar, History, ArrowRight, RefreshCw, AlertTriangle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrandSettings } from "@/components/brand-settings";
import { useAuth } from "@/lib/auth-context";
import { LogOut, User } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [recentPlans, setRecentPlans] = useState<any[]>([]);

  const [modelProvider, setModelProvider] = useState("claude");
  const [workMode, setWorkMode] = useState<"blogger" | "pr">("pr");
  const [targetBrand, setTargetBrand] = useState("");

  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load brand profile from API (user-specific)
    const fetchBrandProfile = async () => {
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get("/auth/profile");
        if (res.data && res.data.name) {
          setBrandName(res.data.name);
        } else {
          setBrandName("");
        }
      } catch (e) {
        console.error("Failed to fetch brand profile", e);
        setBrandName("");
      }
    };

    // Load history from Backend (using api client with auth token)
    const fetchHistory = async () => {
      try {
        const { api } = await import("@/lib/api");
        const res = await api.get("/history");
        setRecentPlans(res.data);
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };

    fetchBrandProfile();
    fetchHistory();

    const handleFocus = () => {
      fetchHistory();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [showSettings, isAuthenticated]);

  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

  const handleGenerate = async (actionMode: "link" | "monitoring") => {
    setLoading(true);
    const { api } = await import("@/lib/api");

    if (actionMode === "monitoring") {
      // For blogger mode, need target brand; for PR mode, need profile
      if (workMode === "blogger" && !targetBrand) {
        alert("Введите название бренда для поиска!");
        setLoading(false);
        return;
      }
      if (workMode === "pr" && !brandName) {
        alert("Сначала настройте профиль бренда!");
        setShowSettings(true);
        setLoading(false);
        return;
      }

      // Run Scan
      try {
        const scanParams = workMode === "blogger" ? { target_brand: targetBrand } : {};
        const res = await api.post("/monitor/scan", null, { params: scanParams });
        setScanResults(res.data);
        setShowScanResults(true);
      } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.detail || "Ошибка сканирования";
        alert(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Link Mode Logic - Async
    try {
      const payload = {
        url,
        model_provider: modelProvider,
        mode: workMode,
        target_brand: workMode === "blogger" ? targetBrand : undefined
      };

      const res = await api.post("/generate", payload);
      const taskId = res.data.id;

      // Add pending task to history immediately
      const pendingPlan = {
        id: taskId,
        status: "pending",
        url: url,
        created_at: new Date().toISOString()
      };
      setRecentPlans(prev => [pendingPlan, ...prev]);

      // Start polling for status
      pollTaskStatus(taskId);

      // Clear input
      setUrl("");

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Ошибка генерации";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Polling function for task status
  const pollTaskStatus = async (taskId: string) => {
    const { api } = await import("@/lib/api");
    const poll = async () => {
      try {
        const res = await api.get(`/task/${taskId}/status`);
        const task = res.data;

        if (task.status === "ready") {
          // Update history with completed plan
          setRecentPlans(prev => prev.map(p =>
            p.id === taskId ? { ...p, ...task.data, status: "ready" } : p
          ));
        } else if (task.status === "error") {
          // Update with error
          setRecentPlans(prev => prev.map(p =>
            p.id === taskId ? { ...p, status: "error", error: task.error } : p
          ));
        } else {
          // Still processing, poll again
          setTimeout(poll, 3000);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };
    poll();
  };

  const handleSelectNews = async (newsItem: any) => {
    setLoading(true);
    setShowScanResults(false);
    const { api } = await import("@/lib/api");

    try {
      const payload = {
        url: newsItem.url,
        text: newsItem.text,
        model_provider: modelProvider,
        mode: workMode,
        target_brand: workMode === "blogger" ? targetBrand : undefined
      };

      const res = await api.post("/generate", payload);
      const taskId = res.data.id;

      // Add pending task to history immediately
      const pendingPlan = {
        id: taskId,
        status: "pending",
        url: newsItem.url,
        created_at: new Date().toISOString()
      };
      setRecentPlans(prev => [pendingPlan, ...prev]);

      // Start polling for status
      pollTaskStatus(taskId);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Ошибка генерации";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <main className="min-h-screen p-6 flex flex-col relative overflow-hidden">
      <BrandSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />

      <div className="max-w-5xl mx-auto w-full z-10 space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Rezonans AI</h1>
              <p className="text-xs text-gray-400">Digital Echo System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* User Menu - compact on mobile */}
            <div className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white max-w-[80px] md:max-w-[120px] truncate hidden sm:inline">
                {user?.full_name || user?.email || "Пользователь"}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mode Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-black/30 p-1 w-full sm:w-auto">
            <button
              onClick={() => setWorkMode("blogger")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${workMode === "blogger"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              📝 Блогер
            </button>
            <button
              onClick={() => setWorkMode("pr")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${workMode === "pr"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              🏢 PR-специалист
            </button>
          </div>

          {/* Context Input - always same width to prevent jumping */}
          <div className="flex-1 max-w-md">
            {workMode === "blogger" ? (
              <input
                type="text"
                placeholder="🔍 О каком бренде пишем? (Apple, Tesla...)"
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            ) : (
              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-black/30 hover:bg-white/5 text-white transition-colors border border-white/10"
              >
                <Settings className="w-4 h-4" />
                <span className="truncate">{brandName || "Настроить профиль компании"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Action Card: Link */}
          <GlassCard className="col-span-1 md:col-span-2 p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Обработать Новость</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-md">
                Вставьте ссылку на статью. Агент проанализирует её, оценит влияние на бренд и подготовит контент-план.
              </p>

              <div className="relative">
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
                <button
                  onClick={() => handleGenerate("link")}
                  disabled={loading || !url}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Model Selector */}
              <div className="mt-4 flex items-center gap-2 relative z-50">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Нейросеть:</span>
                <select
                  value={modelProvider}
                  onChange={(e) => setModelProvider(e.target.value)}
                  className="bg-black/50 text-xs text-gray-300 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="claude">Claude 4.5 Sonnet</option>
                  <option value="qwen">Qwen 2.5 (72B)</option>
                  <option value="deepseek">DeepSeek V3</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Action Card: Monitoring */}
          <GlassCard className="col-span-1 p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden group cursor-pointer" onClick={() => !loading && handleGenerate("monitoring")}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <Radar className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Мониторинг</h2>
              <p className="text-gray-400 text-sm">
                Сканировать сеть на предмет упоминаний <b>{brandName || "бренда"}</b> за последние 24 часа.
              </p>
            </div>

            <div className="flex items-center gap-2 text-purple-400 font-medium mt-4 group-hover:translate-x-2 transition-transform">
              <span>Запустить сканер</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </GlassCard>
        </div>

        {/* History Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Последние активности
          </h3>

          <div className="grid gap-4">
            {recentPlans.length > 0 ? recentPlans.map((plan, i) => {
              const isPending = plan.status === 'pending' || plan.status === 'processing';
              const isError = plan.status === 'error';

              if (isPending) {
                return (
                  <GlassCard key={i} className="p-4 flex items-center justify-between bg-white/5 opacity-70 border border-blue-500/30">
                    <div>
                      <h4 className="text-white font-medium mb-1 line-clamp-1 animate-pulse">
                        Генерация... {plan.url ? `(${new URL(plan.url).hostname})` : ""}
                      </h4>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">В процессе</span>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  </GlassCard>
                );
              }

              if (isError) {
                return (
                  <GlassCard key={i} className="p-4 flex items-center justify-between border-red-500/30 bg-red-500/5">
                    <div>
                      <h4 className="text-red-400 font-medium mb-1 line-clamp-1">Ошибка генерации</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{plan.error || "Неизвестная ошибка"}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </GlassCard>
                );
              }

              const sentimentRaw = plan.analysis?.sentiment?.toLowerCase() || "";
              const isPositive = sentimentRaw.includes("positive") || sentimentRaw.includes("позитив");
              const isNegative = sentimentRaw.includes("negative") || sentimentRaw.includes("негатив");

              const sentimentColor = isPositive ? "text-green-400 border-green-500/30 bg-green-500/10" :
                isNegative ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-blue-400 border-blue-500/30 bg-blue-500/10";

              const sentimentLabel = isPositive ? "позитив" : isNegative ? "негатив" : "нейтрально";

              return (
                <GlassCard key={i} className="p-4 flex items-start justify-between hover:bg-white/5 transition-all duration-200 cursor-pointer group border border-white/5 hover:border-white/10" onClick={() => router.push(`/plan/${plan.id}`)}>
                  <div className="flex-1 min-w-0 mr-4 space-y-2">
                    <h4 className="text-base font-medium text-gray-100 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {plan.analysis?.summary || "Анализ новости"}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {/* Date */}
                      <span>
                        {new Date(plan.created_at).toLocaleDateString()}
                      </span>

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {plan.analysis?.topics?.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Sentiment Indicator */}
                      {plan.analysis?.sentiment && (
                        <div className={`flex items-center justify-center px-2 py-0.5 rounded-full border ${sentimentColor} bg-opacity-10 border-opacity-20`}>
                          <span className="font-medium text-[10px] uppercase tracking-wide opacity-90">{sentimentLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 self-center pl-2">
                    {/* Like Indicator */}
                    {plan.liked && (
                      <div className="p-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    )}

                    {/* Arrow */}
                    <div className={`p-2 rounded-full border border-white/5 bg-white/5 transition-all text-gray-500 group-hover:bg-white/10 group-hover:text-white ${!plan.liked ? 'mt-auto' : ''}`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </GlassCard>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                История пуста. Запустите первую генерацию!
              </div>
            )}
          </div>
        </div>

        {/* Scan Results Modal */}
        {showScanResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
              <button
                onClick={() => setShowScanResults(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Radar className="w-5 h-5 text-purple-400" />
                Найденные новости
              </h2>

              <div className="space-y-3">
                {scanResults.length > 0 ? scanResults.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectNews(item)}
                    className="p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5 hover:border-purple-500/30"
                  >
                    <h3 className="text-white font-medium mb-2">{item.url}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{item.text}</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    Новостей не найдено. Попробуйте изменить ключевые слова в настройках.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

      </div>
    </main>
  );
}