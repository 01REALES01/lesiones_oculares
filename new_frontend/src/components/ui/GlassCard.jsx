import { motion } from 'framer-motion';
import { cn } from '../../utils';

export const GlassCard = ({ children, className, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "glass-panel p-6 border border-white/20 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const StatsCard = ({ title, value, icon: Icon, trend, delay = 0 }) => (
  <GlassCard delay={delay} className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-ocular-text-muted uppercase tracking-wider">{title}</span>
      {Icon && <Icon className="w-5 h-5 text-primary" />}
    </div>
    <div className="flex items-end justify-between">
      <span className="text-3xl font-bold text-ocular-text-main">{value}</span>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
          trend.positive ? "bg-ocular-success/10 text-ocular-success" : "bg-ocular-error/10 text-ocular-error"
        )}>
          {trend.positive ? "+" : "-"}{trend.value}%
        </span>
      )}
    </div>
  </GlassCard>
);
