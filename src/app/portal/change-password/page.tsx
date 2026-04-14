"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("La nuova password deve essere di almeno 8 caratteri");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }
    if (currentPassword === newPassword) {
      setError("La nuova password deve essere diversa da quella temporanea");
      return;
    }

    setLoading(true);

    // Verify current password by re-signing in
    const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
    if (!user?.email) {
      setError("Sessione non valida. Esci e accedi di nuovo.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Password temporanea non corretta");
      setLoading(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("Errore nell'aggiornamento: " + updateError.message);
      setLoading(false);
      return;
    }

    // Update profile flag
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);

    // Redirect to onboarding or portal
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single();
    if (profile && !profile.onboarding_completed) {
      router.push("/portal/onboarding");
    } else {
      router.push("/portal");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Image src="/icon.webp" alt="Minerva" width={50} height={50} className="mx-auto mb-4" unoptimized />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Cambia Password</h1>
          <p className="text-slate-500 text-sm">
            Per motivi di sicurezza, devi cambiare la password temporanea prima di accedere al portale.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">
              Password temporanea attuale *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="Inserisci password temporanea"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">
              Nuova password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimo 8 caratteri"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">
              Conferma nuova password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Ripeti la nuova password"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Le password non corrispondono</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f172a] text-[#D4AF37] py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Aggiornamento..." : "Cambia Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
