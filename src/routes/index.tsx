import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { identifyPlant, type PlantResult } from "@/lib/plant.functions";

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
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const identify = useServerFn(identifyPlant);

  const mutation = useMutation<PlantResult, Error, string>({
    mutationFn: (imageDataUrl) => identify({ data: { imageDataUrl } }),
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
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  };

  const result = mutation.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
      <header className="flex items-center gap-3">
        <span className="leaf-gradient flex size-11 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-soft)]">
          <Leaf className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">BitkiLens</h1>
          <p className="text-sm text-muted-foreground">Fotoğrafla bitkini tanı</p>
        </div>
      </header>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
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
