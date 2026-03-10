import { ArrowRight } from "lucide-react";
import { cn } from "../utils";

export function InteractiveHoverButton({ text = "Button", className, onClick, ...props }) {
    return (
        <button
            className={cn("interactive-btn", className)}
            onClick={onClick}
            {...props}
        >
            <span className="btn-text-initial">{text}</span>

            <div className="btn-content-hover">
                <span>{text}</span>
                <ArrowRight className="btn-icon" />
            </div>

            <div className="btn-dot"></div>
        </button>
    );
}
