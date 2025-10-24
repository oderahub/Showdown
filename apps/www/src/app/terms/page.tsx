import React from 'react';
import { Shield, AlertTriangle, Info } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-4xl font-bold">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="rounded-lg bg-yellow-500/10 p-6 border border-yellow-500/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-500 mb-2">Important Notice</h3>
              <p className="text-sm text-muted-foreground">
                This platform facilitates real cryptocurrency gambling. By using this service,
                you acknowledge and accept all associated financial risks.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Info className="h-5 w-5" />
            1. Eligibility
          </h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>To use this platform, you must:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Be at least 18 years old (or 21+ in applicable jurisdictions)</li>
              <li>Reside in a jurisdiction where online cryptocurrency gambling is legal</li>
              <li>Have the legal capacity to enter into binding agreements</li>
              <li>Not be prohibited from gambling under any applicable law</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Platform Description</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              This is a decentralized Texas Hold&apos;em poker game built on the Lisk Sepolia blockchain
              using zero-knowledge proofs for card shuffling and revealing.
            </p>
            <p><strong>Key Features:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>On-chain game logic with provably fair card distribution</li>
              <li>Mental Poker protocol using ZK-SNARKs</li>
              <li>2-minute action timeout to prevent griefing</li>
              <li>Automatic force-fold for inactive players</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Financial Risks</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p><strong>You acknowledge and accept that:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All bets are made in real cryptocurrency (ETH on Lisk Sepolia)</li>
              <li>You may lose your entire stake in any game</li>
              <li>Cryptocurrency values are volatile and may fluctuate</li>
              <li>Blockchain transactions are irreversible</li>
              <li>Gas fees apply to all transactions</li>
              <li>We are not responsible for any financial losses</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Timeout & Anti-Griefing Rules</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>Each player has 2 minutes to act during their turn</li>
              <li>Failure to act within 2 minutes results in automatic force-fold</li>
              <li>Any player can trigger force-fold after timeout expires</li>
              <li>Timed-out players forfeit their current stake (set to 0)</li>
              <li>Repeated timeouts may impact your reputation</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Smart Contract Risks</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>This platform uses smart contracts which:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Are deployed on Lisk Sepolia (testnet/mainnet)</li>
              <li>Have been audited but are provided &quot;as is&quot; without warranty</li>
              <li>May contain bugs or vulnerabilities</li>
              <li>Are immutable and cannot be upgraded after deployment</li>
              <li>Execute automatically without human intervention</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Privacy & Data</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>All game data is stored on public blockchain (transparent)</li>
              <li>Your wallet address is publicly visible</li>
              <li>Age verification status is stored locally only (LocalStorage)</li>
              <li>We do not collect personal information beyond wallet addresses</li>
              <li>Chat messages (if enabled) are temporary and not stored permanently</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Prohibited Activities</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use bots or automated tools to play</li>
              <li>Collude with other players</li>
              <li>Exploit bugs or vulnerabilities</li>
              <li>Use multiple accounts to circumvent rules</li>
              <li>Harass or abuse other players</li>
              <li>Attempt to manipulate the game outcome</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Disclaimer of Warranties</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
              WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, ERROR-FREE OPERATION, OR SECURITY OF FUNDS.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF
              THIS PLATFORM.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Changes to Terms</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform
              constitutes acceptance of updated terms.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">11. Contact & Disputes</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              For questions or disputes, please contact us at: <strong>[Your Contact Email]</strong>
            </p>
            <p>
              Disputes will be resolved through binding arbitration in accordance with [Jurisdiction].
            </p>
          </div>
        </section>

        <div className="rounded-lg bg-primary/10 p-6 border border-primary/20 mt-8">
          <p className="text-sm text-center">
            By using this platform, you acknowledge that you have read, understood, and agree to be
            bound by these Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;