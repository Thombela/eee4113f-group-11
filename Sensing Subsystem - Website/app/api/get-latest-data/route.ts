import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const apiKey = process.env.TTN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "Missing TTN_API_KEY" },
      { status: 500 }
    );
  }

  const url =
    "https://api.thingspeak.com/channels/3378597/feeds.json?results=2";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ThingSpeak data" },
      { status: response.status }
    );
  }

  const json = await response.json();
  const { channel, feeds } = json;

  const data = feeds.map((feed: any) => {
    const decoded_payload = {
      battery_percent: Number(feed.field7) || 0,
      dissolved_oxygen_mg_L: Number(feed.field6) || 0,
      image_size_kB: 0, // not provided in ThingSpeak feed → adjust if available
      latitude: Number(feed.field1),
      longitude: Number(feed.field2),
      mission_packet: String(feed.field8 || ""),
      salinity_ppt: Number(feed.field5),
      system_status: "OK", // placeholder (update if you have a field)
      temperature_C: Number(feed.field4),
      tilt_x: Number(feed.field3),
    };

    return {
      entryId: feed.entry_id,
      timestamp: feed.created_at,
      decoded_payload,
    };
  });

  // =========================
  // SAVE LATEST TO JSON FILE
  // =========================

  const latest = data[data.length - 1];

  const filePath = path.join(process.cwd(), "data", "sensor-data.json");

  try {
    // ensure folder exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // write file
    fs.writeFileSync(filePath, JSON.stringify(latest, null, 2));
  } catch (err) {
    console.error("Failed to write JSON file:", err);
  }

  return NextResponse.json({
    success: true,
    channel,
    count: data.length,
    data,
  });
}