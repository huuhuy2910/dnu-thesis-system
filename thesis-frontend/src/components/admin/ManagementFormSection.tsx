import React from "react";
import { X } from "lucide-react";
import "./ManagementFormSection.css";

export type ManagementFormFieldType = "text" | "number" | "date" | "textarea";

export type ManagementFormField = {
  name: string;
  label: string;
  type?: ManagementFormFieldType;
  required?: boolean;
};

type ManagementFormSectionProps = {
  fields: ManagementFormField[];
  values: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  note?: string;
  disabledFields?: string[];
  showActions?: boolean;
  showCloseButton?: boolean;
};

const ManagementFormSection: React.FC<ManagementFormSectionProps> = ({
  fields,
  values,
  onFieldChange,
  onSubmit,
  onClose,
  isSubmitting = false,
  submitLabel,
  cancelLabel,
  note,
  disabledFields = [],
  showActions = true,
  showCloseButton = true,
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  const defaultSubmitLabel = submitLabel ?? "Lưu";

  return (
    <form className="management-form-section" onSubmit={handleSubmit}>
      {showCloseButton ? (
        <button
          type="button"
          className="management-form-section__close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={16} />
        </button>
      ) : null}

      {note ? <div className="management-form-section__note">{note}</div> : null}

      <div className="management-form-section__grid">
        {fields.map((field) => {
          const value = values[field.name] ?? "";
          const isTextarea = field.type === "textarea";
          const isDisabled = disabledFields.includes(field.name);

          return (
            <label
              key={field.name}
              className={`management-form-section__field ${isTextarea ? "management-form-section__field--full" : ""}`}
            >
              <span className="management-form-section__label">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {isTextarea ? (
                <textarea
                  value={value}
                  onChange={(event) => onFieldChange(field.name, event.target.value)}
                  rows={4}
                  disabled={isDisabled}
                  className="management-form-section__textarea"
                />
              ) : (
                <input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={value}
                  onChange={(event) => onFieldChange(field.name, event.target.value)}
                  disabled={isDisabled}
                  className="management-form-section__input"
                />
              )}
            </label>
          );
        })}
      </div>

      {showActions ? (
        <div className="management-form-section__actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="management-form-section__button management-form-section__button--secondary"
          >
            {cancelLabel ?? "Hủy"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="management-form-section__button management-form-section__button--primary"
          >
            {isSubmitting ? "Đang lưu..." : defaultSubmitLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
};

export default ManagementFormSection;