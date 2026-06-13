import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, and WebP images are allowed" },
      { status: 400 },
    );
  }

  // Validate size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("screenshots")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("screenshots")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
