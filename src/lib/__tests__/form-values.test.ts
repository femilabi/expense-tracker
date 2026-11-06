import { describe, expect, it } from "vitest";

import { keepFormValues } from "../form-values";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

describe("keepFormValues", () => {
  it("returns only the named fields, exactly as typed", () => {
    const formData = form({
      name: "Ayanda Dlokova",
      email: " Ayanda@Example.com ",
      password: "Secret-123!",
    });

    expect(keepFormValues(formData, ["name", "email"])).toEqual({
      name: "Ayanda Dlokova",
      email: " Ayanda@Example.com ",
    });
  });

  it("skips fields that weren't sent and files", () => {
    const formData = form({ email: "a@example.com" });
    formData.set("avatar", new Blob(["x"]), "avatar.png");

    expect(keepFormValues(formData, ["name", "email", "avatar"])).toEqual({
      email: "a@example.com",
    });
  });

  it("cuts very long values short", () => {
    const formData = form({ email: "a".repeat(5000) });

    expect(keepFormValues(formData, ["email"]).email).toHaveLength(320);
  });
});
