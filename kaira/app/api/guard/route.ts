import { NextResponse } from "next/server";

interface GuardRequest {
  purchaseName: string;
  purchaseAmount: number;
  riskLevel: "safe" | "warning" | "danger";
  safeToSpendAfter: number;
  upcomingExpenses: number;
}

export async function POST(request: Request) {
  try {
    const body: GuardRequest = await request.json();

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

    const event = {
      source: "kaira",
      event: "financial_risk_detected",
      timestamp: new Date().toISOString(),

      data: {
        purchaseName:
          body.purchaseName || "Planned purchase",

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

    // Demo mode until n8n is connected
    if (!webhookUrl) {
      console.log(
        "Kaira Guard event:",
        event,
      );

      return NextResponse.json({
        success: true,
        mode: "demo",
        message:
          "Kaira Guard activated in demo mode.",
      });
    }

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
      throw new Error(
        "n8n webhook request failed.",
      );
    }

    return NextResponse.json({
      success: true,
      mode: "n8n",
      message:
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