// app/api/process-image/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INPUT_IMAGE = "public/esp32_images/original.jpg";
const OUTPUT_DIR = "public/esp32_images/processed";

export async function GET() {
  try {
    console.log("GET started");

    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    console.log("sharp imported");

    const inputPath = path.join(process.cwd(), INPUT_IMAGE);
    const outputDir = path.join(process.cwd(), OUTPUT_DIR);

    await fs.mkdir(outputDir, { recursive: true });
    console.log("made paths");

    const originalOut = path.join(outputDir, "0_original.jpg");
    const denoisedOut = path.join(outputDir, "1_denoised_sharpened.jpg");
    const colourOut = path.join(outputDir, "2_colour_corrected.jpg");
    const contrastOut = path.join(outputDir, "3_contrast_enhanced.jpg");
    const redOut = path.join(outputDir, "4_red_channel_analysis.jpg");
    const maskOut = path.join(outputDir, "5_red_fluorescence_mask.jpg");
    const heatmapOut = path.join(outputDir, "6_chlorophyll_proxy_heatmap.jpg");

    const base = sharp(inputPath).rotate().removeAlpha();

    const { data, info } = await base
      .clone()
      .resize({ width: 800, withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    console.log({ width, height, channels });

    await base.clone().jpeg({ quality: 95 }).toFile(originalOut);

    await base
      .clone()
      .median(3)
      .sharpen()
      .jpeg({ quality: 95 })
      .toFile(denoisedOut);

    await base
      .clone()
      .modulate({ brightness: 1.04, saturation: 1.15 })
      .normalise()
      .jpeg({ quality: 95 })
      .toFile(colourOut);

    await base
      .clone()
      .normalise()
      .linear(1.25, -18)
      .sharpen()
      .jpeg({ quality: 95 })
      .toFile(contrastOut);

    const redAnalysis = createRedChannelAnalysis(data, width, height, channels);
    const fluorescenceMask = createRedFluorescenceMask(data, width, height, channels);

    await sharp(redAnalysis, {
      raw: { width, height, channels: 3 },
    })
      .jpeg({ quality: 95 })
      .toFile(redOut);

    await sharp(fluorescenceMask, {
      raw: { width, height, channels: 3 },
    })
      .jpeg({ quality: 95 })
      .toFile(maskOut);


    const chlorophyllHeatmap = createChlorophyllProxyHeatmap(
      data,
      width,
      height,
      channels
    );

    await sharp(chlorophyllHeatmap, {
      raw: { width, height, channels: 3 },
    })
      .jpeg({ quality: 95 })
      .toFile(heatmapOut);

    return NextResponse.json({
      success: true,
      width,
      height,
      files: {
        original: "/esp32_images/processed/0_original.jpg",
        denoised: "/esp32_images/processed/1_denoised_sharpened.jpg",
        colour_corrected: "/esp32_images/processed/2_colour_corrected.jpg",
        contrast_enhanced: "/esp32_images/processed/3_contrast_enhanced.jpg",
        red_channel: "/esp32_images/processed/4_red_channel_analysis.jpg",
        fluorescence_mask: "/esp32_images/processed/5_red_fluorescence_mask.jpg",
        chlorophyll_proxy_heatmap: "/esp32_images/processed/6_chlorophyll_proxy_heatmap.jpg",
      },
    });
  } catch (error) {
    console.error("PROCESS IMAGE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function createRedChannelAnalysis(
  src: Buffer,
  width: number,
  height: number,
  channels: number
) {
  const dst = Buffer.alloc(width * height * 3);
  const n = width * height;

  let minRed = 255;
  let maxRed = 0;

  for (let i = 0; i < n; i++) {
    const r = src[i * channels];
    if (r < minRed) minRed = r;
    if (r > maxRed) maxRed = r;
  }

  const range = Math.max(1, maxRed - minRed);

  for (let i = 0; i < n; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 3;

    const r = src[srcIdx];
    const enhancedRed = Math.round(((r - minRed) / range) * 255);

    dst[dstIdx] = enhancedRed;
    dst[dstIdx + 1] = Math.round(enhancedRed * 0.15);
    dst[dstIdx + 2] = Math.round(enhancedRed * 0.15);
  }

  return dst;
}

function createRedFluorescenceMask(
  src: Buffer,
  width: number,
  height: number,
  channels: number
) {
  const dst = Buffer.alloc(width * height * 3);
  const n = width * height;
  const scores = new Float32Array(n);

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < n; i++) {
    const idx = i * channels;

    const r = src[idx];
    const g = src[idx + 1];
    const b = src[idx + 2];

    const score = r - 0.5 * g - 0.5 * b;

    scores[i] = score;
    sum += score;
    sumSq += score * score;
  }

  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const std = Math.sqrt(Math.max(variance, 1));
  const threshold = mean + 1.2 * std;

  for (let i = 0; i < n; i++) {
    const dstIdx = i * 3;
    const score = scores[i];

    if (score > threshold) {
      const intensity = Math.round(Math.min(255, ((score - threshold) / std) * 120));

      dst[dstIdx] = 255;
      dst[dstIdx + 1] = intensity;
      dst[dstIdx + 2] = intensity;
    } else {
      dst[dstIdx] = 35;
      dst[dstIdx + 1] = 35;
      dst[dstIdx + 2] = 35;
    }
  }

  return dst;
}

function createChlorophyllProxyHeatmap(
  src: Buffer,
  width: number,
  height: number,
  channels: number
) {
  const n = width * height;
  const scores = new Float32Array(n);
  const dst = Buffer.alloc(width * height * 3);

  let minScore = Infinity;
  let maxScore = -Infinity;

  for (let i = 0; i < n; i++) {
    const idx = i * channels;

    const r = src[idx];
    const g = src[idx + 1];
    const b = src[idx + 2];

    // Red fluorescence proxy score
    const score = r - 0.5 * g - 0.5 * b;

    scores[i] = score;

    if (score < minScore) minScore = score;
    if (score > maxScore) maxScore = score;
  }

  const range = Math.max(1, maxScore - minScore);

  for (let i = 0; i < n; i++) {
    const value = (scores[i] - minScore) / range;

    const [r, g, b] = heatmapColour(value);

    const dstIdx = i * 3;
    dst[dstIdx] = r;
    dst[dstIdx + 1] = g;
    dst[dstIdx + 2] = b;
  }

  return dst;
}

function heatmapColour(value: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));

  // Blue → cyan → green → yellow → red
  if (v < 0.25) {
    const t = v / 0.25;
    return [0, Math.round(255 * t), 255];
  }

  if (v < 0.5) {
    const t = (v - 0.25) / 0.25;
    return [0, 255, Math.round(255 * (1 - t))];
  }

  if (v < 0.75) {
    const t = (v - 0.5) / 0.25;
    return [Math.round(255 * t), 255, 0];
  }

  const t = (v - 0.75) / 0.25;
  return [255, Math.round(255 * (1 - t)), 0];
}