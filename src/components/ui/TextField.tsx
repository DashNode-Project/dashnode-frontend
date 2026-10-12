import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  /** Element rendered inside the field, on the right (e.g. the show/hide password button). */
  trailing?: ReactNode;
  id?: string;
}

export function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[#F9FAFB]">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          {...rest}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`h-10 w-full rounded-md border bg-[#1E1F2B] text-sm text-[#F9FAFB] placeholder:text-[#9CA3AF]/70 transition-colors focus:border-blue-500 focus:outline-none ${
            error ? 'border-red-500' : 'border-white/15'
          } pl-3 ${trailing ? 'pr-11' : 'pr-3'} ${className}`}
        />
        {trailing ? <span className="absolute right-1.5 flex items-center">{trailing}</span> : null}
      </div>
      {error ? (
        <p id={errorId} className="flex items-start gap-1 text-xs text-red-300">
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[#9CA3AF]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
