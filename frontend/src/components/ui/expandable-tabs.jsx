import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "../../utils";

const buttonVariants = {
    initial: {
        gap: 0,
        paddingLeft: ".5rem",
        paddingRight: ".5rem",
    },
    animate: (isSelected) => ({
        gap: isSelected ? ".5rem" : 0,
        paddingLeft: isSelected ? "1rem" : ".5rem",
        paddingRight: isSelected ? "1rem" : ".5rem",
    }),
};

const spanVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { width: "auto", opacity: 1 },
    exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
    tabs,
    className,
    activeColor = "text-blue-600 dark:text-blue-400",
    onChange,
}) {
    // We let the parent control state by passing an `onChange` and reading `tab.active` or we handle locally if undefined.
    // However, specifically for multi-select integration: we will trust `tab.selected` boolean if given, otherwise fall back to internal localState.
    const [localSelected, setLocalSelected] = useState(null);
    const outsideClickRef = useRef(null);

    useOnClickOutside(outsideClickRef, () => {
        setLocalSelected(null);
        // We do not blast onChange with null in multi-select mode if unclicking outside context
    });

    const handleSelect = (index, tabSelected) => {
        // Toggle behavior
        if (tabSelected !== undefined) {
            // Let parent handle it via tab event
            onChange?.(index, !tabSelected);
        } else {
            // Local mode
            if (localSelected === index) {
                setLocalSelected(null);
                onChange?.(null);
            } else {
                setLocalSelected(index);
                onChange?.(index);
            }
        }
    };

    const Separator = () => (
        <div className="mx-1 h-[24px] w-[1.2px] bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
    );

    return (
        <div
            ref={outsideClickRef}
            className={cn(
                "flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-1 shadow-sm",
                className
            )}
        >
            {tabs.map((tab, index) => {
                if (tab.type === "separator") {
                    return <Separator key={`separator-${index}`} />;
                }

                const Icon = tab.icon;
                const isSelected = tab.selected !== undefined ? tab.selected : localSelected === index;

                return (
                    <motion.button
                        key={tab.title}
                        variants={buttonVariants}
                        initial={false}
                        animate="animate"
                        custom={isSelected}
                        onClick={() => handleSelect(index, tab.selected)}
                        transition={transition}
                        className={cn(
                            "relative flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
                            isSelected
                                ? cn("bg-neutral-100 dark:bg-neutral-800", tab.activeColor || activeColor)
                                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200"
                        )}
                        type="button"
                    >
                        <Icon size={20} />
                        <AnimatePresence initial={false}>
                            {isSelected && (
                                <motion.span
                                    variants={spanVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={transition}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    {tab.title}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                );
            })}
        </div>
    );
}
