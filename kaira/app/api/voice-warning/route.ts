import {
  NextResponse,
} from "next/server";

import {
  DEFAULT_KAIRA_VOICE,
  KAIRA_VOICES,
} from "@/lib/utils/kaira-voices";

import type {
  KairaVoice,
} from "@/lib/utils/kaira-voices";

interface VoiceWarningRequest {
  purchaseName: string;
  purchaseAmount: number;
  safeToSpendAfter: number;
  upcomingExpenses: number;

  voice?: string;

  // NEW:
  // lets Kaira speak a Guard recommendation
  message?: string;
}

function formatMoneyForSpeech(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Math.abs(amount),
  );
}

export async function POST(
  request: Request,
) {
  try {
    const body:
      VoiceWarningRequest =
      await request.json();

    const apiKey =
      process.env
        .ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ElevenLabs API key is missing.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      typeof body.purchaseAmount !==
        "number" ||
      !Number.isFinite(
        body.purchaseAmount,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid purchase amount.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof body.safeToSpendAfter !==
        "number" ||
      !Number.isFinite(
        body.safeToSpendAfter,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid safe-to-spend value.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Voice selection.
     * Hope is used through
     * DEFAULT_KAIRA_VOICE.
     */
    const requestedVoice =
      typeof body.voice ===
        "string"
        ? body.voice
        : DEFAULT_KAIRA_VOICE;

    const voiceKey =
      requestedVoice in
      KAIRA_VOICES
        ? (requestedVoice as KairaVoice)
        : DEFAULT_KAIRA_VOICE;

    const voice =
      KAIRA_VOICES[
        voiceKey
      ];

    const purchase =
      body.purchaseName?.trim() ||
      "this purchase";

    const amount =
      formatMoneyForSpeech(
        body.purchaseAmount,
      );

    const commitments =
      formatMoneyForSpeech(
        body.upcomingExpenses,
      );

    const deficit =
      body.safeToSpendAfter < 0
        ? formatMoneyForSpeech(
            body.safeToSpendAfter,
          )
        : null;

    /*
     * Normal "Hear Kaira" warning.
     */
    const generatedWarning =
      deficit
        ? `Kaira warning. Buying ${purchase} for ${amount} Mexican pesos could put your upcoming commitments at risk. You have about ${commitments} pesos in upcoming commitments, and this purchase would leave you around ${deficit} pesos below your safe spending margin. Consider delaying or reducing this purchase.`
        : `Kaira warning. Buying ${purchase} for ${amount} Mexican pesos would leave very little room for your upcoming commitments. You currently have about ${commitments} pesos in expected charges. Consider waiting or reducing this purchase.`;

    /*
     * If Guard sends us a recommendation,
     * speak that instead.
     *
     * Limit length so an accidental request
     * cannot eat a mountain of credits.
     */
    const customMessage =
      typeof body.message ===
        "string"
        ? body.message
            .trim()
            .slice(
              0,
              500,
            )
        : "";

    const warning =
      customMessage ||
      generatedWarning;

    const elevenLabsResponse =
      await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
          voice.voiceId,
        )}?output_format=mp3_44100_128`,
        {
          method: "POST",

          headers: {
            "xi-api-key":
              apiKey,

            "Content-Type":
              "application/json",

            Accept:
              "audio/mpeg",
          },

          body:
            JSON.stringify({
              text:
                warning,

              model_id:
                "eleven_flash_v2_5",
            }),
        },
      );

    if (
      !elevenLabsResponse.ok
    ) {
      const errorText =
        await elevenLabsResponse.text();

      console.error(
        "ElevenLabs error:",
        elevenLabsResponse.status,
        errorText,
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Unable to generate Kaira voice.",
        },
        {
          status: 502,
        },
      );
    }

    const audio =
      await elevenLabsResponse.arrayBuffer();

    return new Response(
      audio,
      {
        status: 200,

        headers: {
          "Content-Type":
            "audio/mpeg",

          "Cache-Control":
            "no-store",

          "X-Kaira-Voice":
            voice.name,
        },
      },
    );
  } catch (error) {
    console.error(
      "Kaira voice error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to generate voice warning.",
      },
      {
        status: 500,
      },
    );
  }
}