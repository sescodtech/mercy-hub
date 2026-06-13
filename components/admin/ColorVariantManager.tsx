"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Plus, X, Upload, Loader2, GripVertical, Eye, EyeOff,
  Palette, ChevronDown, ChevronUp,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";
import type { IColorVariant } from "@/types";

interface Props {
  productId: string;
  variants: IColorVariant[];
  onChange: (variants: IColorVariant[]) => void;
}

const EMPTY_VARIANT: Omit<IColorVariant, "_id"> = {
  label: "",
  colorHex: "#d98c2a",
  images: [],
  sku: "",
  priceOverride: null,
  stock: 0,
  enabled: true,
  sortOrder: 0,
};

export function ColorVariantManager({ productId, variants, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const add = () => {
    const newVariant: IColorVariant = {
      ...EMPTY_VARIANT,
      sortOrder: variants.length,
    };
    onChange([...variants, newVariant]);
    setExpanded(variants.length);
  };

  const remove = (i: number) => {
    onChange(variants.filter((_, j) => j !== i));
    if (expanded === i) setExpanded(null);
  };

  const update = (i: number, key: keyof IColorVariant, val: unknown) => {
    const next = [...variants];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...variants];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next.map((v, idx) => ({ ...v, sortOrder: idx })));
    setExpanded(i - 1);
  };

  const moveDown = (i: number) => {
    if (i === variants.length - 1) return;
    const next = [...variants];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next.map((v, idx) => ({ ...v, sortOrder: idx })));
    setExpanded(i + 1);
  };

  const uploadImages = async (i: number, files: FileList) => {
    if (variants[i].images.length + files.length > 5) {
      toast.error("Max 5 images per variant");
      return;
    }
    setUploading(i);
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "products/variants");
          const { data } = await axios.post("/api/upload", fd);
          return data.url as string;
        })
      );
      update(i, "images", [...variants[i].images, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (variantIdx: number, imgIdx: number) => {
    const imgs = [...variants[variantIdx].images];
    imgs.splice(imgIdx, 1);
    update(variantIdx, "images", imgs);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#d98c2a]" />
          <label className="text-sm font-semibold text-neutral-700">
            Color Variants
            {variants.length > 0 && (
              <span className="ml-2 text-xs font-normal text-neutral-400">
                ({variants.length} variant{variants.length !== 1 ? "s" : ""})
              </span>
            )}
          </label>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-[#d98c2a] hover:text-[#c47020] font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add Color
        </button>
      </div>

      {variants.length === 0 && (
        <div className="border-2 border-dashed border-neutral-200 rounded-xl py-8 text-center">
          <Palette className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">No color variants yet</p>
          <button
            type="button"
            onClick={add}
            className="mt-2 text-xs text-[#d98c2a] hover:underline"
          >
            Add your first color variant
          </button>
        </div>
      )}

      {variants.map((v, i) => (
        <div
          key={i}
          className={cn(
            "border rounded-xl overflow-hidden transition-all",
            v.enabled ? "border-neutral-200" : "border-neutral-100 opacity-60",
            expanded === i && "border-[#d98c2a]/40"
          )}
        >
          {/* Header row */}
          <div
            className="flex items-center gap-3 px-4 py-3 bg-neutral-50 cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <GripVertical className="w-4 h-4 text-neutral-300 flex-shrink-0" />

            {/* Color swatch */}
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: v.colorHex }}
            />

            <span className="text-sm font-medium text-neutral-800 flex-1 truncate">
              {v.label || <span className="text-neutral-400 italic">Untitled color</span>}
            </span>

            <span className="text-xs text-neutral-400 hidden sm:block">
              Stock: {v.stock}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => update(i, "enabled", !v.enabled)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
                title={v.enabled ? "Disable variant" : "Enable variant"}
              >
                {v.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => moveDown(i)} disabled={i === variants.length - 1}
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => remove(i)}
                className="p-1 text-neutral-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {expanded === i
              ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
          </div>

          {/* Expanded body */}
          {expanded === i && (
            <div className="p-4 bg-white space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Label */}
                <div>
                  <label className="form-label">Color Name *</label>
                  <input
                    value={v.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                    placeholder="e.g. Midnight Black"
                    className="form-input w-full"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="form-label">Color Swatch *</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={v.colorHex}
                      onChange={(e) => update(i, "colorHex", e.target.value)}
                      className="w-12 h-10 border border-neutral-200 rounded cursor-pointer p-0.5"
                    />
                    <input
                      value={v.colorHex}
                      onChange={(e) => update(i, "colorHex", e.target.value)}
                      placeholder="#d98c2a"
                      className="form-input flex-1 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* SKU */}
                <div>
                  <label className="form-label">SKU (optional)</label>
                  <input
                    value={v.sku ?? ""}
                    onChange={(e) => update(i, "sku", e.target.value)}
                    placeholder="MHE-001-BLK"
                    className="form-input w-full font-mono"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="form-label">Stock Quantity</label>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => update(i, "stock", Number(e.target.value))}
                    min={0}
                    className="form-input w-full"
                  />
                </div>

                {/* Price Override */}
                <div className="sm:col-span-2">
                  <label className="form-label">
                    Price Override (₦)
                    <span className="text-neutral-400 font-normal ml-1">— leave blank to use base product price</span>
                  </label>
                  <input
                    type="number"
                    value={v.priceOverride ?? ""}
                    onChange={(e) =>
                      update(i, "priceOverride", e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="Leave blank = base price"
                    className="form-input w-full sm:w-1/2"
                  />
                </div>
              </div>

              {/* Images for this variant */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">
                    Variant Images
                    <span className="text-neutral-400 font-normal ml-1">(max 5)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileRefs.current[i]?.click()}
                    disabled={uploading === i || v.images.length >= 5}
                    className="flex items-center gap-1.5 text-xs text-[#d98c2a] disabled:opacity-40"
                  >
                    {uploading === i
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Upload className="w-3 h-3" />}
                    Upload Images
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && uploadImages(i, e.target.files)}
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {v.images.map((url, imgIdx) => (
                    <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 group">
                      <Image src={url} alt={`${v.label} ${imgIdx + 1}`} fill className="object-cover" sizes="64px" />
                      <button
                        type="button"
                        onClick={() => removeImage(i, imgIdx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}

                  {v.images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[i]?.click()}
                      disabled={uploading === i}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center text-neutral-300 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors"
                    >
                      {uploading === i
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Plus className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {v.images.length === 0 && (
                  <p className="text-xs text-neutral-400 mt-1">
                    No images — product base images will be shown for this color.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
