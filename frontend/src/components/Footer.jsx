import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-gray-700/50 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                About Photo Contests
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Join our community of photographers, share your work, and
                participate in exciting photo contests. Showcase your talent and
                get inspired by others.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/events"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Contests
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/ConnRaus/photo-contests"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact/Social */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  Have questions or suggestions?{" "}
                  <a
                    href="mailto:contact@photocontests.app"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Contact us
                  </a>
                </p>
                <div className="flex space-x-4 mt-4">
                  <a
                    href="https://github.com/ConnRaus/photo-contest-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    title="GitHub"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-700/50 text-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Photo Contests. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
