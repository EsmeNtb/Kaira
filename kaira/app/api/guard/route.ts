import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";

interface GuardRequest {
  purchaseName: string;
  purchaseAmount: number;
  riskLevel: "safe" | "warning" | "danger";
  safeToSpendAfter: number;
  upcomingExpenses: number;
}

export async function POST(request: Request) {
  try {
    const body: GuardRequest =
      await request.json();

    if (
      typeof body.purchaseAmount !== "number" ||
      !body.riskLevel
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid guard request.",
        },
        {
          status: 400,
        },
      );
    }

    const accountId =
      process.env.DEMO_ACCOUNT_ID;

    if (!accountId) {
      throw new Error(
        "DEMO_ACCOUNT_ID is missing.",
      );
    }

    const event = {
      source: "kaira",
      event: "financial_risk_detected",
      timestamp: new Date().toISOString(),

      data: {
        purchaseName:
          body.purchaseName ||
          "Planned purchase",

        purchaseAmount:
          body.purchaseAmount,

        riskLevel:
          body.riskLevel,

        safeToSpendAfter:
          body.safeToSpendAfter,

        upcomingExpenses:
          body.upcomingExpenses,
      },
    };

    const webhookUrl =
      process.env.N8N_GUARD_WEBHOOK_URL;

    // -------------------------
    // DEMO MODE
    // -------------------------

    if (!webhookUrl) {
      console.log(
        "Kaira Guard event:",
        event,
      );

      const recommendation =
        "Kaira Guard activated in demo mode.";

      const { error: guardEventError } =
        await supabaseServer
          .from("guard_events")
          .insert({
            account_id: accountId,

            purchase_name:
              body.purchaseName ||
              "Planned purchase",

            purchase_amount:
              body.purchaseAmount,

            risk_level:
              body.riskLevel,

            safe_to_spend_after:
              body.safeToSpendAfter,

            upcoming_expenses:
              body.upcomingExpenses,

            recommendation,

            status: "protected",
          });

      if (guardEventError) {
        console.error(
          "Unable to save demo guard event:",
          guardEventError.message,
        );
      }

      return NextResponse.json({
        success: true,
        mode: "demo",
        message: recommendation,
      });
    }

    // -------------------------
    // N8N AUTOMATION
    // -------------------------

    const response = await fetch(
      webhookUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "n8n webhook error:",
        response.status,
        errorText,
      );

      throw new Error(
        `n8n webhook request failed: ${response.status}`,
      );
    }

    const workflowResponse =
      await response.json();

    const recommendation =
      workflowResponse.recommendation ??
      workflowResponse.message ??
      "Kaira Guard protection workflow activated.";

    // -------------------------
    // SAVE PROTECTION EVENT
    // -------------------------

    const { error: guardEventError } =
      await supabaseServer
        .from("guard_events")
        .insert({
          account_id: accountId,

          purchase_name:
            body.purchaseName ||
            "Planned purchase",

          purchase_amount:
            body.purchaseAmount,

          risk_level:
            body.riskLevel,

          safe_to_spend_after:
            body.safeToSpendAfter,

          upcoming_expenses:
            body.upcomingExpenses,

          recommendation,

          status: "protected",
        });

    if (guardEventError) {
      console.error(
        "Unable to save guard event:",
        guardEventError.message,
      );
    }

    return NextResponse.json({
      success: true,

      mode: "n8n",

      workflow:
        workflowResponse,

      message:
        workflowResponse.message ??
        "Kaira Guard protection workflow activated.",
    });
  } catch (error) {
    console.error(
      "Kaira Guard error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Kaira Guard could not be activated.",
      },
      {
        status: 500,
      },
    );
  }
}