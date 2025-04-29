import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import styles from "../../styles/components/Navigation.module.css";

function Navigation() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const clerk = useClerk();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={styles.navHeader}>
      <div className={styles.navLeft}>
        <button
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <div
            className={`${styles.hamburgerLine} ${
              mobileMenuOpen ? styles.active : ""
            }`}
          ></div>
          <div
            className={`${styles.hamburgerLine} ${
              mobileMenuOpen ? styles.active : ""
            }`}
          ></div>
          <div
            className={`${styles.hamburgerLine} ${
              mobileMenuOpen ? styles.active : ""
            }`}
          ></div>
        </button>
        <div className={styles.desktopNav}>
          <Link to="/" className={styles.navLink}>
            Home
          </Link>
          <Link to="/events" className={styles.navLink}>
            Events
          </Link>
          <Link to="/forum" className={styles.navLink}>
            Forum
          </Link>
        </div>
      </div>

      <div className={styles.navRight}>
        <SignedIn>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Your Profile"
                onClick={() => navigate(`/users/${user?.id}`)}
                labelIcon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                }
              />
              <UserButton.Appearance />
              <UserButton.SessionList />
              <UserButton.SignOut />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className={styles.signInButton}>Sign In</button>
          </SignInButton>
        </SignedOut>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}
      >
        <Link
          to="/"
          className={styles.mobileNavLink}
          onClick={toggleMobileMenu}
        >
          Home
        </Link>
        <Link
          to="/events"
          className={styles.mobileNavLink}
          onClick={toggleMobileMenu}
        >
          Events
        </Link>
        <Link
          to="/forum"
          className={styles.mobileNavLink}
          onClick={toggleMobileMenu}
        >
          Forum
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
