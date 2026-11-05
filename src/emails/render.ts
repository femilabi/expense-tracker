import {
  Fragment,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

import { escapeHtml } from "@/emails/utils";

/**
 * Turns an email component tree into an HTML string.
 *
 * `react-dom/server` cannot be imported where emails are sent (server actions
 * run as React Server Components), so this small renderer is used instead. It
 * supports what the templates need: HTML elements, fragments and plain
 * function components. Hooks, context and Suspense are not supported.
 */
export function renderEmail(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return escapeHtml(String(node));
  }
  if (Array.isArray(node)) {
    return node.map(renderEmail).join("");
  }
  if (!isValidElement(node)) {
    throw new Error("Unsupported node in email template.");
  }

  const element = node as ReactElement<Record<string, unknown>>;
  const { type, props } = element;

  if (type === Fragment) {
    return renderEmail(props.children as ReactNode);
  }
  if (typeof type === "function") {
    const component = type as (props: Record<string, unknown>) => ReactNode;
    return renderEmail(component(props));
  }
  if (typeof type !== "string") {
    throw new Error("Unsupported element type in email template.");
  }

  const attributes = renderAttributes(props);
  if (VOID_ELEMENTS.has(type)) {
    return `<${type}${attributes} />`;
  }
  return `<${type}${attributes}>${renderEmail(props.children as ReactNode)}</${type}>`;
}

const VOID_ELEMENTS = new Set(["br", "hr", "img", "meta", "link", "input"]);

const ATTRIBUTE_NAMES: Record<string, string> = {
  className: "class",
  htmlFor: "for",
};

/** CSS properties whose numeric values have no unit. */
const UNITLESS_STYLES = new Set([
  "flex",
  "fontWeight",
  "lineHeight",
  "opacity",
  "zIndex",
]);

function renderAttributes(props: Record<string, unknown>): string {
  let html = "";

  for (const [name, value] of Object.entries(props)) {
    if (
      name === "children" ||
      name === "key" ||
      name === "ref" ||
      /^on[A-Z]/.test(name) ||
      value === null ||
      value === undefined ||
      value === false
    ) {
      continue;
    }

    const attribute = ATTRIBUTE_NAMES[name] ?? name;
    if (value === true) {
      html += ` ${attribute}`;
    } else if (name === "style") {
      const css = renderStyle(value as CSSProperties);
      if (css) {
        html += ` style="${escapeHtml(css)}"`;
      }
    } else {
      html += ` ${attribute}="${escapeHtml(String(value))}"`;
    }
  }

  return html;
}

function renderStyle(style: CSSProperties): string {
  return Object.entries(style)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
    .map(([property, value]) => {
      const cssProperty = property.replace(
        /[A-Z]/g,
        (c) => `-${c.toLowerCase()}`,
      );
      const cssValue =
        typeof value === "number" &&
        value !== 0 &&
        !UNITLESS_STYLES.has(property)
          ? `${value}px`
          : String(value);
      return `${cssProperty}:${cssValue}`;
    })
    .join(";");
}
