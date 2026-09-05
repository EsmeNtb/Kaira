import "server-only";

export type IdentityProfileType =
  | "own-income"
  | "dependent"
  | "minor";

interface BaseIdentityInput {
  profileType: IdentityProfileType;
  age: number;
  minimumRequiredIncome: number;
}

export interface OwnIncomeIdentityInput
  extends BaseIdentityInput {
  profileType: "own-income";
  monthlyIncome: number;
  incomeSourceVerified: boolean;
  taxCompliant: boolean;
}

export interface DependentIdentityInput
  extends BaseIdentityInput {
  profileType: "dependent";
  supporterMonthlyIncome: number;
  supporterVerified: boolean;
  relationshipVerified: boolean;
  supporterTaxCompliant: boolean;
}

export interface MinorIdentityInput
  extends BaseIdentityInput {
  profileType: "minor";
  guardianMonthlyIncome: number;
  guardianVerified: boolean;
  relationshipVerified: boolean;
  guardianTaxCompliant: boolean;
}

export type PrivateIdentityInput =
  | OwnIncomeIdentityInput
  | DependentIdentityInput
  | MinorIdentityInput;

export interface PrivateIdentityResult {
  profileType: IdentityProfileType;
  verified: boolean;
  transactionId: string;
  blockHeight: number;
}

const UINT64_MAX =
  BigInt(
    "18446744073709551615",
  );

function toMinorUnits(
  amount: number,
  name: string,
): bigint {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      `${name} must be a non-negative number.`,
    );
  }

  const minorUnits =
    Math.round(
      amount * 100,
    );

  if (
    !Number.isSafeInteger(
      minorUnits,
    )
  ) {
    throw new Error(
      `${name} is too large.`,
    );
  }

  const value =
    BigInt(
      minorUnits,
    );

  if (
    value >
    UINT64_MAX
  ) {
    throw new Error(
      `${name} exceeds Uint<64>.`,
    );
  }

  return value;
}

function validateAge(
  age: number,
) {
  if (
    !Number.isInteger(age) ||
    age < 0 ||
    age > 255
  ) {
    throw new Error(
      "Age must be an integer between 0 and 255.",
    );
  }
}

export async function verifyPrivateFinancialIdentity(
  input: PrivateIdentityInput,
): Promise<PrivateIdentityResult> {
  validateAge(
    input.age,
  );

  const bridgeUrl =
    process.env
      .MIDNIGHT_GUARD_URL ??
    "http://127.0.0.1:8787";

  const minimumRequiredIncome =
    toMinorUnits(
      input.minimumRequiredIncome,
      "minimumRequiredIncome",
    );

  let payload:
    Record<string, unknown>;

  if (
    input.profileType ===
    "own-income"
  ) {
    payload = {
      profileType:
        input.profileType,

      age:
        String(
          input.age,
        ),

      monthlyIncome:
        String(
          toMinorUnits(
            input.monthlyIncome,
            "monthlyIncome",
          ),
        ),

      minimumRequiredIncome:
        String(
          minimumRequiredIncome,
        ),

      incomeSourceVerified:
        input.incomeSourceVerified,

      taxCompliant:
        input.taxCompliant,
    };
  } else if (
    input.profileType ===
    "dependent"
  ) {
    payload = {
      profileType:
        input.profileType,

      age:
        String(
          input.age,
        ),

      supporterMonthlyIncome:
        String(
          toMinorUnits(
            input.supporterMonthlyIncome,
            "supporterMonthlyIncome",
          ),
        ),

      minimumRequiredIncome:
        String(
          minimumRequiredIncome,
        ),

      supporterVerified:
        input.supporterVerified,

      relationshipVerified:
        input.relationshipVerified,

      supporterTaxCompliant:
        input.supporterTaxCompliant,
    };
  } else {
    payload = {
      profileType:
        input.profileType,

      age:
        String(
          input.age,
        ),

      guardianMonthlyIncome:
        String(
          toMinorUnits(
            input.guardianMonthlyIncome,
            "guardianMonthlyIncome",
          ),
        ),

      minimumRequiredIncome:
        String(
          minimumRequiredIncome,
        ),

      guardianVerified:
        input.guardianVerified,

      relationshipVerified:
        input.relationshipVerified,

      guardianTaxCompliant:
        input.guardianTaxCompliant,
    };
  }

  const response =
    await fetch(
      `${bridgeUrl}/verify-identity`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload,
          ),

        cache:
          "no-store",
      },
    );

  const result =
    await response
      .json()
      .catch(
        () =>
          null,
      );

  if (
    !response.ok ||
    !result
  ) {
    throw new Error(
      result?.error ??
        "Midnight identity verification failed.",
    );
  }

  return {
    profileType:
      result.profileType,

    verified:
      Boolean(
        result.verified,
      ),

    transactionId:
      String(
        result.transactionId,
      ),

    blockHeight:
      Number(
        result.blockHeight,
      ),
  };
}