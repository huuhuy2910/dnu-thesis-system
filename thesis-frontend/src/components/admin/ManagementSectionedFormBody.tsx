import React from "react";
import type { ManagementFormField } from "./ManagementFormSection";
import "./ManagementSectionedFormBody.css";

type FormSection = {
  title: string;
  description: string;
  fields: string[];
};

type ManagementSectionedFormBodyProps = {
  sections: FormSection[];
  values: Record<string, string>;
  getFieldDefinition: (name: string) => ManagementFormField;
  onFieldChange: (name: string, value: string) => void;
  visibleFieldNames?: string[];
  fullWidthFieldNames?: string[];
};

const ManagementSectionedFormBody: React.FC<
  ManagementSectionedFormBodyProps
> = ({
  sections,
  values,
  getFieldDefinition,
  onFieldChange,
  visibleFieldNames,
  fullWidthFieldNames = [],
}) => {
  const visibleFieldSet = visibleFieldNames ? new Set(visibleFieldNames) : null;
  const fullWidthFieldSet = new Set(fullWidthFieldNames);

  return (
    <div className="management-sectioned-form-body">
      {sections.map((section) => {
        const sectionFields = section.fields.filter((fieldName) =>
          visibleFieldSet ? visibleFieldSet.has(fieldName) : true,
        );

        if (sectionFields.length === 0) return null;

        return (
          <section
            key={section.title}
            className="management-sectioned-form-section"
          >
            <header className="management-sectioned-form-section-header">
              <h4>{section.title}</h4>
              <p>{section.description}</p>
            </header>

            <div className="management-sectioned-form-grid">
              {sectionFields.map((fieldName) => {
                const field = getFieldDefinition(fieldName);
                const value = values[field.name] ?? "";
                const isTextarea = field.type === "textarea";
                const isFullWidth =
                  isTextarea || fullWidthFieldSet.has(field.name);

                return (
                  <label
                    key={field.name}
                    className={`management-sectioned-form-field ${isFullWidth ? "management-sectioned-form-field-full" : ""}`}
                  >
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {isTextarea ? (
                      <textarea
                        value={value}
                        rows={4}
                        onChange={(event) =>
                          onFieldChange(field.name, event.target.value)
                        }
                        className="management-sectioned-form-input"
                      />
                    ) : (
                      <input
                        type={
                          field.type === "number"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : "text"
                        }
                        value={value}
                        onChange={(event) =>
                          onFieldChange(field.name, event.target.value)
                        }
                        className="management-sectioned-form-input"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ManagementSectionedFormBody;
