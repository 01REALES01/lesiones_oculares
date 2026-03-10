import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "../utils";
import React from "react"; // Needed for cloneElement

export const BentoGrid = ({ children, className }) => {
    // Manage active state here. Default to the first child's key if possible, or just null/0.
    // We'll use index for simplicity if no ID is provided, but ideally children should have IDs.
    const [activeId, setActiveId] = useState(0);

    return (
        <div className={cn("expandable-flex-gallery", className)}>
            {children.map((child, index) => {
                // Clone child to pass active state and onClick handler
                return React.cloneElement(child, {
                    key: index,
                    id: index,
                    isActive: activeId === index,
                    onClick: () => setActiveId(index),
                });
            })}
        </div>
    );
};

export const BentoCard = ({
    id,
    isActive,
    onClick,
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta = "Ver Más",
}) => {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={cn(
                "expandable-card",
                isActive ? "active" : "inactive",
                className
            )}
            initial={false}
            animate={{
                // Height is controlled by CSS class .active (height: auto vs 80px)
                // We use layout prop for smooth transition of surrounding elements
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="card-bg">{background}</div>

            <div className="card-header">
                <div className={cn("card-icon-container", isActive ? "active" : "inactive")}>
                    <Icon className="card-icon" />
                </div>

                <h3 className="card-title">
                    {name}
                </h3>
            </div>

            <div className="card-content">
                <p className="card-desc">{description}</p>

                <a href={href} className="card-cta">
                    {cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </a>
            </div>

            <div className="card-overlay" />
        </motion.div>
    );
};
