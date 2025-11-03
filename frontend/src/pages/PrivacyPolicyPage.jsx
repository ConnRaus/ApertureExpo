import React from "react";

function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-100 mb-6">
        Photo Rights & Privacy Policy
      </h1>

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-6 text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            Your Photo Rights
          </h2>
          <p className="leading-relaxed">
            You retain all rights to your photographs uploaded to Aperture Expo.
            We do not claim ownership of your creative work in any way.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            How We Handle Your Photos
          </h2>
          <p className="leading-relaxed mb-3">
            When you upload a photo to Aperture Expo, we automatically compress
            it to a maximum of 1MB for optimal website performance. This means:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>We do not store the original, full-resolution versions of your photos</li>
            <li>All photos on the platform are compressed versions optimized for web display</li>
            <li>This compression helps ensure fast loading times for all users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            How We Use Your Photos
          </h2>
          <p className="leading-relaxed mb-3">
            By uploading photos to Aperture Expo, you grant us permission to
            display them on our website for the following purposes only:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Contest Voting:</strong> Your submissions will be visible
              to other users for voting during active contests
            </li>
            <li>
              <strong>Your Profile:</strong> Photos you upload will be displayed
              in your personal gallery on your profile page
            </li>
            <li>
              <strong>Winner Showcases:</strong> If you win a contest, your
              winning photo will be featured in our recent winners showcase
            </li>
          </ul>
          <p className="leading-relaxed mt-3">
            We will never use your photos for commercial purposes, sell them to
            third parties, or display them outside of the Aperture Expo website
            without your explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            Removing Your Photos
          </h2>
          <p className="leading-relaxed">
            You may delete your photos from the platform at any time through
            your profile settings. Once deleted, your photos will be permanently
            removed from our servers.
          </p>
        </section>

        <section className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Last updated: November 2, 2025
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;

