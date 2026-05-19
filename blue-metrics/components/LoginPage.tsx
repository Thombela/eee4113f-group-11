'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('emma@marine.ac.za');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) setError('Invalid credentials. Try emma@marine.ac.za / ocean2026');
  };

  return (
    <div className="min-h-screen bg-[#060c18] flex items-center justify-center relative overflow-hidden">
      {/* Animated ocean background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-[#060c18] via-[#0a1628] to-[#060c18]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#0ea5e9] opacity-[0.03]"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animation: `pulse ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 mb-6">
            <svg className="w-8 h-8 text-[#0ea5e9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M2 12c3 2 5 3 10 3s7-1 10-3" />
              <path d="M12 2v20M2 12h20" strokeOpacity="0.4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Mono', monospace" }}>
            Blue Metric
          </h1>
          <p className="text-[#64748b] text-sm mt-2 tracking-widest uppercase">
            Autonomous Remote Oceanographic Sensing Station
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1b2e]/80 backdrop-blur-xl border border-[#1e3a5f] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Researcher Access</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[#64748b] text-xs uppercase tracking-wider mb-2 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#060c18] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]/30 transition-all placeholder-[#334155]"
                placeholder="researcher@institution.edu"
                required
              />
            </div>
            <div>
              <label className="text-[#64748b] text-xs uppercase tracking-wider mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#060c18] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]/30 transition-all placeholder-[#334155]"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e3a5f]">
            <p className="text-[#334155] text-xs text-center">
              Demo credentials: <span className="text-[#0ea5e9]">emma@marine.ac.za</span> / <span className="text-[#0ea5e9]">ocean2026</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[#334155] text-xs mt-6">
          University of Cape Town · EEE4113F Group 11
        </p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.03; }
          50% { transform: scale(1.1); opacity: 0.06; }
        }
      `}</style>
    </div>
  );
}