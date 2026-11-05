/**
 * Turns a browser's user agent string into a short name people recognise,
 * such as "Edge on Windows". Only common browsers and systems are named.
 */

// Order matters: Edge, Opera and Samsung Internet also say "Chrome", and
// Chrome also says "Safari".
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Version\/[\d.]+.*Safari\//, "Safari"],
];

// iPhones and iPads also say "Mac OS X", and Android also says "Linux".
const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/Linux/, "Linux"],
];

function findName(userAgent: string, names: [RegExp, string][]) {
  return names.find(([pattern]) => pattern.test(userAgent))?.[1];
}

export function describeUserAgent(userAgent: string): string {
  const browser = findName(userAgent, BROWSERS);
  const system = findName(userAgent, SYSTEMS);

  if (browser && system) {
    return `${browser} on ${system}`;
  }
  if (browser) {
    return browser;
  }
  if (system) {
    return `A browser on ${system}`;
  }
  return "Unknown device";
}
