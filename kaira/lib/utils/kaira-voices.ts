export const KAIRA_VOICES = {
  samantha: {
    name: "Samantha",
    voiceId: "LJwPgeJYv0dNJzEtXVO6",
  },

  ada: {
    name: "Ada",
    voiceId: "s3TPKV1kjDlVtZbl4Ksh",
  },

  john: {
    name: "John",
    voiceId: "sB7vwSCyX0tQmU24cW2C",
  },

  hope: {
    name: "Hope",
    voiceId: "OYTbf65OHHFELVut7v2H",
  },

  belle: {
    name: "Belle",
    voiceId: "aKw9UnnjRq5scbeeGI7Z",
  },

  alex: {
    name: "Alex",
    voiceId: "SHJeg1jtED7EW6Zr6rHc",
  },
} as const;

export type KairaVoice =
  keyof typeof KAIRA_VOICES;

export const DEFAULT_KAIRA_VOICE:
  KairaVoice = "hope";