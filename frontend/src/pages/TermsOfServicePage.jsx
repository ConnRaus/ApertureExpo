import React from "react";

function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-100 mb-6">
        Terms of Service
      </h1>

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="leading-relaxed">
            By accessing and using Aperture Expo, you accept and agree to be
            bound by the terms and conditions of this agreement. If you do not
            agree to these terms, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            2. User Accounts
          </h2>
          <p className="leading-relaxed mb-3">
            To participate in contests and upload photos, you must create an
            account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate and complete information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            3. Content Guidelines
          </h2>
          <p className="leading-relaxed mb-3">
            When uploading photos or participating in the community, you agree
            to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Only upload photos that you own or have permission to use
            </li>
            <li>
              Not upload content that is illegal, offensive, harmful, or
              violates others' rights
            </li>
            <li>
              Not upload content containing nudity, violence, hate speech, or
              harassment
            </li>
            <li>
              Not engage in spamming, manipulation of votes, or other fraudulent
              activities
            </li>
            <li>Respect other users and maintain a positive community atmosphere</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            4. Photo Submissions and Contests
          </h2>
          <p className="leading-relaxed mb-3">
            When submitting photos to contests:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>You retain all ownership rights to your photographs</li>
            <li>
              You grant Aperture Expo permission to display your photos on the
              platform for contest voting, your profile, and winner showcases
            </li>
            <li>
              Photos are automatically compressed to 1MB maximum for web display
            </li>
            <li>
              Contest rules, including submission deadlines and voting periods,
              must be followed
            </li>
            <li>
              Contest results are final and determined by community voting
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            5. User Conduct
          </h2>
          <p className="leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Violate any applicable laws or regulations while using the service
            </li>
            <li>
              Attempt to gain unauthorized access to the platform or other users'
              accounts
            </li>
            <li>
              Use automated systems (bots) to manipulate votes or create fake
              accounts
            </li>
            <li>
              Interfere with or disrupt the service or servers connected to the
              service
            </li>
            <li>Impersonate another person or entity</li>
            <li>Harass, threaten, or abuse other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            6. Intellectual Property
          </h2>
          <p className="leading-relaxed">
            The Aperture Expo platform, including its design, features, and
            functionality, is owned by Connor Rauscher and is protected by
            copyright and other intellectual property laws. You may not copy,
            modify, distribute, or reverse engineer any part of the platform
            without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            7. Moderation and Enforcement
          </h2>
          <p className="leading-relaxed mb-3">
            We reserve the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Remove any content that violates these terms or is deemed
              inappropriate
            </li>
            <li>Suspend or terminate accounts that violate these terms</li>
            <li>Modify or discontinue any aspect of the service at any time</li>
            <li>Ban users who engage in harmful or fraudulent behavior</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            8. Disclaimer of Warranties
          </h2>
          <p className="leading-relaxed">
            Aperture Expo is provided "as is" without warranties of any kind,
            either express or implied. We do not guarantee that the service will
            be uninterrupted, secure, or error-free. We are not responsible for
            any loss of data or content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            9. Limitation of Liability
          </h2>
          <p className="leading-relaxed">
            To the maximum extent permitted by law, Aperture Expo and its
            operators shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or
            inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            10. Changes to Terms
          </h2>
          <p className="leading-relaxed">
            We reserve the right to modify these terms at any time. Changes will
            be effective immediately upon posting. Your continued use of the
            service after changes are posted constitutes acceptance of the
            modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            11. Termination
          </h2>
          <p className="leading-relaxed">
            You may terminate your account at any time by contacting us. We may
            terminate or suspend your account immediately, without prior notice,
            if you breach these terms or engage in conduct we deem harmful to
            the platform or other users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            12. Contact Information
          </h2>
          <p className="leading-relaxed">
            If you have questions about these Terms of Service, please contact
            us at:{" "}
            <a
              href="mailto:connor.rauscher@gmail.com"
              className="text-indigo-400 hover:text-indigo-300"
            >
              connor.rauscher@gmail.com
            </a>
          </p>
        </section>

        <section className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Last updated: November 3, 2025
          </p>
        </section>
      </div>
    </div>
  );
}

export default TermsOfServicePage;

