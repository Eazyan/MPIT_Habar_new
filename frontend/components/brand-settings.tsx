"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { X, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface BrandSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BrandSettings({ isOpen, onClose }: BrandSettingsProps) {
    const [profile, setProfile] = useState({
        name: "",
        description: "",
        tone_of_voice: "",
        target_audience: "",
        keywords: "",
        examples: ""
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        api.get("/auth/profile")
            .then((res) => {
                const data = res.data;
                if (data && Object.keys(data).length > 0) {
                    setProfile({
                        name: data.name || "",
                        description: data.description || "",
                        tone_of_voice: data.tone_of_voice || "",
                        target_audience: data.target_audience || "",
                        keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : "",
                        examples: Array.isArray(data.examples) ? data.examples.join("\n---\n") : ""
                    });
                }
            })
            .catch((err) => {
                console.error("Failed to load profile", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen]);

    const handleSave = async () => {
        setSaving(true);
        const formatted = {
            ...profile,
            keywords: profile.keywords.split(",").map(k => k.trim()).filter(k => k),
            examples: profile.examples.split("\n---\n").map(e => e.trim()).filter(e => e)
        };

        try {
            await api.put("/auth/profile", formatted);
            onClose();
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Ошибка сохранения профиля");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-lg"
                    >
                        <GlassCard className="relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-6">Настройки Бренда</h2>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Название Бренда</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="Apple, Tesla, Ромашка..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Описание деятельности</label>
                                        <textarea
                                            value={profile.description}
                                            onChange={e => setProfile({ ...profile, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                                            placeholder="Мы делаем лучшие смартфоны..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Tone of Voice</label>
                                            <input
                                                type="text"
                                                value={profile.tone_of_voice}
                                                onChange={e => setProfile({ ...profile, tone_of_voice: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                                placeholder="Дерзкий, Дружелюбный..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Целевая аудитория</label>
                                            <input
                                                type="text"
                                                value={profile.target_audience}
                                                onChange={e => setProfile({ ...profile, target_audience: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                                placeholder="IT-специалисты, 25-35..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Ключевые слова (через запятую)</label>
                                        <input
                                            type="text"
                                            value={profile.keywords}
                                            onChange={e => setProfile({ ...profile, keywords: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="iPhone, iOS, Mac..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Примеры постов (разделитель ---)</label>
                                        <textarea
                                            value={profile.examples}
                                            onChange={e => setProfile({ ...profile, examples: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                                            placeholder="Пример 1... --- Пример 2..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Сохранить Профиль
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
