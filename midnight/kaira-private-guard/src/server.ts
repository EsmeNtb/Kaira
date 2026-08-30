import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  createServer,
  type IncomingMessage,
} from 'node:http';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';
import { WebSocket } from 'ws';

import {
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';

import {
  httpClientProofProvider,
} from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

import {
  indexerPublicDataProvider,
} from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

import {
  levelPrivateStateProvider,
} from '@midnight-ntwrk/midnight-js-level-private-state-provider';

import {
  NodeZkConfigProvider,
} from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

import {
  CompiledContract,
} from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import {
  resolveNetwork,
  getOrCreateWallet,
  getDeployment,
} from './network';

import {
  createWallet,
  persistWalletState,
  type WalletContext,
} from './wallet';

// @ts-expect-error Required by Midnight wallet sync
globalThis.WebSocket = WebSocket;

// Keep this until we do naming cleanup.
const PRIVATE_STATE_ID =
  'helloWorldPrivateState';

const PORT =
  Number(
    process.env.MIDNIGHT_GUARD_PORT,
  ) || 8787;

const UINT64_MAX =
  BigInt(
    '18446744073709551615',
  );

const UINT8_MAX =
  BigInt('255');

const {
  network,
  config: networkConfig,
} = resolveNetwork();

const WALLET =
  getOrCreateWallet(
    network,
  );

const __dirname =
  path.dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const zkConfigPath =
  path.resolve(
    __dirname,
    '..',
    'contracts',
    'managed',
    'kaira-private-guard',
  );

const contractPath =
  path.join(
    zkConfigPath,
    'contract',
    'index.js',
  );

if (
  !fs.existsSync(
    contractPath,
  )
) {
  throw new Error(
    'Contract not compiled. Run `npm run compile`.',
  );
}

const KairaPrivateGuard =
  await import(
    pathToFileURL(
      contractPath,
    ).href
  );

const compiledContract =
  CompiledContract
    .make(
      'kaira-private-guard',
      KairaPrivateGuard.Contract,
    )
    .pipe(
      CompiledContract
        .withVacantWitnesses,

      CompiledContract
        .withCompiledFileAssets(
          zkConfigPath,
        ),
    );

// --------------------------------------
// PURCHASE VERIFICATION REQUEST
// --------------------------------------

interface VerifyPurchaseRequest {
  currentBalance: string;
  upcomingCommitments: string;
  reservedSavings: string;
  safetyBuffer: string;
  purchaseAmount: string;
}

// --------------------------------------
// PRIVATE IDENTITY REQUEST
// --------------------------------------

type IdentityProfileType =
  | 'own-income'
  | 'dependent'
  | 'minor';

interface VerifyIdentityRequest {
  profileType:
    IdentityProfileType;

  age: string;

  minimumRequiredIncome:
    string;

  // Own income
  monthlyIncome?: string;
  incomeSourceVerified?: boolean;
  taxCompliant?: boolean;

  // Dependent adult
  supporterMonthlyIncome?: string;
  supporterVerified?: boolean;
  relationshipVerified?: boolean;
  supporterTaxCompliant?: boolean;

  // Minor
  guardianMonthlyIncome?: string;
  guardianVerified?: boolean;
  guardianTaxCompliant?: boolean;
}

// --------------------------------------
// VALIDATION
// --------------------------------------

function parseUint64(
  value: unknown,
  name: string,
): bigint {
  if (
    typeof value !==
      'string' ||
    !/^\d+$/.test(
      value,
    )
  ) {
    throw new Error(
      `${name} must be a non-negative integer string.`,
    );
  }

  const parsed =
    BigInt(
      value,
    );

  if (
    parsed >
    UINT64_MAX
  ) {
    throw new Error(
      `${name} exceeds Uint<64>.`,
    );
  }

  return parsed;
}

function parseUint8(
  value: unknown,
  name: string,
): bigint {
  if (
    typeof value !==
      'string' ||
    !/^\d+$/.test(
      value,
    )
  ) {
    throw new Error(
      `${name} must be a non-negative integer string.`,
    );
  }

  const parsed =
    BigInt(
      value,
    );

  if (
    parsed >
    UINT8_MAX
  ) {
    throw new Error(
      `${name} exceeds Uint<8>.`,
    );
  }

  return parsed;
}

function parseBoolean(
  value: unknown,
  name: string,
): boolean {
  if (
    typeof value !==
    'boolean'
  ) {
    throw new Error(
      `${name} must be a boolean.`,
    );
  }

  return value;
}

// --------------------------------------
// MIDNIGHT PROVIDERS
// --------------------------------------

async function createProviders(
  walletCtx:
    WalletContext,
) {
  const privateStatePassword =
    process.env
      .PRIVATE_STATE_PASSWORD
      ?.trim() ||
    'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey:
      () =>
        walletCtx
          .shieldedSecretKeys
          .coinPublicKey,

    getEncryptionPublicKey:
      () =>
        walletCtx
          .shieldedSecretKeys
          .encryptionPublicKey,

    async balanceTx(
      tx: any,
      ttl?: Date,
    ) {
      const recipe =
        await walletCtx
          .wallet
          .balanceUnboundTransaction(
            tx,
            {
              shieldedSecretKeys:
                walletCtx
                  .shieldedSecretKeys,

              dustSecretKey:
                walletCtx
                  .dustSecretKey,
            },
            {
              ttl:
                ttl ??
                new Date(
                  Date.now() +
                    30 *
                      60 *
                      1000,
                ),
            },
          );

      return walletCtx
        .wallet
        .finalizeRecipe(
          recipe,
        );
    },

    submitTx:
      (tx: any) =>
        walletCtx
          .wallet
          .submitTransaction(
            tx,
          ) as any,
  };

  const zkConfigProvider =
    new NodeZkConfigProvider(
      zkConfigPath,
    );

  const accountId =
    walletCtx
      .unshieldedKeystore
      .getBech32Address()
      .toString();

  return {
    privateStateProvider:
      levelPrivateStateProvider({
        privateStateStoreName:
          'kaira-private-guard-state',

        accountId,

        privateStoragePasswordProvider:
          () =>
            privateStatePassword,
      }),

    publicDataProvider:
      indexerPublicDataProvider(
        networkConfig.indexer,
        networkConfig.indexerWS,
      ),

    zkConfigProvider,

    proofProvider:
      httpClientProofProvider(
        networkConfig.proofServer,
        zkConfigProvider,
      ),

    walletProvider,

    midnightProvider:
      walletProvider,
  };
}

