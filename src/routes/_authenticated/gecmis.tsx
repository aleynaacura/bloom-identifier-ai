import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Leaf, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listPlantScans,
  deletePlantScan,
  signedPhotoUrl,
  type PlantScanRow,
} from "@/lib/plant-storage";

export const Route = createFileRoute("/_authenticated/gecmis")({
  head: () => ({
    meta: [
      { title: "Bitki Geçmişim — BitkiLens" },
      {
        name: "description",
        content: "Daha önce tanımladığın bitkilerin kayıtlarını ve bakım bilgilerini gör.",
      },
      { property: "og:title", content: "Bitki Geçmişim — BitkiLens" },
      { property: "og:description", content: "Kayıtlı bitkilerin ve bakım detayları." },
    ],
  }),
  component: HistoryPage,
});

function ScanCard({ scan, onDelete }: { scan: PlantScanRow; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    signedPhotoUrl(scan.image_url).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [scan.image_url]);

  return (
    <article className="surface-card overflow-hidden">
      {url ? (
        <img src={url} alt={`${scan.common_name} fotoğrafı`} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-secondary text-secondary-foreground">
          <Leaf className="size-8" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{scan.common_name}</h2>
            <p className="text-sm italic text-muted-foreground">{scan.scientific_name}</p>
          </div>
          {scan.difficulty && <Badge variant="secondary">{scan.difficulty}</Badge>}
        </div>
        {scan.summary && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{scan.summary}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(scan.created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="size-4" /> Sil
          </Button>
        </div>
      </div>
    </article>
  );
}

function HistoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["plant-scans"], queryFn: listPlantScans });

  const remove = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string | null }) => deletePlantScan(id, path),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plant-scans"] }),
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link to="/" aria-label="Geri dön">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Bitki Geçmişim</h1>
      </header>

      {isLoading && (
        <div className="surface-card mt-6 flex items-center gap-3 p-5">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor…</p>
        </div>
      )}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="surface-card mt-6 p-6 text-center text-sm text-muted-foreground">
          Henüz kayıtlı bitkin yok. Ana sayfadan bir fotoğraf yükleyerek başla.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {data?.map((scan) => (
          <ScanCard
            key={scan.id}
            scan={scan}
            onDelete={() => remove.mutate({ id: scan.id, path: scan.image_url })}
          />
        ))}
      </div>
    </main>
  );
}
