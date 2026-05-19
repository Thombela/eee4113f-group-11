import path from "path";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";

const INPUT_IMAGE = "public/esp32_images/2026/05/13/22_0_original.jpg";

export async function GET() { 

    const inputPath = path.join(process.cwd(), INPUT_IMAGE);


    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    const { data } = await sharp(inputPath)
      .removeAlpha()        // ensure no alpha channel
      .raw()                // decode to raw RGB pixel buffer
      .toBuffer({ resolveWithObject: true });
    const score = calculateRedChannelScore(data);

    return NextResponse.json(
          { score: score },
          { status: 200 }
        );
}

function calculateRedChannelScore(
  pixels: Buffer
): number {

    let totalRed = 0;
    let validCount = 0;

    const BLACK_THRESHOLD = 20;
    const WHITE_THRESHOLD = 245;

    for (let i = 0; i < pixels.length; i += 3) {

        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];

        const brightness = (r + g + b) / 3;

        // Remove dark background
        if (brightness < BLACK_THRESHOLD)
            continue;

        // Remove saturated reflections
        if (brightness > WHITE_THRESHOLD)
            continue;

        // Since createRedChannelAnalysis produces:
        // R=enhanced
        // G=0.15×enhanced
        // B=0.15×enhanced
        // we only need R

        totalRed += r;
        validCount++;
    }

    if(validCount===0)
        return 0;

    const averageRed = totalRed / validCount;

    return Number(
        ((averageRed / 255) * 100).toFixed(2)
    );
}