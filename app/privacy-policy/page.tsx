import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ORIN Privacy Policy",
  description: "Privacy policy for ORIN mentorship platform"
};

export default function PrivacyPolicyPage() {
  const updatedOn = "March 3, 2026";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fa",
        padding: "24px"
      }}
    >
      <article
        style={{
          maxWidth: 920,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e4e7ec",
          borderRadius: 16,
          padding: 24,
          color: "#1f2937",
          lineHeight: 1.6
        }}
      >
        <h1 style={{ marginTop: 0, color: "#0f3d2f" }}>ORIN Privacy Policy</h1>
        <p>
          Effective date: <strong>{updatedOn}</strong>
        </p>
        <p>
          ORIN (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a mentorship platform that connects students and mentors. This
          Privacy Policy explains what we collect, how we use it, and your choices.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We may collect:</p>
        <p>- Account data: name, email, phone number, role.</p>
        <p>- Profile data: category, specialization, bio, pricing, availability.</p>
        <p>- Session data: booking details, schedule, status, notes.</p>
        <p>- Payment data: payment status, transaction reference, payment screenshot (manual mode).</p>
        <p>- Communication data: chat messages and support interactions.</p>
        <p>- Technical data: device/app logs required for security and troubleshooting.</p>

        <h2>2. How We Use Information</h2>
        <p>We use your information to:</p>
        <p>- Create and manage accounts.</p>
        <p>- Enable booking, payments, session management, and notifications.</p>
        <p>- Verify mentor/student activity and prevent fraud/abuse.</p>
        <p>- Improve platform reliability and user experience.</p>
        <p>- Comply with legal and operational obligations.</p>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell personal data. Data may be shared only with trusted infrastructure providers used to operate
          ORIN (such as hosting, database, email delivery, and app distribution services), and only as needed.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain data as long as needed for account operations, legal compliance, dispute handling, and security.
          When data is no longer required, we remove or anonymize it where reasonably possible.
        </p>

        <h2>5. Security</h2>
        <p>
          We use reasonable technical and organizational safeguards to protect personal data, including authenticated
          access controls and encrypted transport where applicable.
        </p>

        <h2>6. Your Rights</h2>
        <p>You may request to access, correct, or delete your account data by contacting us.</p>
        <p>
          For account deletion requests, contact us from your registered email and include your ORIN account details.
        </p>

        <h2>7. Children&apos;s Privacy</h2>
        <p>
          ORIN is not intended to knowingly collect personal information from children in violation of applicable laws.
          If you believe such data was submitted, contact us for prompt review.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Updated versions will be posted at this URL with a
          revised effective date.
        </p>

        <h2>9. Contact</h2>
        <p>
          Email: <strong>support@orin.app</strong>
        </p>
        <p>
          If your support email is different, replace it before submitting this URL to Play Console.
        </p>
      </article>
    </main>
  );
}
