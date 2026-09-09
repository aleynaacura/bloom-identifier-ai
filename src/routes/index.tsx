import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ImageUp,
  Leaf,
  Sun,
  Droplets,
  Sprout,
  Thermometer,
  CloudDrizzle,
  FlaskConical,
  Flower2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldAlert,
  History,
  LogIn,
  LogOut,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { identifyPlant, type PlantResult } from "@/lib/plant.functions";
import { savePlantScan } from "@/lib/plant-storage";
import { supabase } from "@/integrations/supabase/client";
import { CameraCapture } from "@/components/CameraCapture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BitkiLens — Fotoğrafla Bitki Tanımlama ve Bakım Rehberi" },
      {
        name: "description",
        content:
          "Bitkinin fotoğrafını çek veya yükle; türünü saniyeler içinde öğren, sulama, ışık ve bakım önerilerini gör.",
      },
      { property: "og:title", content: "BitkiLens — Fotoğrafla Bitki Tanımlama" },
      {
        property: "og:description",
        content: "Yapay zekâ ile bitki türünü tanı, bakım ve sulama rehberine anında ulaş.",
      },
    ],
  }),
  component: Index,
});

const CARE_ITEMS = [
  { key: "light", label: "Işık", icon: Sun },
  { key: "water", label: "Sulama", icon: Droplets },
  { key: "soil", label: "Toprak", icon: Sprout },
  { key: "temperature", label: "Sıcaklık", icon: Thermometer },
  { key: "humidity", label: "Nem", icon: CloudDrizzle },
  { key: "fertilizer", label: "Gübreleme", icon: FlaskConical },
  { key: "repotting", label: "Saksı Değişimi", icon: Flower2 },
] as const;

function Index() {
  const [preview, setPreview] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const identify = useServerFn(identifyPlant);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUserEmail(session?.user.email ?? null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const mutation = useMutation<PlantResult, Error, string>({
    mutationFn: (imageDataUrl) => identify({ data: { imageDataUrl } }),
    onSuccess: async (result, imageDataUrl) => {
      if (!result.isPlant) return;
      setSaveState("saving");
      try {
        const saved = await savePlantScan(result, imageDataUrl);
        setSaveState(saved ? "saved" : "idle");
      } catch {
        setSaveState("error");
      }
    },
  });

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      mutation.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setPreview(null);
    mutation.reset();
    setSaveState("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const result = mutation.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
      <header className="flex items-center gap-3">
        <span className="leaf-gradient flex size-11 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-soft)]">
          <Leaf className="size-6" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">BitkiLens</h1>
          <p className="text-sm text-muted-foreground">Fotoğrafla bitkini tanı</p>
        </div>
        {userEmail ? (
          <div className="flex gap-1">
            <Button asChild variant="ghost" size="icon" className="rounded-xl">
              <Link to="/gecmis" aria-label="Bitki geçmişim">
                <History className="size-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Çıkış yap"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        ) : (
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link to="/auth">
              <LogIn className="size-4" /> Giriş
            </Link>
          </Button>
        )}
      </header>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(dataUrl) => {
            setCameraOpen(false);
            setPreview(dataUrl);
            setSaveState("idle");
            mutation.mutate(dataUrl);
          }}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <section className="surface-card mt-6 overflow-hidden">
        {preview ? (
          <img src={preview} alt="Yüklenen bitki fotoğrafı" className="h-64 w-full object-cover" />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Leaf className="size-8" />
            </span>
            <p className="text-sm text-muted-foreground">
              Bitkinin yaprak, çiçek ve gövdesini net gösteren bir fotoğraf seç.
            </p>
          </div>
        )}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="leaf-gradient h-14 rounded-2xl text-base"
          onClick={() => cameraRef.current?.click()}
          disabled={mutation.isPending}
        >
          <Camera className="size-5" /> Fotoğraf Çek
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 rounded-2xl text-base"
          onClick={() => fileRef.current?.click()}
          disabled={mutation.isPending}
        >
          <ImageUp className="size-5" /> Galeriden Yükle
        </Button>
      </div>

      {mutation.isPending && (
        <div className="surface-card mt-5 flex items-center gap-3 p-5">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Bitki analiz ediliyor…</p>
        </div>
      )}

      {mutation.isError && (
        <div className="surface-card mt-5 flex items-start gap-3 border-destructive/40 p-5">
          <AlertTriangle className="mt-0.5 size-5 text-destructive" />
          <p className="text-sm text-foreground">{mutation.error.message}</p>
        </div>
      )}

      {result && !result.isPlant && (
        <div className="surface-card mt-5 p-5 text-sm text-muted-foreground">
          Bu fotoğrafta bir bitki tespit edemedim. Daha net ve yakın bir fotoğraf dener misin?
        </div>
      )}

      {result?.isPlant && (
        <div className="mt-5 space-y-4">
          <div className="surface-card flex items-center gap-3 p-4 text-sm">
            {saveState === "saving" && (
              <>
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Kaydediliyor…</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="size-4 text-primary" />
                <span className="text-muted-foreground">Bitki geçmişine kaydedildi.</span>
                <Link to="/gecmis" className="ml-auto text-primary underline-offset-4 hover:underline">
                  Geçmiş
                </Link>
              </>
            )}
            {saveState === "error" && (
              <>
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-muted-foreground">Kayıt sırasında bir sorun oldu.</span>
              </>
            )}
            {saveState === "idle" && (
              <>
                <History className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Kaydetmek için</span>
                <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
                  giriş yap
                </Link>
              </>
            )}
          </div>
          <section className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{result.commonName}</h2>
                <p className="text-sm italic text-muted-foreground">{result.scientificName}</p>
              </div>
              <Badge className="leaf-gradient text-primary-foreground">{result.difficulty}</Badge>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Eşleşme güveni</span>
                <span>%{Math.round(result.confidence)}</span>
              </div>
              <Progress value={result.confidence} className="mt-2 h-2" />
            </div>

            <p className="mt-4 text-sm leading-relaxed">{result.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {result.family && <Badge variant="secondary">Familya: {result.family}</Badge>}
              {result.bloomSeason && <Badge variant="secondary">Çiçeklenme: {result.bloomSeason}</Badge>}
            </div>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-lg font-semibold">Bakım Rehberi</h3>
            <ul className="mt-3 space-y-3">
              {CARE_ITEMS.map(({ key, label, icon: Icon }) => (
                <li key={key} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{result.care?.[key]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {result.tips?.length > 0 && (
            <section className="surface-card p-5">
              <h3 className="text-lg font-semibold">İpuçları</h3>
              <ul className="mt-3 space-y-2">
                {result.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                    <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.commonIssues?.length > 0 && (
            <section className="surface-card p-5">
              <h3 className="text-lg font-semibold">Sık Görülen Sorunlar</h3>
              <ul className="mt-3 space-y-2">
                {result.commonIssues.map((issue) => (
                  <li key={issue} className="flex gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
                    {issue}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.toxicity && (
            <section className="surface-card flex gap-3 p-5">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium">Toksisite</p>
                <p className="text-sm text-muted-foreground">{result.toxicity}</p>
              </div>
            </section>
          )}
        </div>
      )}

      {(result || mutation.isError) && (
        <Button variant="outline" className="mt-5 h-12 w-full rounded-2xl" onClick={reset}>
          <RotateCcw className="size-4" /> Yeni Fotoğraf
        </Button>
      )}
    </main>
  );
}
