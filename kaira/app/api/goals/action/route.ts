import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

import {
  getSavingsGoalSnapshot,
} from "@/lib/data/savings-goals";

type GoalAction =
  | "add"
  | "release"
  | "move"
  | "delete";

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

    if (
      !goalId ||
      ![
        "add",
        "release",
        "move",
        "delete",
      ].includes(
        action,
      )
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
          name,
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
     * DELETE
     *
     * Nothing is added to account.balance.
     *
     * The money was always part of the balance.
     * Removing the reservation makes it
     * available again automatically.
     */
    if (
      action ===
      "delete"
    ) {
      const {
        error,
      } =
        await supabaseServer
          .from(
            "savings_goals",
          )
          .delete()
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
          "delete",

        releasedAmount:
          sourceSaved,
      });
    }

    const amount =
      Number(
        body.amount,
      );

    if (
      !Number.isFinite(
        amount,
      ) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid amount.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ADD
     */
    if (
      action ===
      "add"
    ) {
      const snapshot =
        await getSavingsGoalSnapshot(
          accountId,
        );

      if (
        amount >
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

      if (
        sourceSaved +
          amount >
        sourceTarget
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "That amount would exceed the goal target.",
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
              sourceSaved +
              amount,

            updated_at:
              new Date()
                .toISOString(),
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
          "add",
      });
    }

    /*
     * RELEASE
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
              `You only have ${sourceSaved.toLocaleString(
                "en-US",
                {
                  style:
                    "currency",
                  currency:
                    "MXN",
                  maximumFractionDigits: 0,
                },
              )} reserved in this goal.`,
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
              sourceSaved -
              amount,

            updated_at:
              new Date()
                .toISOString(),
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
     * MOVE
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
            `You only have ${sourceSaved.toLocaleString(
              "en-US",
              {
                style:
                  "currency",
                currency:
                  "MXN",
                maximumFractionDigits: 0,
              },
            )} available in this goal.`,
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
            "That amount would exceed the destination goal target.",
        },
        {
          status: 400,
        },
      );
    }

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
            new Date()
              .toISOString(),
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
            new Date()
              .toISOString(),
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
       * Restore source if destination fails.
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
      action:
        "move",
    });
  } catch (error) {
    console.error(
      "Goal action error:",
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