"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseKaraokeResultText } from "@/lib/ocr/parse-karaoke-result";

type OcrCaptureProps = {
  onResult: (result: { title: string; artist: string }) => void;
};

type Rect = { x: number; y: number; w: number; h: number };

const MAX_DISPLAY_WIDTH = 360;

export function OcrCapture({ onResult }: OcrCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const [status, setStatus] = useState<
    "idle" | "cropping" | "loading" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Rect | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setSelection(null);
    setStatus("cropping");
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const width = Math.min(MAX_DISPLAY_WIDTH, img.naturalWidth);
    const height = width * (img.naturalHeight / img.naturalWidth);
    setDisplaySize({ width, height });
  };

  const getRelativePoint = (
    e: React.PointerEvent<HTMLDivElement>,
  ): { x: number; y: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = getRelativePoint(e);
    setSelection({ x: dragStart.current.x, y: dragStart.current.y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const point = getRelativePoint(e);
    const x = Math.min(dragStart.current.x, point.x);
    const y = Math.min(dragStart.current.y, point.y);
    const w = Math.abs(point.x - dragStart.current.x);
    const h = Math.abs(point.y - dragStart.current.y);
    setSelection({ x, y, w, h });
  };

  const handlePointerUp = () => {
    dragStart.current = null;
  };

  const runOcr = async (image: HTMLCanvasElement | HTMLImageElement) => {
    setStatus("loading");
    setProgress(0);

    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("jpn", undefined, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/core/",
        langPath: "/tesseract/lang-data/",
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });
        const { data } = await worker.recognize(image, { rotateAuto: true });
        onResult(parseKaraokeResultText(data.text));
      } finally {
        await worker.terminate();
      }

      reset();
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  const reset = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setSelection(null);
    setStatus("idle");
  };

  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const hasSelection = selection && selection.w > 8 && selection.h > 8;
    if (!hasSelection) {
      runOcr(img);
      return;
    }

    const scale = img.naturalWidth / displaySize.width;
    const canvas = document.createElement("canvas");
    canvas.width = selection.w * scale;
    canvas.height = selection.h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      runOcr(img);
      return;
    }
    ctx.drawImage(
      img,
      selection.x * scale,
      selection.y * scale,
      selection.w * scale,
      selection.h * scale,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    runOcr(canvas);
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {status === "idle" && (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" />
          結果画面を撮影して読み取る
        </Button>
      )}

      {status === "cropping" && imageSrc && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            「曲名」「歌手名」が表示されている部分だけを指でなぞって囲んでください。ロゴや得点部分を含めないほど精度が上がります(囲まない場合は写真全体を読み取ります)
          </p>
          <div
            ref={containerRef}
            className="relative touch-none select-none overflow-hidden rounded-md border"
            style={{ width: displaySize.width, height: displaySize.height }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="撮影した結果画面"
              draggable={false}
              onLoad={handleImageLoad}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {selection && (
              <div
                className="absolute border-2 border-primary bg-primary/20"
                style={{
                  left: selection.x,
                  top: selection.y,
                  width: selection.w,
                  height: selection.h,
                }}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              撮り直す
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={handleConfirmCrop}
            >
              この範囲で読み取る
            </Button>
          </div>
        </div>
      )}

      {status === "loading" && (
        <Button type="button" variant="outline" className="gap-2" disabled>
          <Loader2 className="size-4 animate-spin" />
          読み取り中... {progress}%
        </Button>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-destructive">
            読み取りに失敗しました。別の写真でお試しください。
          </p>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setStatus("idle")}
          >
            <Camera className="size-4" />
            結果画面を撮影して読み取る
          </Button>
        </div>
      )}
    </div>
  );
}
