import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/supabaseTypes";
import { safeFileName } from "@/lib/projectLogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Stamp, ImageIcon, Trash2 } from "lucide-react";

export function ProjectStampUploader({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const ext = useMemo(() => {
    const n = file?.name ?? "";
    const last = n.lastIndexOf(".");
    return last >= 0 ? n.slice(last + 1).toLowerCase() : "png";
  }, [file]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione uma imagem");
      if (!project?.id) throw new Error("Projeto inválido");
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) throw new Error("Use PNG/JPG/WebP");

      const path = `${project.id}/${Date.now()}-${safeFileName(file.name || `stamp.${ext}`)}`;

      const { error: upErr } = await supabase.storage
        .from("project-stamps")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      if (project.stamp_path) {
        await supabase.storage.from("project-stamps").remove([project.stamp_path]);
      }

      const { error } = await supabase
        .from("projects")
        .update({
          stamp_path: path,
          stamp_file_name: safeFileName(file.name || `stamp.${ext}`),
          stamp_size_bytes: file.size,
        } as any)
        .eq("id", project.id);
      if (error) throw error;
      return path;
    },
    onSuccess: () => {
      toast.success("Carimbo salvo com sucesso");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao salvar carimbo"),
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error("Projeto inválido");
      if (project.stamp_path) {
        await supabase.storage.from("project-stamps").remove([project.stamp_path]);
      }
      const { error } = await supabase
        .from("projects")
        .update({ stamp_path: null, stamp_file_name: null, stamp_size_bytes: null } as any)
        .eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Carimbo removido");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao remover"),
  });

  const stampUrl = useMemo(() => {
    if (!project.stamp_path) return null;
    const { data } = supabase.storage.from("project-stamps").getPublicUrl(project.stamp_path);
    return data.publicUrl;
  }, [project.stamp_path]);

  return (
    <div className="flex items-start gap-4">
      {/* Moldura do carimbo */}
      <div className="flex h-32 w-32 flex-none items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 transition hover:border-[hsl(var(--brand)/0.5)]">
        {stampUrl ? (
          <img src={stampUrl} alt="Carimbo" className="h-full w-full object-contain p-1.5" />
        ) : (
          <Stamp className="h-8 w-8 text-black/15" />
        )}
      </div>

      {/* Controles */}
      <div className="min-w-0 grid gap-2">
        <div className="text-xs font-medium text-[hsl(var(--muted-ink))]">Carimbo do projeto (opcional)</div>
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="rounded-2xl"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            className="rounded-full bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-strong))]"
            onClick={() => upload.mutate()}
            disabled={!file || upload.isPending}
          >
            <Stamp className="mr-2 h-4 w-4" />
            Salvar carimbo
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => clear.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}
