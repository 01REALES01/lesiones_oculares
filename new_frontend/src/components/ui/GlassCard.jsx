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
  <GlassCard
    delay={delay}
    className="flex flex-col gap-2 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(14,165,233,0.08)] hover:border-primary/30 transition-all duration-300 border border-slate-200/60 bg-white/80"
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</span>
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/5">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
    <div className="flex items-end justify-between mt-1">
      <span className="text-2xl font-black text-slate-800 tracking-tight">{value}</span>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
          trend.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {trend.positive ? "+" : "-"}{trend.value}%
        </span>
      )}
    </div>
  </GlassCard>
);
