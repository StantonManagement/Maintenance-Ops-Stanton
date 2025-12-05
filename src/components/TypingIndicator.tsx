export default function TypingIndicator({ userName }: { userName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ fontSize: "13px" }}>{userName} is typing</span>
        <div className="flex gap-1">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: "var(--text-tertiary)",
              animationDelay: "0ms",
              animationDuration: "1.4s",
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: "var(--text-tertiary)",
              animationDelay: "200ms",
              animationDuration: "1.4s",
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: "var(--text-tertiary)",
              animationDelay: "400ms",
              animationDuration: "1.4s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
