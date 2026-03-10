import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../utils";

export function ThemeToggle({ className }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
            setIsDark(true);
            document.body.classList.add("dark-mode");
        } else {
            setIsDark(false);
            document.body.classList.remove("dark-mode");
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDark;
        setIsDark(newMode);

        if (newMode) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <div
            className={cn(
                "theme-toggle",
                isDark ? "dark" : "light",
                className
            )}
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            aria-label="Toggle Dark Mode"
        >
            <div className="toggle-track">
                <div className={cn("toggle-thumb", isDark ? "dark" : "light")}>
                    {isDark ? (
                        <Moon className="icon-moon" strokeWidth={1.5} />
                    ) : (
                        <Sun className="icon-sun" strokeWidth={1.5} />
                    )}
                </div>
                <div className={cn("toggle-icon-bg", isDark ? "dark" : "light")}>
                    {isDark ? (
                        <Sun className="icon-sun-bg" strokeWidth={1.5} />
                    ) : (
                        <Moon className="icon-moon-bg" strokeWidth={1.5} />
                    )}
                </div>
            </div>
        </div>
    );
}
