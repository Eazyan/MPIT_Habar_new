"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles, Send, Link as LinkIcon, Settings, Radar, History, ArrowRight } from "lucide-react";
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
  }, [showSettings, isAuthenticated]);

  const [scanResults, setScanResults] = useState<any[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);

  const handleGenerate = async (mode: "link" | "monitoring") => {
    setLoading(true);
    const { api } = await import("@/lib/api");

    if (mode === "monitoring") {
      if (!brandName) {
        alert("Сначала настройте профиль бренда!");
        setShowSettings(true);
        setLoading(false);
        return;
      }

      // Run Scan (backend uses user.brand_profile)
      try {
        const res = await api.post("/monitor/scan");
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

    // Link Mode Logic
    try {
      const payload = {
        url,
        model_provider: modelProvider
      };

      const res = await api.post("/generate", payload);
      const data = res.data;

      router.push(`/plan/${data.id}`);

    } catch (error) {
      console.error(error);
      alert("Ошибка генерации. Проверьте консоль.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNews = async (newsItem: any) => {
    setLoading(true);
    setShowScanResults(false);
    const { api } = await import("@/lib/api");

    try {
      const payload = {
        url: newsItem.url,
        text: newsItem.text, // Pass the text we found
        model_provider: modelProvider
      };

      const res = await api.post("/generate", payload);
      const data = res.data;

      router.push(`/plan/${data.id}`);

    } catch (error) {
      console.error(error);
      alert("Ошибка генерации");
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
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Rezonans AI</h1>
              <p className="text-xs text-gray-400">Digital Echo System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Brand Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
            >
              <Settings className="w-4 h-4" />
              <span>{brandName || "Настроить Бренд"}</span>
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white max-w-[120px] truncate">
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
            {recentPlans.length > 0 ? recentPlans.map((plan, i) => (
              <GlassCard key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/plan/${plan.id}`)}>
                <div>
                  <h4 className="text-white font-medium mb-1 line-clamp-1">{plan.analysis.summary}</h4>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300">{plan.posts.length} постов</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </GlassCard>
            )) : (
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