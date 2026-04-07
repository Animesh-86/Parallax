import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, LogIn } from "lucide-react";

export default function OAuthFailurePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const errorMessage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("error") || "OAuth sign-in failed";
    try {
      return decodeURIComponent(raw.replace(/\+/g, " "));
    } catch {
      return raw;
    }
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#060910] text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-[#0C1220]/80 backdrop-blur-xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EF6461]/15 border border-[#EF6461]/30 flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-[#EF6461]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Sign-in failed</h1>
        <p className="text-white/70 mb-2">{errorMessage}</p>
        <p className="text-white/40 text-sm mb-8">
          This usually happens when the OAuth state cookie is missing or the browser was sent back to the wrong port.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#38BDF8] text-white hover:bg-[#38BDF8]/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}