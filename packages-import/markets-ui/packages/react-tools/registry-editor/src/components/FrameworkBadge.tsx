export function FrameworkBadge({ framework }: { framework: "react" | "angular" }) {
  const isReact = framework === "react";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        background: isReact ? "rgba(97, 218, 251, 0.15)" : "rgba(221, 0, 49, 0.15)",
        color: isReact ? "#61dafb" : "#dd0031",
        letterSpacing: "0.02em",
      }}
    >
      {isReact ? "React" : "Angular"}
    </span>
  );
}
