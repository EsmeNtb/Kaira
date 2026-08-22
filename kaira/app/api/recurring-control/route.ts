import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

type ControlMode =
  | "auto-pay"
  | "ask-me"
  | "watch"
  | "cancel";

interface RecurringControlRequest {
  merchant: string;

  controlMode:
    ControlMode;
}

const allowedControls:
  ControlMode[] = [
    "auto-pay",
    "ask-me",
    "watch",
    "cancel",
  ];

export async function POST(
  request: Request,
) {
  try {
    const body:
      RecurringControlRequest =
      await request.json();

    const accountId =
      process.env
        .DEMO_ACCOUNT_ID;

    if (!accountId) {
      throw new Error(
        "DEMO_ACCOUNT_ID is missing.",
      );
    }

    if (
      !body.merchant ||
      !allowedControls.includes(
        body.controlMode,
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid recurring control.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      error,
    } =
      await supabaseServer
        .from(
          "recurring_controls",
        )
        .upsert(
          {
            account_id:
              accountId,

            merchant:
              body.merchant,

            control_mode:
              body.controlMode,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "account_id,merchant",
          },
        );

    if (error) {
      throw new Error(
        `Unable to save recurring control: ${error.message}`,
      );
    }

    /*
     * n8n is optional.
     * Database still works
     * without it.
     */
    const webhookUrl =
      process.env
        .N8N_RECURRING_WEBHOOK_URL;

    let automationTriggered =
      false;

    if (webhookUrl) {
      try {
        const response =
          await fetch(
            webhookUrl,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  source:
                    "kaira",

                  event:
                    "recurring_control_changed",

                  timestamp:
                    new Date()
                      .toISOString(),

                  data: {
                    accountId,

                    merchant:
                      body.merchant,

                    controlMode:
                      body.controlMode,
                  },
                }),
            },
          );

        automationTriggered =
          response.ok;
      } catch (error) {
        console.error(
          "Unable to trigger n8n recurring workflow:",
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,

      merchant:
        body.merchant,

      controlMode:
        body.controlMode,

      automationTriggered,
    });
  } catch (error) {
    console.error(
      "Recurring control error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update recurring control.",
      },
      {
        status: 500,
      },
    );
  }
}