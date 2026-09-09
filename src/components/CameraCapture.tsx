import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setStatus("loading");
      setError(null);
      stop();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu cihazda kamera desteklenmiyor.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "Kamera izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene ya da galeriden bir fotoğraf yükle."
            : name === "NotFoundError"
              ? "Bu cihazda kullanılabilir bir kamera bulunamadı. Galeriden fotoğraf yükleyebilirsin."
              : err instanceof Error
                ? err.message
                : "Kamera açılamadı. Galeriden fotoğraf yükleyebilirsin.",
        );
        setStatus("error");
      }
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, stop]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stop();
    onCapture(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-sm font-medium">Bitkiyi kadraja al</p>
        <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Kamerayı kapat" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="relative mx-auto mt-4 w-full max-w-md flex-1 overflow-hidden px-5">
        <div className="surface-card relative flex h-full items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`h-full w-full object-cover ${status === "ready" ? "" : "invisible"}`}
          />
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" /> Kamera açılıyor…
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 px-5 pb-8 pt-4">
        <Button
          size="lg"
          className="leaf-gradient h-14 rounded-2xl text-base"
          onClick={shoot}
          disabled={status !== "ready"}
        >
          <Camera className="size-5" /> Çek
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 rounded-2xl text-base"
          onClick={() => setFacing(facing === "environment" ? "user" : "environment")}
        >
          <RefreshCw className="size-5" /> Kamerayı Çevir
        </Button>
      </div>
    </div>
  );
}
