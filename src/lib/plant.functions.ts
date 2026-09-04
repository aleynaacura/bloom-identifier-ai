import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  imageDataUrl: z.string().min(32),
});

export type PlantResult = {
  isPlant: boolean;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  summary: string;
  care: {
    light: string;
    water: string;
    soil: string;
    temperature: string;
    humidity: string;
    fertilizer: string;
    repotting: string;
  };
  toxicity: string;
  difficulty: string;
  bloomSeason: string;
  tips: string[];
  commonIssues: string[];
};

const SYSTEM = `Sen uzman bir botanikçisin. Sana verilen fotoğraftaki bitkiyi tanımla.
Cevabını SADECE geçerli JSON olarak, aşağıdaki şemada ve TÜRKÇE olarak ver:
{
 "isPlant": boolean,
 "commonName": string,
 "scientificName": string,
 "family": string,
 "confidence": number (0-100),
 "summary": string (2-3 cümle),
 "care": {"light":string,"water":string,"soil":string,"temperature":string,"humidity":string,"fertilizer":string,"repotting":string},
 "toxicity": string,
 "difficulty": string ("Kolay"|"Orta"|"Zor"),
 "bloomSeason": string,
 "tips": string[] (3-5 madde),
 "commonIssues": string[] (2-4 madde)
}
Fotoğrafta bitki yoksa isPlant=false yap ve diğer alanları boş/0 bırak.`;

export const identifyPlant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<PlantResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI anahtarı yapılandırılmamış.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Bu bitkiyi tanımla ve bakım bilgilerini ver." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Çok fazla istek gönderildi, biraz sonra tekrar deneyin.");
    if (res.status === 402) throw new Error("AI kullanım krediniz tükendi.");
    if (!res.ok) throw new Error("Bitki tanımlanamadı, lütfen tekrar deneyin.");

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Sonuç okunamadı, lütfen tekrar deneyin.");
    return JSON.parse(match[0]) as PlantResult;
  });
