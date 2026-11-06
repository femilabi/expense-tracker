import type { CSSProperties, ReactNode } from "react";

/** Shared building blocks so every email looks the same. */

const colors = {
  text: "#14213d",
  muted: "#5b6b7f",
  brand: "#0e8388",
  surface: "#f0f4f8",
};

export function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: colors.text }}
    >
      {children}
    </div>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <h1 style={{ fontSize: 20 }}>{children}</h1>;
}

export function Paragraph({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <p style={style}>{children}</p>;
}

/** Smaller grey text for expiry notes and disclaimers. */
export function Muted({ children }: { children: ReactNode }) {
  return <p style={{ color: colors.muted, fontSize: 14 }}>{children}</p>;
}

export function Button({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <p>
      <a
        href={href}
        style={{
          background: colors.brand,
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: 999,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children}
      </a>
    </p>
  );
}

/** The plain link under a button, for mail clients that block buttons. */
export function LinkFallback({ href }: { href: string }) {
  return (
    <Muted>
      If the button doesn&apos;t work, copy this link into your browser:
      <br />
      {href}
    </Muted>
  );
}

/** A one-time code shown large and spaced out so it is easy to copy. */
export function CodeBox({ code }: { code: string }) {
  return (
    <p
      style={{
        fontSize: 32,
        fontWeight: "bold",
        letterSpacing: 8,
        fontFamily: "'Courier New', Courier, monospace",
        background: colors.surface,
        borderRadius: 12,
        padding: "16px 24px",
        display: "inline-block",
        margin: "8px 0",
      }}
    >
      {code}
    </p>
  );
}
