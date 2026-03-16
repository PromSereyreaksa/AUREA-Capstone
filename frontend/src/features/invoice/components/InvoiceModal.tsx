import React from "react";

interface InvoiceModalProps {
  isOpen: boolean;
  clientName: string;
  clientEmail: string;
  clientLocation: string;
  error: string | null;
  isSubmitting: boolean;
  onClientNameChange: (value: string) => void;
  onClientEmailChange: (value: string) => void;
  onClientLocationChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  clientName,
  clientEmail,
  clientLocation,
  error,
  isSubmitting,
  onClientNameChange,
  onClientEmailChange,
  onClientLocationChange,
  onCancel,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#FFFEF9",
          border: "3px solid #000000",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "6px 6px 0 #1a1a1a",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.25rem",
            fontWeight: 900,
            color: "#FB8500",
            textTransform: "uppercase",
          }}
        >
          Client Information
        </h3>
        <p style={{ margin: "0 0 1rem 0", color: "#333333", fontSize: "0.875rem" }}>
          Fill in client details to generate the invoice PDF.
        </p>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <input
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Client Name"
            style={{
              border: "2px solid #000000",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              fontSize: "0.875rem",
            }}
          />
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => onClientEmailChange(e.target.value)}
            placeholder="Client Email"
            style={{
              border: "2px solid #000000",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              fontSize: "0.875rem",
            }}
          />
          <input
            type="text"
            value={clientLocation}
            onChange={(e) => onClientLocationChange(e.target.value)}
            placeholder="Client Address / Location"
            style={{
              border: "2px solid #000000",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              fontSize: "0.875rem",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: "0.75rem",
              background: "#FEF2F2",
              border: "2px solid #EF4444",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              color: "#DC2626",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className={`btn btn-primary ${isSubmitting ? "disabled" : ""}`}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate & Download"}
          </button>
        </div>
      </div>
    </div>
  );
};
