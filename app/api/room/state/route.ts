import { cookies } from "next/headers";
import {
  decodeRoomState,
  encodeRoomState,
  parseRoomStatePatch,
  ROOM_STATE_COOKIE,
} from "@/app/_lib/room-state";

const responseOptions = {
  headers: {
    "Cache-Control": "no-store",
  },
};

export async function GET() {
  const cookieStore = await cookies();
  const state = decodeRoomState(cookieStore.get(ROOM_STATE_COOKIE)?.value);
  return Response.json(state, responseOptions);
}

export async function PATCH(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, ...responseOptions },
    );
  }

  const patch = parseRoomStatePatch(input);

  if (!patch) {
    return Response.json(
      { error: "Invalid room state patch" },
      { status: 400, ...responseOptions },
    );
  }

  const cookieStore = await cookies();
  const current = decodeRoomState(cookieStore.get(ROOM_STATE_COOKIE)?.value);
  const state = { ...current, ...patch };

  cookieStore.set(ROOM_STATE_COOKIE, encodeRoomState(state), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json(state, responseOptions);
}
