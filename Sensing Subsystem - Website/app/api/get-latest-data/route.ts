import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.TTN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "Missing TTN_API_KEY" },
      { status: 500 }
    );
  }

  const url =
    "https://eu1.cloud.thethings.network/api/v3/as/applications/group11-sensing-station/packages/storage/uplink_message?last=48h";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
    },
    cache: "no-store",
  });

  const text = await response.text();

  const data: payload[] = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line).result;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

    data.map(dataPayload => {
        const sensorData = dataPayload.uplink_message.decoded_payload;

        
    })
    return NextResponse.json({
        success: true,
        count: data.length,
        data,
    });
}