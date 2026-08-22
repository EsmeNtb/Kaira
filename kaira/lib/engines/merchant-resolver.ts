interface MerchantRule {
  pattern: RegExp;
  canonicalName: string;
}

const merchantRules: MerchantRule[] = [
  {
    pattern: /^SPOTIFY\b/,
    canonicalName: "SPOTIFY",
  },

  {
    pattern: /^NETFLIX\b/,
    canonicalName: "NETFLIX",
  },

  {
    pattern: /^TELCEL\b/,
    canonicalName: "TELCEL",
  },

  {
    pattern: /^(?:DISNEY PLUS|DISNEY)\b/,
    canonicalName: "DISNEY PLUS",
  },

  {
    pattern: /^(?:HBO MAX|MAX)\b/,
    canonicalName: "MAX",
  },

  {
    pattern: /^AMAZON PRIME\b/,
    canonicalName: "AMAZON PRIME",
  },

  {
    pattern: /^(?:CELSYS )?CLIP STUDIO\b/,
    canonicalName: "CLIP STUDIO",
  },

  {
    pattern: /^(?:MICROSOFT )?XBOX GAME PASS\b/,
    canonicalName: "XBOX GAME PASS",
  },

  {
    pattern: /^GOOGLE ONE\b/,
    canonicalName: "GOOGLE ONE",
  },

  {
    pattern: /^(?:APPLE )?ICLOUD\b/,
    canonicalName: "ICLOUD",
  },

  {
    pattern: /^(?:OPENAI )?CHATGPT PLUS\b/,
    canonicalName: "CHATGPT PLUS",
  },

  {
    pattern: /^XLAG\b/,
    canonicalName: "XLAG",
  },

  {
    pattern: /^ADOBE\b/,
    canonicalName: "ADOBE",
  },

  // More specific Uber rule first
  {
    pattern: /^UBER EATS\b/,
    canonicalName: "UBER EATS",
  },

  {
    pattern: /^UBER(?:\s+TRIP)?\b/,
    canonicalName: "UBER",
  },

  // Amazon Prime must come before generic Amazon
  {
    pattern: /^AMAZON\b/,
    canonicalName: "AMAZON",
  },
];

function cleanMerchantName(
  merchant: string,
): string {
  return merchant
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()

    // Common banking noise
    .replace(/\.COM/g, " ")
    .replace(/\bMEXICO\b/g, " ")
    .replace(/\bMX\b/g, " ")
    .replace(/\bPAYMENT\b/g, " ")
    .replace(/\bCARD\b/g, " ")

    // Convert separators into spaces
    .replace(/[*+_-]/g, " ")

    // Remove remaining punctuation
    .replace(/[^A-Z0-9 ]/g, " ")

    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveMerchant(
  rawMerchant: string,
): string {
  const cleanedMerchant =
    cleanMerchantName(rawMerchant);

  for (const rule of merchantRules) {
    if (
      rule.pattern.test(
        cleanedMerchant,
      )
    ) {
      return rule.canonicalName;
    }
  }

  return cleanedMerchant;
}