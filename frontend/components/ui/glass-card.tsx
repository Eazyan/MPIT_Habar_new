import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "glass rounded-2xl p-6",
                hoverEffect && "glass-hover cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
