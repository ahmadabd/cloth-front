import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  
  // Here you would typically save the profile data to your database
  // and/or send it to your external API

  return NextResponse.json({ success: true });
} 