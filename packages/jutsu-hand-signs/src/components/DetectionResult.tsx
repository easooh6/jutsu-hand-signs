type Props = {
  name: string;
  tip: string;
};

export default function DetectionResult({
  name,
  tip,
}: Props) {
  return (
    <div
      style={{
        width: "640px",
        maxWidth: "100%",
        marginTop: "25px",
        padding: "25px",
        borderRadius: "16px",
        background: "#1c1c1c",
        border: "1px solid #333",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "26px",
          fontWeight: "bold",
        }}
      >
        {name}
      </div>

      {tip && (
        <div
          style={{
            marginTop: "12px",
            color: "#ffaa00",
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
}