// --------------------------------------
// HTTP HELPERS
// --------------------------------------

async function readJsonBody(
  request:
    IncomingMessage,
): Promise<unknown> {
  const chunks:
    Buffer[] = [];

  for await (
    const chunk
    of request
  ) {
    chunks.push(
      Buffer.isBuffer(
        chunk,
      )
        ? chunk
        : Buffer.from(
            chunk,
          ),
    );
  }

  const text =
    Buffer.concat(
      chunks,
    ).toString(
      'utf8',
    );

  if (!text) {
    throw new Error(
      'Request body is empty.',
    );
  }

  return JSON.parse(
    text,
  );
}

function sendJson(
  response: any,
  statusCode: number,
  body: unknown,
) {
  response.statusCode =
    statusCode;

  response.end(
    JSON.stringify(
      body,
    ),
  );
}

// --------------------------------------
// MAIN
// --------------------------------------

async function main() {
  console.log('');
  console.log(
    '╔══════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║          Kaira Midnight Private Verification Bridge         ║',
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝',
  );
  console.log('');

  const deployment =
    getDeployment(
      network,
    );

  if (!deployment) {
    throw new Error(
      `No deployment found for network ${network}.`,
    );
  }

  console.log(
    `  Contract: ${deployment.address}`,
  );

  console.log(
    `  Network:  ${network}`,
  );

  console.log(
    '  Connecting wallet...',
  );

  const walletCtx =
    await createWallet({
      network,
      networkConfig,
      seed:
        WALLET.seed,
    });

  console.log(
    '  Syncing wallet...',
  );

  await walletCtx
    .wallet
    .waitForSyncedState();

  await persistWalletState(
    network,
    walletCtx,
  );

  console.log(
    '  ✓ Wallet synced',
  );

  const providers =
    await createProviders(
      walletCtx,
    );

  console.log(
    '  Connecting contract...',
  );

  const deployed: any =
    await findDeployedContract(
      providers,
      {
        compiledContract:
          compiledContract as any,

        contractAddress:
          deployment.address,

        privateStateId:
          PRIVATE_STATE_ID,

        initialPrivateState:
          {},
      },
    );

  console.log(
    '  ✓ Contract connected',
  );

  const server =
    createServer(
      async (
        request,
        response,
      ) => {
        response.setHeader(
          'Content-Type',
          'application/json',
        );

        // ----------------------------------
        // HEALTH
        // ----------------------------------

        if (
          request.method ===
            'GET' &&
          request.url ===
            '/health'
        ) {
          sendJson(
            response,
            200,
            {
              ok: true,

              network,

              contractAddress:
                deployment.address,

              capabilities: [
                'verify-purchase',
                'verify-own-income',
                'verify-dependent',
                'verify-minor',
              ],
            },
          );

          return;
        }

        // ----------------------------------
        // PURCHASE VERIFICATION
        // ----------------------------------

        if (
          request.method ===
            'POST' &&
          request.url ===
            '/verify'
        ) {
          try {
            const body =
              await readJsonBody(
                request,
              ) as VerifyPurchaseRequest;

            const currentBalance =
              parseUint64(
                body.currentBalance,
                'currentBalance',
              );

            const upcomingCommitments =
              parseUint64(
                body.upcomingCommitments,
                'upcomingCommitments',
              );

            const reservedSavings =
              parseUint64(
                body.reservedSavings,
                'reservedSavings',
              );

            const safetyBuffer =
              parseUint64(
                body.safetyBuffer,
                'safetyBuffer',
              );

            const purchaseAmount =
              parseUint64(
                body.purchaseAmount,
                'purchaseAmount',
              );

            console.log('');
            console.log(
              '  🌙 Purchase verification requested',
            );

            const tx =
              await deployed
                .callTx
                .verifyPurchase(
                  currentBalance,
                  upcomingCommitments,
                  reservedSavings,
                  safetyBuffer,
                  purchaseAmount,
                );

            const verified =
              currentBalance >=
              (
                upcomingCommitments +
                reservedSavings +
                safetyBuffer +
                purchaseAmount
              );

            await persistWalletState(
              network,
              walletCtx,
            );

            console.log(
              `  ✓ Purchase verification: ${verified}`,
            );

            console.log(
              `  ✓ Transaction: ${tx.public.txId}`,
            );

            sendJson(
              response,
              200,
              {
                verified,

                transactionId:
                  tx.public.txId,

                blockHeight:
                  Number(
                    tx.public
                      .blockHeight,
                  ),
              },
            );
          } catch (
            error
          ) {
            console.error(
              '  ❌ Purchase verification error:',
              error,
            );

            sendJson(
              response,
              500,
              {
                error:
                  error instanceof
                    Error
                    ? error.message
                    : 'Unknown Midnight error.',
              },
            );
          }

          return;
        }

        // ----------------------------------
        // PRIVATE FINANCIAL IDENTITY
        // ----------------------------------

        if (
          request.method ===
            'POST' &&
          request.url ===
            '/verify-identity'
        ) {
          try {
            const body =
              await readJsonBody(
                request,
              ) as VerifyIdentityRequest;

            const age =
              parseUint8(
                body.age,
                'age',
              );

            const minimumRequiredIncome =
              parseUint64(
                body.minimumRequiredIncome,
                'minimumRequiredIncome',
              );

            console.log('');
            console.log(
              `  🔐 Private identity verification requested: ${body.profileType}`,
            );

            // ------------------------------
            // OWN INCOME
            // ------------------------------

            if (
              body.profileType ===
              'own-income'
            ) {
              const monthlyIncome =
                parseUint64(
                  body.monthlyIncome,
                  'monthlyIncome',
                );

              const incomeSourceVerified =
                parseBoolean(
                  body.incomeSourceVerified,
                  'incomeSourceVerified',
                );

              const taxCompliant =
                parseBoolean(
                  body.taxCompliant,
                  'taxCompliant',
                );

              const tx =
                await deployed
                  .callTx
                  .verifyOwnIncomeIdentity(
                    age,
                    monthlyIncome,
                    minimumRequiredIncome,
                    incomeSourceVerified,
                    taxCompliant,
                  );

              const verified =
                age >=
                  BigInt(18) &&
                monthlyIncome >=
                  minimumRequiredIncome &&
                incomeSourceVerified &&
                taxCompliant;

              await persistWalletState(
                network,
                walletCtx,
              );

              console.log(
                `  ✓ Own-income identity: ${verified}`,
              );

              console.log(
                `  ✓ Transaction: ${tx.public.txId}`,
              );

              sendJson(
                response,
                200,
                {
                  profileType:
                    body.profileType,

                  verified,

                  transactionId:
                    tx.public.txId,

                  blockHeight:
                    Number(
                      tx.public
                        .blockHeight,
                    ),
                },
              );

              return;
            }

            // ------------------------------
            // DEPENDENT ADULT
            // ------------------------------

            if (
              body.profileType ===
              'dependent'
            ) {
              const supporterMonthlyIncome =
                parseUint64(
                  body.supporterMonthlyIncome,
                  'supporterMonthlyIncome',
                );

              const supporterVerified =
                parseBoolean(
                  body.supporterVerified,
                  'supporterVerified',
                );

              const relationshipVerified =
                parseBoolean(
                  body.relationshipVerified,
                  'relationshipVerified',
                );

              const supporterTaxCompliant =
                parseBoolean(
                  body.supporterTaxCompliant,
                  'supporterTaxCompliant',
                );

              const tx =
                await deployed
                  .callTx
                  .verifyDependentIdentity(
                    age,
                    supporterMonthlyIncome,
                    minimumRequiredIncome,
                    supporterVerified,
                    relationshipVerified,
                    supporterTaxCompliant,
                  );

              const verified =
                age >=
                  BigInt(18) &&
                supporterMonthlyIncome >=
                  minimumRequiredIncome &&
                supporterVerified &&
                relationshipVerified &&
                supporterTaxCompliant;

              await persistWalletState(
                network,
                walletCtx,
              );

              console.log(
                `  ✓ Dependent identity: ${verified}`,
              );

              console.log(
                `  ✓ Transaction: ${tx.public.txId}`,
              );

              sendJson(
                response,
                200,
                {
                  profileType:
                    body.profileType,

                  verified,

                  transactionId:
                    tx.public.txId,

                  blockHeight:
                    Number(
                      tx.public
                        .blockHeight,
                    ),
                },
              );

              return;
            }

            // ------------------------------
            // MINOR + GUARDIAN
            // ------------------------------

            if (
              body.profileType ===
              'minor'
            ) {
              const guardianMonthlyIncome =
                parseUint64(
                  body.guardianMonthlyIncome,
                  'guardianMonthlyIncome',
                );

              const guardianVerified =
                parseBoolean(
                  body.guardianVerified,
                  'guardianVerified',
                );

              const relationshipVerified =
                parseBoolean(
                  body.relationshipVerified,
                  'relationshipVerified',
                );

              const guardianTaxCompliant =
                parseBoolean(
                  body.guardianTaxCompliant,
                  'guardianTaxCompliant',
                );

              const tx =
                await deployed
                  .callTx
                  .verifyMinorIdentity(
                    age,
                    guardianMonthlyIncome,
                    minimumRequiredIncome,
                    guardianVerified,
                    relationshipVerified,
                    guardianTaxCompliant,
                  );

              const verified =
                age <
                  BigInt(18) &&
                guardianMonthlyIncome >=
                  minimumRequiredIncome &&
                guardianVerified &&
                relationshipVerified &&
                guardianTaxCompliant;

              await persistWalletState(
                network,
                walletCtx,
              );

              console.log(
                `  ✓ Minor identity: ${verified}`,
              );

              console.log(
                `  ✓ Transaction: ${tx.public.txId}`,
              );

              sendJson(
                response,
                200,
                {
                  profileType:
                    body.profileType,

                  verified,

                  transactionId:
                    tx.public.txId,

                  blockHeight:
                    Number(
                      tx.public
                        .blockHeight,
                    ),
                },
              );

              return;
            }

            throw new Error(
              'Invalid profileType. Expected own-income, dependent, or minor.',
            );
          } catch (
            error
          ) {
            console.error(
              '  ❌ Identity verification error:',
              error,
            );

            sendJson(
              response,
              500,
              {
                error:
                  error instanceof
                    Error
                    ? error.message
                    : 'Unknown Midnight identity error.',
              },
            );
          }

          return;
        }

        // ----------------------------------
        // NOT FOUND
        // ----------------------------------

        sendJson(
          response,
          404,
          {
            error:
              'Not found.',
          },
        );
      },
    );

  server.listen(
    PORT,
    '127.0.0.1',
    () => {
      console.log('');
      console.log(
        `  🌙 Bridge listening on http://127.0.0.1:${PORT}`,
      );

      console.log(
        `  Health: http://127.0.0.1:${PORT}/health`,
      );

      console.log(
        `  Purchase: POST http://127.0.0.1:${PORT}/verify`,
      );

      console.log(
        `  Identity: POST http://127.0.0.1:${PORT}/verify-identity`,
      );

      console.log('');
    },
  );

  async function shutdown() {
    console.log(
      '\n  Shutting down Midnight bridge...',
    );

    server.close();

    await persistWalletState(
      network,
      walletCtx,
    );

    await walletCtx
      .wallet
      .stop();

    process.exit(
      0,
    );
  }

  process.on(
    'SIGINT',
    shutdown,
  );

  process.on(
    'SIGTERM',
    shutdown,
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exit(
      1,
    );
  },
);