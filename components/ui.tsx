'use client';

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ── 버튼 ──────────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border border-primary-500 shadow-lg shadow-primary-500/30 hover:from-primary-500 hover:to-primary-600',
      secondary: 'bg-primary-500/10 text-primary-200 border border-primary-500/30 hover:bg-primary-500/20 hover:border-primary-500/50',
      ghost: 'bg-transparent text-foreground-muted hover:bg-primary-500/10 hover:text-primary-200',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
    };
    const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-base px-6 py-3' };
    return (
      <button ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── 카드 ──────────────────────────────────────────────────────────────────────
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm', className)}>{children}</div>;
}
export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 py-3 border-b border-primary-500/10', className)}>{children}</div>;
}
export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn('text-sm font-semibold text-foreground', className)}>{children}</h3>;
}
export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

// ── 인풋 ──────────────────────────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg bg-primary-500/5 border border-primary-500/20',
        'text-foreground placeholder:text-foreground-subtle',
        'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ── 셀렉트 ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string | number; label: string }>;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer',
        'bg-primary-500/5 border border-primary-500/20 text-foreground',
        'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors',
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
);
Select.displayName = 'Select';

// ── 체크박스 ──────────────────────────────────────────────────────────────────
export function Checkbox({ className, label, ...props }: { className?: string; label?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
      <input type="checkbox" className="w-4 h-4 rounded border-primary-500/30 bg-primary-500/10 text-primary-500 focus:ring-primary-500/50" {...props} />
      {label && <span className="text-sm text-foreground-muted">{label}</span>}
    </label>
  );
}

// ── 라디오 그룹 ───────────────────────────────────────────────────────────────
interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  horizontal?: boolean;
  className?: string;
}
export function RadioGroup({ name, value, onChange, options, horizontal = false, className }: RadioGroupProps) {
  return (
    <div className={cn('flex gap-3', horizontal ? 'flex-row' : 'flex-col', className)}>
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 border-primary-500/30 bg-primary-500/10 text-primary-500 focus:ring-primary-500/50"
          />
          <span className="text-sm text-foreground-muted">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ── 배지 ──────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: 'default' | 'success' | 'danger' | 'info'; className?: string }) {
  const variants = {
    default: 'bg-primary-500/20 text-primary-200 border-primary-500/30',
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
    danger: 'bg-red-500/20 text-red-300 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md border', variants[variant], className)}>{children}</span>;
}

// ── 스피너 ────────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin h-5 w-5 text-primary-400', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── 섹션 헤더 ─────────────────────────────────────────────────────────────────
export function SectionHeader({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-base font-bold text-primary-200 pl-4 py-2 border-l-[3px] border-primary-500 mb-4', className)}>
      {icon}
      {children}
    </div>
  );
}

// ── 탭 ────────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, activeTab, onChange, className }: { tabs: Array<{ id: string; label: string }>; activeTab: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('flex border-b border-primary-500/20', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'text-primary-300 border-b-2 border-primary-500'
              : 'text-foreground-muted hover:text-primary-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Expander ──────────────────────────────────────────────────────────────────
export function Expander({ title, children, defaultOpen = false, className }: { title: string; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <details className={cn('group', className)} open={defaultOpen}>
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-primary-500/5 border border-primary-500/20 rounded-lg hover:bg-primary-500/10 transition-colors">
        <span className="text-sm font-medium text-primary-200">{title}</span>
        <svg className="w-4 h-4 text-primary-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-2 p-4 border border-primary-500/20 border-t-0 rounded-b-lg bg-primary-500/[0.02]">
        {children}
      </div>
    </details>
  );
}
