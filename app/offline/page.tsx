export const metadata = { title: "You're Offline | Mercy Home Essentials" };

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "var(--color-page-bg, #fdf8f0)" }}>

      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: "rgba(217,140,42,0.12)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d98c2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
      </div>

      <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
        You&apos;re offline
      </h1>
      <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-8">
        No internet connection detected. Check your network and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#d98c2a" }}
      >
        Try again
      </button>
    </div>
  );
}
