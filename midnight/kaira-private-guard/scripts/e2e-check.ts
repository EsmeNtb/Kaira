/**
 * End-to-end transactional check for kaira-private-guard.
 *
 * Reconnects to the deployed contract, reads its ledger state,
 * executes a real verifyPurchase transaction, waits for the indexed
 * state transition, and exits 0 on success.
 *
 * Used by `npm run test:e2e` and by the project's CI workflows.
 */


import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateWallet, formatWalletBackupNotice, getDeployment } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// @ts-expect-error wallet sync requires WebSocket
globalThis.WebSocket = WebSocket;

// Must match the privateStateId used at deploy time (witness-free → empty state).
const PRIVATE_STATE_ID = 'helloWorldPrivateState';

// ─── Network configuration ─────────────────────────────────────────────────────

const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);
const SEED = WALLET.seed;
{
  const notice = formatWalletBackupNotice(WALLET, network);
  if (notice) console.log(notice);
}

function fail(msg: string): never {
  console.error(`❌ e2e-check failed: ${msg}`);
  process.exit(1);
}

function isHexAddress(s: unknown): s is string {
  return typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s) && s.length >= 32;
}

async function main() {
  // 1. Deployment sanity
  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}.`);
    process.exit(1);
  }
  if (!isHexAddress(deployment.address)) {
    fail(`Deployment address missing or invalid: ${JSON.stringify(deployment, null, 2)}`);
  }

  // 2. Build wallet and providers
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'kaira-private-guard');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  if (!fs.existsSync(contractPath)) fail('Compiled contract missing — run `npm run compile`.');
  const HelloWorld = await import(pathToFileURL(contractPath).href);
  const compiledContract = CompiledContract.make('kaira-private-guard', HelloWorld.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  await walletCtx.wallet.waitForSyncedState();
  // Persist the sync state — saves time on the next e2e-check invocation in CI
  // when run against the same persistent wallet directory.
  await persistWalletState(network, walletCtx);

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () =>
      walletCtx.shieldedSecretKeys.encryptionPublicKey,

    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        {
          ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000),
        },
      );

      return walletCtx.wallet.finalizeRecipe(recipe);
    },

    submitTx: (tx: any) =>
      walletCtx.wallet.submitTransaction(tx) as any,
  };

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'kaira-private-guard-state',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      // SDK requires ≥16 chars. 
      // Match the deploy script's local-devnet default.
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  let deployed:any;
  // 3. Reconnect to the deployed contract — proves callTx interface is wired
  try {
    deployed = await findDeployedContract(providers, {
      contractAddress: deployment.address,
      compiledContract: compiledContract as any,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
  } catch (err: any) {
    await walletCtx.wallet.stop();
    fail(`findDeployedContract threw: ${err?.message ?? err}`);
  }

  // 4. Read the on-chain contract state via the public data provider — proves
  // the contract is indexed and queryable on the chain itself, not just that
  // we know how to construct the local handle.
  const onChainState = await providers.publicDataProvider.queryContractState(deployment.address);
  if (!onChainState) {
    await walletCtx.wallet.stop();
    fail(`queryContractState returned null for ${deployment.address}`);
  }
  // 5. Execute a real Midnight transaction.
  //
  // We deliberately flip lastVerification relative to its current value.
  // This ensures that the test proves the transaction was actually indexed,
  // instead of accidentally passing because the previous state was identical.

  const initialLedger = HelloWorld.ledger(onChainState.data);
  const initialResult = initialLedger.lastVerification;

  const expectedResult = !initialResult;

  console.log('');
  console.log('─── Transactional ZK check ───────────────────────────────────');
  console.log(`   Initial state:  ${initialResult}`);
  console.log(`   Expected state: ${expectedResult}`);
  console.log('   Generating proof...');

  let tx: any;

  try {
    if (expectedResult) {
      // requiredFunds = 5,000 + 10,000 + 5,000 + 1,000 = 21,000
      // 50,000 >= 21,000 => true
      tx = await deployed.callTx.verifyPurchase(
        50_000n,
        5_000n,
        10_000n,
        5_000n,
        1_000n,
      );
    } else {
      // requiredFunds = 5,000 + 4,000 + 2,000 + 1,000 = 12,000
      // 10,000 >= 12,000 => false
      tx = await deployed.callTx.verifyPurchase(
        10_000n,
        5_000n,
        4_000n,
        2_000n,
        1_000n,
      );
    }
  } catch (err: any) {
    await walletCtx.wallet.stop();
    fail(`verifyPurchase transaction failed: ${err?.message ?? err}`);
  }

  let verified = false;

  for (let attempt = 1; attempt <= 20; attempt++) {
    const updatedState =
      await providers.publicDataProvider.queryContractState(
        deployment.address,
      );

    if (updatedState) {
      const ledger = HelloWorld.ledger(updatedState.data);

      if (ledger.lastVerification === expectedResult) {
        verified = true;
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!verified) {
    await walletCtx.wallet.stop();

    fail(
      `transaction succeeded but indexed state never became ${expectedResult}`,
    );
  }

  console.log(`   Transaction: ${tx.public.txId}`);
  console.log(`   Block:       ${tx.public.blockHeight}`);
  console.log('');
  console.log('✅ e2e-check passed');
  console.log('   contract connection: ✅');
  console.log('   public state read:    ✅');
  console.log('   ZK proof generation:  ✅');
  console.log('   transaction submit:   ✅');
  console.log('   state transition:     ✅');
  console.log(`   contractAddress: ${deployment.address}`);
  console.log(`   network:         ${network}`);

  await walletCtx.wallet.stop();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
