import { supabase } from "@/integrations/supabase/client";
import type { PlantResult } from "@/lib/plant.functions";

export type PlantScanRow = {
  id: string;
  image_url: string | null;
  common_name: string;
  scientific_name: string | null;
  family: string | null;
  confidence: number | null;
  difficulty: string | null;
  summary: string | null;
  details: PlantResult;
  created_at: string;
};

function dataUrlToBlob(dataUrl: string) {
  const [meta = "", base64 = ""] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Saves an identified plant for the signed-in user. Returns null when signed out. */
export async function savePlantScan(result: PlantResult, imageDataUrl: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  let imagePath: string | null = null;
  try {
    const blob = dataUrlToBlob(imageDataUrl);
    const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("plant-photos").upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (!error) imagePath = path;
  } catch {
    imagePath = null;
  }

  const { data, error } = await supabase
    .from("plant_scans")
    .insert({
      user_id: user.id,
      image_url: imagePath,
      common_name: result.commonName,
      scientific_name: result.scientificName,
      family: result.family,
      confidence: result.confidence,
      difficulty: result.difficulty,
      summary: result.summary,
      details: JSON.parse(JSON.stringify(result)),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function listPlantScans() {
  const { data, error } = await supabase
    .from("plant_scans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlantScanRow[];
}

export async function signedPhotoUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("plant-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function deletePlantScan(id: string, imagePath: string | null) {
  if (imagePath) await supabase.storage.from("plant-photos").remove([imagePath]);
  const { error } = await supabase.from("plant_scans").delete().eq("id", id);
  if (error) throw error;
}
