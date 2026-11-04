import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const MAX_FILE_SIZE = 500 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isSupportedImage(bytes: Uint8Array, contentType: string): boolean {
  if (!ALLOWED_TYPES.has(contentType)) {
    return false;
  }

  if (
    contentType === "image/jpeg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return true;
  }

  if (
    contentType === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return true;
  }

  return (
    contentType === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function POST(request: Request) {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json(
      { error: "You need to be signed in." },
      { status: 401 },
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || !/^[\w-]+$/.test(cloudName)) {
    console.error("Cloudinary avatar upload is not configured.");
    return Response.json(
      { error: "Photo uploads are temporarily unavailable." },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_FILE_SIZE + 64_000
  ) {
    return Response.json(
      { error: "Choose an image no larger than 500 KB." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Choose a valid image file." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { error: "Choose a valid image file." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "Choose an image no larger than 500 KB." },
      { status: 413 },
    );
  }

  const fileBytes = new Uint8Array(await file.arrayBuffer());
  if (!isSupportedImage(fileBytes, file.type)) {
    return Response.json(
      { error: "Use a JPEG, PNG, or WebP image." },
      { status: 415 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `avatar_${userId}`;
  const signatureParameters = `folder=avatars&overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(`${signatureParameters}${apiSecret}`)
    .digest("hex");

  const uploadData = new FormData();
  uploadData.set("file", file, file.name);
  uploadData.set("api_key", apiKey);
  uploadData.set("timestamp", String(timestamp));
  uploadData.set("folder", "avatars");
  uploadData.set("overwrite", "true");
  uploadData.set("public_id", publicId);
  uploadData.set("signature", signature);

  let cloudinaryResponse: Response;
  try {
    cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadData },
    );
  } catch (error) {
    console.error("Cloudinary avatar upload request failed.", error);
    return Response.json(
      { error: "We couldn't upload your photo. Please try again." },
      { status: 502 },
    );
  }

  if (!cloudinaryResponse.ok) {
    console.error(
      "Cloudinary rejected an avatar upload.",
      cloudinaryResponse.status,
    );
    return Response.json(
      { error: "We couldn't upload your photo. Please try again." },
      { status: 502 },
    );
  }

  const uploadResult: unknown = await cloudinaryResponse.json();
  if (
    typeof uploadResult !== "object" ||
    uploadResult === null ||
    !("secure_url" in uploadResult) ||
    typeof uploadResult.secure_url !== "string"
  ) {
    console.error("Cloudinary returned an invalid avatar upload response.");
    return Response.json(
      { error: "We couldn't upload your photo. Please try again." },
      { status: 502 },
    );
  }

  let avatarUrl: URL;
  try {
    avatarUrl = new URL(uploadResult.secure_url);
  } catch {
    return Response.json(
      { error: "We couldn't upload your photo. Please try again." },
      { status: 502 },
    );
  }

  if (
    avatarUrl.protocol !== "https:" ||
    avatarUrl.hostname !== "res.cloudinary.com"
  ) {
    console.error("Cloudinary returned an unexpected avatar URL.");
    return Response.json(
      { error: "We couldn't upload your photo. Please try again." },
      { status: 502 },
    );
  }

  try {
    await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl: avatarUrl.toString() },
      create: { userId, avatarUrl: avatarUrl.toString() },
    });
  } catch (error) {
    console.error("Could not save uploaded profile photo.", error);
    return Response.json(
      {
        error: "Your photo uploaded, but we couldn't save it to your profile.",
      },
      { status: 500 },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  return Response.json({ avatarUrl: avatarUrl.toString() });
}
