import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

import {
  getSavingsGoalSnapshot,
} from "@/lib/data/savings-goals";

const allowedIcons =
  new Set([
    "shield",
    "plane",
    "laptop",
    "education",
    "house",
    "car",
    "gift",
    "piggy-bank",
    "target",
  ]);

export async function POST(
  request: Request,
) {
  try {
    const accountId =
      process.env
        .DEMO_ACCOUNT_ID;

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "DEMO_ACCOUNT_ID is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      await request.json();

    const name =
      String(
        body.name ?? "",
      ).trim();

    const targetAmount =
      Number(
        body.targetAmount,
      );

    const savedAmount =
      Number(
        body.savedAmount ?? 0,
      );

    const requestedIcon =
      String(
        body.icon ??
          "target",
      );

    const icon =
      allowedIcons.has(
        requestedIcon,
      )
        ? requestedIcon
        : "target";

    if (
      !name ||
      !Number.isFinite(
        targetAmount,
      ) ||
      targetAmount <= 0 ||
      !Number.isFinite(
        savedAmount,
      ) ||
      savedAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid goal.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      savedAmount >
      targetAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Saved amount cannot exceed the target.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Important:
     * Available to save already considers:
     *
     * balance
     * - existing goals
     * - upcoming commitments
     * - safety buffer
     */
    const snapshot =
      await getSavingsGoalSnapshot(
        accountId,
      );

    if (
      savedAmount >
      snapshot.availableToSave
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `You only have ${snapshot.availableToSave.toLocaleString(
              "en-US",
              {
                style:
                  "currency",
                currency:
                  "MXN",
                maximumFractionDigits: 0,
              },
            )} available to save.`,
        },
        {
          status: 400,
        },
      );
    }

    const {
      data,
      error,
    } =
      await supabaseServer
        .from(
          "savings_goals",
        )
        .insert({
          account_id:
            accountId,

          name,

          target_amount:
            targetAmount,

          saved_amount:
            savedAmount,

          icon,
        })
        .select(`
          id,
          name,
          target_amount,
          saved_amount,
          icon
        `)
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,

      goal: {
        id:
          data.id,

        name:
          data.name,

        targetAmount:
          Number(
            data.target_amount,
          ),

        savedAmount:
          Number(
            data.saved_amount,
          ),

        icon:
          data.icon,
      },
    });
  } catch (error) {
    console.error(
      "Create goal error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create goal.",
      },
      {
        status: 500,
      },
    );
  }
}