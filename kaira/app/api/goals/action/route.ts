import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

type GoalAction =
  | "add"
  | "release"
  | "move";

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

    const goalId =
      String(
        body.goalId ?? "",
      );

    const action =
      String(
        body.action ?? "",
      ) as GoalAction;

    const amount =
      Number(
        body.amount,
      );

    if (
      !goalId ||
      ![
        "add",
        "release",
        "move",
      ].includes(
        action,
      ) ||
      !Number.isFinite(
        amount,
      ) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid goal action.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: sourceGoal,
      error:
        sourceError,
    } =
      await supabaseServer
        .from(
          "savings_goals",
        )
        .select(`
          id,
          target_amount,
          saved_amount
        `)
        .eq(
          "id",
          goalId,
        )
        .eq(
          "account_id",
          accountId,
        )
        .single();

    if (
      sourceError ||
      !sourceGoal
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Goal not found.",
        },
        {
          status: 404,
        },
      );
    }

    const sourceSaved =
      Number(
        sourceGoal.saved_amount,
      );

    const sourceTarget =
      Number(
        sourceGoal.target_amount,
      );

    /*
     * ADD MONEY
     *
     * Money already exists in account balance.
     * We are simply reserving more of it.
     */
    if (
      action ===
      "add"
    ) {
      const nextSaved =
        sourceSaved +
        amount;

      if (
        nextSaved >
        sourceTarget
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "That would exceed the goal target.",
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
            "savings_goals",
          )
          .update({
            saved_amount:
              nextSaved,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            goalId,
          )
          .eq(
            "account_id",
            accountId,
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        action: "add",
      });
    }

    /*
     * RELEASE MONEY
     *
     * Reserved goal money becomes
     * available to spend again.
     */
    if (
      action ===
      "release"
    ) {
      if (
        amount >
        sourceSaved
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "You cannot release more than you have saved.",
          },
          {
            status: 400,
          },
        );
      }

      const nextSaved =
        sourceSaved -
        amount;

      const {
        error,
      } =
        await supabaseServer
          .from(
            "savings_goals",
          )
          .update({
            saved_amount:
              nextSaved,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            goalId,
          )
          .eq(
            "account_id",
            accountId,
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        action:
          "release",
      });
    }

    /*
     * MOVE MONEY
     */
    const toGoalId =
      String(
        body.toGoalId ??
          "",
      );

    if (
      !toGoalId ||
      toGoalId ===
        goalId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Choose another goal.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      amount >
      sourceSaved
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You cannot move more than you have saved.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data:
        destinationGoal,

      error:
        destinationError,
    } =
      await supabaseServer
        .from(
          "savings_goals",
        )
        .select(`
          id,
          target_amount,
          saved_amount
        `)
        .eq(
          "id",
          toGoalId,
        )
        .eq(
          "account_id",
          accountId,
        )
        .single();

    if (
      destinationError ||
      !destinationGoal
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Destination goal not found.",
        },
        {
          status: 404,
        },
      );
    }

    const destinationSaved =
      Number(
        destinationGoal.saved_amount,
      );

    const destinationTarget =
      Number(
        destinationGoal.target_amount,
      );

    if (
      destinationSaved +
        amount >
      destinationTarget
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "That transfer would exceed the destination target.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Update source.
     */
    const {
      error:
        subtractError,
    } =
      await supabaseServer
        .from(
          "savings_goals",
        )
        .update({
          saved_amount:
            sourceSaved -
            amount,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          goalId,
        )
        .eq(
          "account_id",
          accountId,
        );

    if (
      subtractError
    ) {
      throw subtractError;
    }

    /*
     * Update destination.
     */
    const {
      error:
        addError,
    } =
      await supabaseServer
        .from(
          "savings_goals",
        )
        .update({
          saved_amount:
            destinationSaved +
            amount,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          toGoalId,
        )
        .eq(
          "account_id",
          accountId,
        );

    if (addError) {
      /*
       * Best-effort rollback.
       */
      await supabaseServer
        .from(
          "savings_goals",
        )
        .update({
          saved_amount:
            sourceSaved,
        })
        .eq(
          "id",
          goalId,
        )
        .eq(
          "account_id",
          accountId,
        );

      throw addError;
    }

    return NextResponse.json({
      success: true,
      action: "move",
    });
  } catch (error) {
    console.error(
      "Savings goal action error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update savings goal.",
      },
      {
        status: 500,
      },
    );
  }
}