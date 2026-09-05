import {
  NextResponse,
} from "next/server";

import {
  supabaseServer,
} from "@/lib/supabase/server";

import {
  verifyPrivateFinancialIdentity,
  type PrivateIdentityInput,
} from "@/lib/midnight/private-identity";

type ProfileType =
  | "own-income"
  | "dependent"
  | "minor";

function envFlag(
  name: string,
  fallback = true,
) {
  const value =
    process.env[name];

  if (
    value === undefined
  ) {
    return fallback;
  }

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(
    value
      .trim()
      .toLowerCase(),
  );
}

/*
 * Demo credentials supplied by
 * a trusted SERVER-SIDE source.
 *
 * In production these could come
 * from a bank, government authority,
 * signed credential provider, etc.
 *
 * The browser cannot change them.
 */
function getTrustedCredentials() {
  return {
    ownIncome: {
      incomeSourceVerified:
        envFlag(
          "DEMO_IDENTITY_INCOME_SOURCE_VERIFIED",
        ),

      taxCompliant:
        envFlag(
          "DEMO_IDENTITY_TAX_COMPLIANT",
        ),
    },

    dependent: {
      supporterVerified:
        envFlag(
          "DEMO_IDENTITY_SUPPORTER_VERIFIED",
        ),

      relationshipVerified:
        envFlag(
          "DEMO_IDENTITY_RELATIONSHIP_VERIFIED",
        ),

      supporterTaxCompliant:
        envFlag(
          "DEMO_IDENTITY_SUPPORTER_TAX_COMPLIANT",
        ),
    },

    minor: {
      guardianVerified:
        envFlag(
          "DEMO_IDENTITY_GUARDIAN_VERIFIED",
        ),

      relationshipVerified:
        envFlag(
          "DEMO_IDENTITY_GUARDIAN_RELATIONSHIP_VERIFIED",
        ),

      guardianTaxCompliant:
        envFlag(
          "DEMO_IDENTITY_GUARDIAN_TAX_COMPLIANT",
        ),
    },
  };
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const profileType =
      body.profileType as
        ProfileType;

    if (
      profileType !==
        "own-income" &&
      profileType !==
        "dependent" &&
      profileType !==
        "minor"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid financial profile type.",
        },
        {
          status: 400,
        },
      );
    }

    const age =
      Number(
        body.age,
      );

    const minimumRequiredIncome =
      Number(
        process.env
          .DEMO_IDENTITY_MIN_MONTHLY_INCOME ??
          "20000",
      );

    if (
      !Number.isFinite(
        minimumRequiredIncome,
      ) ||
      minimumRequiredIncome < 0
    ) {
      throw new Error(
        "Invalid server identity policy.",
      );
    }

    if (
      !Number.isInteger(
        age,
      ) ||
      age < 0 ||
      age > 255 ||
      !Number.isFinite(
        minimumRequiredIncome,
      ) ||
      minimumRequiredIncome < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid identity verification request.",
        },
        {
          status: 400,
        },
      );
    }

    const accountId =
      process.env
        .DEMO_ACCOUNT_ID;

    if (!accountId) {
      throw new Error(
        "DEMO_ACCOUNT_ID is missing.",
      );
    }

    const credentials =
      getTrustedCredentials();

    let input:
      PrivateIdentityInput;

    let credentialsChecked:
      string[];

    // --------------------------------
    // OWN INCOME
    // --------------------------------

    if (
      profileType ===
      "own-income"
    ) {
      const monthlyIncome =
        Number(
          body.monthlyIncome,
        );

      if (
        !Number.isFinite(
          monthlyIncome,
        ) ||
        monthlyIncome < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid monthly income.",
          },
          {
            status: 400,
          },
        );
      }

      input = {
        profileType:
          "own-income",

        age,

        monthlyIncome,

        minimumRequiredIncome,

        incomeSourceVerified:
          credentials
            .ownIncome
            .incomeSourceVerified,

        taxCompliant:
          credentials
            .ownIncome
            .taxCompliant,
      };

      credentialsChecked = [
        "Income source credential",
        "Compliance credential",
      ];
    }

    // --------------------------------
    // DEPENDENT ADULT
    // --------------------------------

    else if (
      profileType ===
      "dependent"
    ) {
      const supporterMonthlyIncome =
        Number(
          body.supporterMonthlyIncome,
        );

      if (
        !Number.isFinite(
          supporterMonthlyIncome,
        ) ||
        supporterMonthlyIncome <
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid supporter income.",
          },
          {
            status: 400,
          },
        );
      }

      input = {
        profileType:
          "dependent",

        age,

        supporterMonthlyIncome,

        minimumRequiredIncome,

        supporterVerified:
          credentials
            .dependent
            .supporterVerified,

        relationshipVerified:
          credentials
            .dependent
            .relationshipVerified,

        supporterTaxCompliant:
          credentials
            .dependent
            .supporterTaxCompliant,
      };

      credentialsChecked = [
        "Supporter credential",
        "Relationship credential",
        "Supporter compliance credential",
      ];
    }

    // --------------------------------
    // MINOR + GUARDIAN
    // --------------------------------

    else {
      const guardianMonthlyIncome =
        Number(
          body.guardianMonthlyIncome,
        );

      if (
        !Number.isFinite(
          guardianMonthlyIncome,
        ) ||
        guardianMonthlyIncome <
          0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid guardian income.",
          },
          {
            status: 400,
          },
        );
      }

      input = {
        profileType:
          "minor",

        age,

        guardianMonthlyIncome,

        minimumRequiredIncome,

        guardianVerified:
          credentials
            .minor
            .guardianVerified,

        relationshipVerified:
          credentials
            .minor
            .relationshipVerified,

        guardianTaxCompliant:
          credentials
            .minor
            .guardianTaxCompliant,
      };

      credentialsChecked = [
        "Guardian credential",
        "Guardian relationship credential",
        "Guardian compliance credential",
      ];
    }

    // --------------------------------
    // MIDNIGHT ZK VERIFICATION
    // --------------------------------

    const verification =
      await verifyPrivateFinancialIdentity(
        input,
      );

    /*
     * Store ONLY proof metadata.
     *
     * We intentionally do not
     * persist:
     *
     * - age
     * - income
     * - supporter income
     * - guardian income
     * - minimum requirement
     */
    const now =
      new Date()
        .toISOString();

    const {
      data:
        savedIdentity,
      error:
        identitySaveError,
    } =
      await supabaseServer
        .from(
          "financial_identity_profiles",
        )
        .upsert(
          {
            account_id:
              accountId,

            profile_type:
              verification.profileType,

            midnight_verified:
              verification.verified,

            midnight_transaction_id:
              verification.transactionId,

            midnight_block_height:
              verification.blockHeight,

            verified_at:
              now,

            updated_at:
              now,
          },
          {
            onConflict:
              "account_id",
          },
        )
        .select()
        .single();

    if (
      identitySaveError
    ) {
      console.error(
        "Unable to save private identity proof:",
        identitySaveError,
      );

      throw identitySaveError;
    }

    console.log(
      "Private identity proof saved:",
      {
        profileType:
          savedIdentity
            .profile_type,

        verified:
          savedIdentity
            .midnight_verified,

        blockHeight:
          savedIdentity
            .midnight_block_height,

        transactionId:
          savedIdentity
            .midnight_transaction_id,
      },
    );

    // --------------------------------
    // SAFE RESPONSE
    // --------------------------------

    return NextResponse.json({
      success: true,

      verification: {
        profileType:
          verification.profileType,

        verified:
          verification.verified,

        transactionId:
          verification.transactionId,

        blockHeight:
          verification.blockHeight,
      },

      credentialAttestation: {
        source:
          "kaira-demo-trusted-source",

        credentialsChecked,
      },

      privacy: {
        rawFinancialValuesPersisted:
          false,

        rawFinancialValuesReturned:
          false,

        rawFinancialValuesDisclosedOnChain:
          false,
      },
    });
  } catch (error) {
    console.error(
      "Private identity verification error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Kaira could not verify the private financial identity.",
      },
      {
        status: 500,
      },
    );
  }
}