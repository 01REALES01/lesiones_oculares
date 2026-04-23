import { cn } from '../../utils';

/**
 * Interruptor estilo clínico (mock “AI Models”).
 */
export function SwitchToggle({ active, onToggle, disabled, id, labelId }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={active}
      aria-labelledby={labelId}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
        active ? 'border-sky-400/80 bg-sky-500' : 'border-slate-200/90 bg-slate-200/80',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          active ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
