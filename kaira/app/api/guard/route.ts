import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

import {
  verifyPurchaseWithMidnight,
} from "@/lib/midnight/private-guard";

import {
  getAccount,
} from "@/lib/data/accounts";

import {
  getTransactions,
} from "@/lib/data/transactions";

import {
  getSavingsGoals,
} from "@/lib/data/savings-goals";

import {
  detectRecurringPayments,
} from "@/lib/engines/recurring-engine";

import {
  forecastUpcomingCharges,
} from "@/lib/engines/forecast-engine";

import {
  simulatePurchase,
} from "@/lib/engines/collision-engine";

interface GuardRequest {
  purchaseName: string;
  purchaseAmount: number;
}

export async function POST(
  request: Request,
) {
  try {
    const body: GuardRequest =
      await request.json();

    if (
      typeof body.purchaseAmount !==
        "number" ||
      !Number.isFinite(
        body.purchaseAmount,
      ) ||
      body.purchaseAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid simulation request.",
        },
        {
          status: 400,
        },
      );
    }

    const purchaseName =
      typeof body.purchaseName ===
        "string" &&
      body.purchaseName.trim()
        ? body.purchaseName.trim()
        : "Planned purchase";

    const accountId =
      process.env
        .DEMO_ACCOUNT_ID;

    if (!accountId) {
      throw new Error(
        "DEMO_ACCOUNT_ID is missing.",
      );
    }

    // --------------------------------
    // AUTHORITATIVE KAIRA DATA
    // --------------------------------

    const [
      account,
      transactions,
      savingsGoals,
    ] = await Promise.all([
      getAccount(
        accountId,
      ),

      getTransactions(
        accountId,
      ),

      getSavingsGoals(
        accountId,
      ),
    ]);

    const recurringPayments =
      detectRecurringPayments(
        transactions,
      );

    const referenceDate =
      process.env
        .DEMO_REFERENCE_DATE ??
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        );

    const upcomingCharges =
      forecastUpcomingCharges({
        recurringPayments,

        fromDate:
          referenceDate,

        days: 30,
      });

    const reservedSavings =
      savingsGoals.reduce(
        (
          total,
          goal,
        ) =>
          total +
          goal.savedAmount,
        0,
      );

    const planningBalance =
      account.balance -
      reservedSavings;

    // --------------------------------
    // SERVER-SIDE ASSESSMENT
    // --------------------------------

    const simulation =
      simulatePurchase({
        currentBalance:
          planningBalance,

        purchaseAmount:
          body.purchaseAmount,

        upcomingCharges,

        safetyBuffer:
          account.safetyBuffer,
      });

    const assessment = {
      riskLevel:
        simulation.riskLevel,

      safeToSpendBefore:
        simulation.safeToSpendBefore,

      safeToSpendAfter:
        simulation.safeToSpendAfter,

      upcomingExpenses:
        simulation.upcomingExpenses,

      message:
        simulation.message,
    };

    console.log(
      "Authoritative Kaira assessment:",
      {
        purchaseName,
        purchaseAmount:
          body.purchaseAmount,

        ...assessment,
      },
    );

    // --------------------------------
    // MIDNIGHT PRIVATE VERIFICATION
    // --------------------------------

    const midnightVerification =
      await verifyPurchaseWithMidnight(
        accountId,
        body.purchaseAmount,
      );

    console.log(
      "Midnight Private Guard verification:",
      midnightVerification,
    );

    // --------------------------------
    // SAFE / WARNING
    // --------------------------------
    //
    // This was only a private
    // simulation.
    //
    // No Guard event is created.
    // n8n is not triggered.
    // Nothing is inserted into
    // guard_events.
    // --------------------------------

    if (
      simulation.riskLevel !==
      "danger"
    ) {
      return NextResponse.json({
        success: true,

        mode: "simulation",

        assessment,

        midnight: {
          verified:
            midnightVerification
              .verified,

          transactionId:
            midnightVerification
              .transactionId,

          blockHeight:
            midnightVerification
              .blockHeight,
        },

        message:
          simulation.message,
      });
    }

    // --------------------------------
    // HIGH RISK
    // --------------------------------
    //
    // Only NOW do we activate Guard.
    // --------------------------------

    const event = {
      source:
        "kaira",

      event:
        "financial_risk_detected",

      timestamp:
        new Date()
          .toISOString(),

      data: {
        purchaseName,

        purchaseAmount:
          body.purchaseAmount,

        riskLevel:
          simulation.riskLevel,

        safeToSpendAfter:
          simulation.safeToSpendAfter,

        upcomingExpenses:
          simulation.upcomingExpenses,

        midnightVerified:
          midnightVerification
            .verified,

        midnightTransactionId:
          midnightVerification
            .transactionId,

        midnightBlockHeight:
          midnightVerification
            .blockHeight,
      },
    };

    const webhookUrl =
      process.env
        .N8N_GUARD_WEBHOOK_URL;

    // --------------------------------
    // HIGH RISK DEMO MODE
    // --------------------------------

    if (!webhookUrl) {
      const recommendation =
        "Delay this purchase until your upcoming commitments are covered.";

      const {
        data:
          savedGuardEvent,
        error:
          guardEventError,
      } =
        await supabaseServer
          .from(
            "guard_events",
          )
          .insert({
            account_id:
              accountId,

            purchase_name:
              purchaseName,

            purchase_amount:
              body.purchaseAmount,

            risk_level:
              simulation.riskLevel,

            safe_to_spend_after:
              simulation.safeToSpendAfter,

            upcoming_expenses:
              simulation.upcomingExpenses,

            midnight_verified:
              midnightVerification
                .verified,

            midnight_transaction_id:
              midnightVerification
                .transactionId,

            midnight_block_height:
              midnightVerification
                .blockHeight,

            recommendation,

            status:
              "protected",
          })
          .select()
          .single();

      if (
        guardEventError
      ) {
        console.error(
          "Unable to save demo guard event:",
          guardEventError,
        );

        throw guardEventError;
      }

      console.log(
        "High-risk Guard event saved:",
        savedGuardEvent,
      );

      return NextResponse.json({
        success: true,

        mode:
          "guard-demo",

        assessment,

        midnight: {
          verified:
            midnightVerification
              .verified,

          transactionId:
            midnightVerification
              .transactionId,

          blockHeight:
            midnightVerification
              .blockHeight,
        },

        message:
          recommendation,
      });
    }

    // --------------------------------
    // HIGH RISK N8N AUTOMATION
    // --------------------------------

    const response =
      await fetch(
        webhookUrl,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              event,
            ),
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
      workflowResponse
        .recommendation ??
      workflowResponse
        .message ??
      "Delay this purchase until your upcoming commitments are covered.";

    // --------------------------------
    // SAVE HIGH-RISK GUARD EVENT
    // --------------------------------

    const guardEventRecord = {
      account_id:
        accountId,

      purchase_name:
        purchaseName,

      purchase_amount:
        body.purchaseAmount,

      risk_level:
        simulation.riskLevel,

      safe_to_spend_after:
        simulation.safeToSpendAfter,

      upcoming_expenses:
        simulation.upcomingExpenses,

      midnight_verified:
        midnightVerification
          .verified,

      midnight_transaction_id:
        midnightVerification
          .transactionId,

      midnight_block_height:
        midnightVerification
          .blockHeight,

      recommendation,

      status:
        "protected",
    };

    console.log(
      "Saving high-risk Guard event:",
      guardEventRecord,
    );

    const {
      data:
        savedGuardEvent,
      error:
        guardEventError,
    } =
      await supabaseServer
        .from(
          "guard_events",
        )
        .insert(
          guardEventRecord,
        )
        .select()
        .single();

    if (
      guardEventError
    ) {
      console.error(
        "Unable to save Guard event:",
        guardEventError,
      );

      throw guardEventError;
    }

    console.log(
      "High-risk Guard event saved:",
      savedGuardEvent,
    );

    return NextResponse.json({
      success: true,

      mode:
        "guard",

      assessment,

      midnight: {
        verified:
          midnightVerification
            .verified,

        transactionId:
          midnightVerification
            .transactionId,

        blockHeight:
          midnightVerification
            .blockHeight,
      },

      workflow:
        workflowResponse,

      message:
        recommendation,
    });
  } catch (error) {
    console.error(
      "Private simulation error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Kaira could not complete the private simulation.",
      },
      {
        status: 500,
      },
    );
  }
}