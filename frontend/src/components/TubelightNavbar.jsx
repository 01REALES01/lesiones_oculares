import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils";
import { Home, Users, Search, PlayCircle } from "lucide-react";

export function TubelightNavbar({ items, className, children }) {
    const [activeTab, setActiveTab] = useState(items[0].name);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            className={cn(
                "fixed top-0 inset-x-0 w-full flex justify-center z-50 mt-6",
                className
            )}
        >
            <div className="tubelight-container">
                {/* Nav Items */}
                <div className="flex items-center gap-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.name;

                        const handleClick = (e) => {
                            e.preventDefault();
                            setActiveTab(item.name);
                            const target = document.querySelector(item.url);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        };

                        return (
                            <a
                                key={item.name}
                                href={item.url}
                                onClick={handleClick}
                                className={cn(
                                    "tubelight-item",
                                    isActive && "active"
                                )}
                            >
                                <span className="hidden md:inline">{item.name}</span>
                                <span className="md:hidden">
                                    <Icon size={18} strokeWidth={2.5} />
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="lamp"
                                        className="lamp-glow"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30,
                                        }}
                                    >
                                        <div className="lamp-top">
                                            <div className="lamp-blur-lg" />
                                            <div className="lamp-blur-md" />
                                            <div className="lamp-blur-sm" />
                                        </div>
                                    </motion.div>
                                )}
                            </a>
                        );
                    })}
                </div>

                {/* Separator */}
                <div className="tubelight-separator" />

                {/* Extra Actions (Login, Theme) */}
                <div className="flex items-center gap-2 pl-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
