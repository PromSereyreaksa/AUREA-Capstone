import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface NeobrutalDropdownOption {
  value: string;
  label: string;
}

interface NeobrutalDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: NeobrutalDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`estimator-select-caret ${open ? "is-open" : ""}`}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const NeobrutalDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
}: NeobrutalDropdownProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleOptionSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`form-group estimator-select-shell ${
        open ? "is-open" : ""
      } ${disabled ? "is-disabled" : ""}`}
    >
      <label className="form-label">{label}</label>

      <button
        type="button"
        className="estimator-select-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="estimator-select-value">
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="estimator-select-icon-wrap">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="estimator-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`estimator-select-option ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => handleOptionSelect(option.value)}
              >
                <span className="estimator-select-option-copy">
                  <span className="estimator-select-option-mark" />
                  <span>{option.label}</span>
                </span>
                {isSelected && (
                  <span className="estimator-select-option-badge">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NeobrutalDropdown;
