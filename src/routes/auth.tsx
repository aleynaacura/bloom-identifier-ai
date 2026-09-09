import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş Yap — BitkiLens" },
      {
        name: "description",
        content: "BitkiLens hesabına giriş yap ve tanımladığın bitkileri kalıcı olarak sakla.",
      },
      { property: "og:title", content: "Giriş Yap — BitkiLens" },
      {
        property: "og:description",
        content: "Hesabına giriş yap, bitki geçmişini her cihazdan gör.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const translateError = (err: unknown) => {
    const raw = err instanceof Error ? err.message.toLowerCase() : "";
    const code = (err as { code?: string } | null)?.code ?? "";
    if (code === "email_not_confirmed" || raw.includes("not confirmed")) {
      return "E-postan henüz onaylanmadı. Gelen kutunu kontrol et.";
    }
    if (code === "invalid_credentials" || raw.includes("invalid login credentials")) {
      return "E-posta veya şifre hatalı.";
    }
    if (code === "user_already_exists" || raw.includes("already registered")) {
      return "Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.";
    }
    if (code === "weak_password" || raw.includes("password should be")) {
      return "Şifre en az 6 karakter olmalı.";
    }
    if (raw.includes("rate limit") || raw.includes("too many")) {
      return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
    }
    return "Bir hata oluştu. Lütfen tekrar dene.";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/" });
          return;
        }
        setNeedsConfirm(true);
        setMessage(
          "E-postana bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      const text = translateError(err);
      setMessage(text);
      if (text.startsWith("E-postan henüz")) setNeedsConfirm(true);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      setMessage("Önce e-posta adresini yaz.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setMessage("Onay e-postası yeniden gönderildi. Gelen kutunu kontrol et.");
    } catch (err) {
      setMessage(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage("Google ile giriş yapılamadı.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <span className="leaf-gradient flex size-11 items-center justify-center rounded-2xl text-primary-foreground">
          <Leaf className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold">BitkiLens</h1>
      </Link>

      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold">
          {mode === "signin" ? "Giriş Yap" : "Hesap Oluştur"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tanımladığın bitkiler hesabında saklanır.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <Button type="submit" className="leaf-gradient h-12 w-full rounded-2xl" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 h-12 w-full rounded-2xl" onClick={google}>
          Google ile devam et
        </Button>

        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}

        <button
          className="mt-5 w-full text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </section>
    </main>
  );
}
