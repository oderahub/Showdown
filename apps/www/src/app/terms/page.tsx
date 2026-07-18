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
                Showdown is an unaudited testnet preview. Play uses free test tokens that have
                no monetary value, and no real-money wagering is offered. By using this service
                you accept that it is experimental software provided without warranty.
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
              <li>Have the legal capacity to enter into binding agreements</li>
              <li>Use it only where accessing experimental blockchain software is lawful</li>
              <li>Understand that play involves valueless testnet tokens, not real funds</li>
            </ul>
            <p>
              Showdown is a skill-based poker game. This deployment does not offer real-money
              play and does not accept deposits. Should a future release support real stakes,
              age and jurisdiction requirements will apply and these terms will be updated
              before that happens.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Platform Description</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>
              This is a decentralized Texas Hold&apos;em poker game currently deployed on the
              Lisk Sepolia test network, using zero-knowledge proofs for card shuffling and
              revealing.
            </p>
            <p><strong>Key Features:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>On-chain game logic and pot distribution</li>
              <li>Mental Poker protocol using ZK-SNARKs</li>
              <li>2-minute action timeout to prevent griefing</li>
              <li>Automatic force-fold for inactive players</li>
            </ul>
            <p>
              <strong>Fairness limitation:</strong> card reveals are verified on-chain, but
              shuffle proofs are currently verified client-side rather than by the contract.
              Card distribution is therefore not yet trustlessly enforced.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Stakes & Risks</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p><strong>You acknowledge and accept that:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bets use Lisk Sepolia testnet tokens, which have no monetary value and are obtained free from a faucet</li>
              <li>You may lose your entire testnet stake in any game</li>
              <li>Blockchain transactions are irreversible</li>
              <li>Testnet gas fees apply to all transactions</li>
              <li>Test networks may be reset, and balances lost, without notice</li>
              <li>We are not responsible for any losses</li>
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
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Smart Contract Risks</h2>
          <div className="pl-7 space-y-2 text-muted-foreground">
            <p>This platform uses smart contracts which:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Are deployed on the Lisk Sepolia test network</li>
              <li><strong>Have not been audited</strong>, and are provided &quot;as is&quot; without warranty</li>
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
              <li>Testnet notice acknowledgement is stored locally only (LocalStorage)</li>
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
              Showdown is an open-source project. For questions, bug reports, or disputes,
              please open an issue at{' '}
              <a
                className="text-primary underline hover:text-primary/80"
                href="https://github.com/oderahub/showdown/issues"
                rel="noreferrer"
                target="_blank"
              >
                github.com/oderahub/showdown
              </a>
              .
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