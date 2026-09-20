"use client";

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface FieldWrapperProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, hint, children }: FieldWrapperProps) {
  return (
    <div className="field">
      <label>
        {label}
        {hint ? <span className="hint"> — {hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  required,
  placeholder,
  disabled,
}: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <input
        type="text"
        data-testid={`field-${slug(label)}`}
        value={value}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
}

export function DateField({ label, value, onChange, hint, required }: DateFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint ?? "YYYY-MM-DD"}>
      <input
        type="text"
        data-testid={`field-${slug(label)}`}
        inputMode="numeric"
        pattern="\d{4}-\d{2}-\d{2}"
        value={value}
        required={required}
        placeholder="1998-09-04"
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  rows?: number;
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  required,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <textarea
        data-testid={`field-${slug(label)}`}
        value={value}
        required={required}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
  max?: number;
}

export function NumberField({ label, value, onChange, hint, min, max }: NumberFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <input
        type="number"
        data-testid={`field-${slug(label)}`}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  hint?: string;
}

export function SelectField({ label, value, options, onChange, hint }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <select
        data-testid={`field-${slug(label)}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}

export function CheckboxField({ label, checked, onChange, hint }: CheckboxFieldProps) {
  return (
    <div className="field checkbox">
      <input
        type="checkbox"
        data-testid={`field-${slug(label)}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label>
        {label}
        {hint ? <span className="hint"> — {hint}</span> : null}
      </label>
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}

/** A string[] edited as a comma-separated list — simplest possible UI for tags/ids. */
export function ArrayField({ label, value, onChange, hint }: ArrayFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint ?? "comma-separated"}>
      <input
        type="text"
        data-testid={`field-${slug(label)}`}
        value={value.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
    </FieldWrapper>
  );
}
