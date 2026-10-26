import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

/** Champ de formulaire accessible : libellé lié, erreur annoncée et reliée par aria-describedby. */
export function Field({ label, name, error, hint, id, required, ...rest }: FieldProps) {
  const fieldId = id ?? name;
  const describedBy = [hint ? `${fieldId}-aide` : null, error ? `${fieldId}-erreur` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={fieldId} className="field-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {hint && (
        <p id={`${fieldId}-aide`} className="mb-1 text-xs text-muted">
          {hint}
        </p>
      )}
      <input id={fieldId} name={name} required={required} className="field-input" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />
      {error && (
        <p id={`${fieldId}-erreur`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
