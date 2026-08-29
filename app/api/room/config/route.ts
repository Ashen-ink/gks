const baseUrl = (process.env.BASE_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export async function GET() {
  try {
    const response = await fetch(`${baseUrl}/v1/room/config`, {
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { error: "Room config service unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
