import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  profileUpsert: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getServerSession: async () => mocks.session,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      upsert: mocks.profileUpsert,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { POST } = await import("./route");

function createRequest(file?: File): Request {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  return new Request("http://localhost/api/profile/avatar", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  mocks.profileUpsert.mockReset().mockResolvedValue({});
  mocks.session = { user: { id: "user-123" } };
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/profile/avatar", () => {
  it("requires an authenticated user", async () => {
    mocks.session = null;

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
  });

  it("rejects content that is not a supported image", async () => {
    const file = new File(["not an image"], "avatar.txt", {
      type: "text/plain",
    });

    const response = await POST(createRequest(file));

    expect(response.status).toBe(415);
  });

  it("rejects images larger than 500 KB", async () => {
    const bytes = new Uint8Array(500 * 1024 + 1);
    bytes.set([0xff, 0xd8, 0xff]);
    const file = new File([bytes], "avatar.jpg", { type: "image/jpeg" });

    const response = await POST(createRequest(file));

    expect(response.status).toBe(413);
  });

  it("uploads a supported image using a signed Cloudinary request", async () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const file = new File([png], "avatar.png", { type: "image/png" });
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        secure_url:
          "https://res.cloudinary.com/test-cloud/image/upload/v1/avatars/avatar_user-123.png",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.avatarUrl).toContain("res.cloudinary.com/test-cloud");
    expect(mocks.profileUpsert).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      update: { avatarUrl: body.avatarUrl },
      create: { userId: "user-123", avatarUrl: body.avatarUrl },
    });

    const uploadData = fetchMock.mock.calls[0][1].body as FormData;
    expect(uploadData.get("api_key")).toBe("test-key");
    expect(uploadData.get("public_id")).toBe("avatar_user-123");
    expect(uploadData.get("signature")).toMatch(/^[a-f0-9]{40}$/);
  });
});
