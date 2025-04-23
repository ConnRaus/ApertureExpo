import React, { useState } from "react";
import { Link } from "react-router-dom";
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
          <div className={styles.desktopOnly}>
            <Link to={`/users/${user?.id}`} className={styles.navLink}>
              Your Profile
            </Link>
          </div>
          <UserButton>
            {/*
            DONT DELETE, THIS IS THE ONLY WORKING TEMPLATE BUTTON IVE MADE
            <UserButton.MenuItems>
              <UserButton.Action
                label="Open chat"
                onClick={() => {
                  console.log("Chat action clicked!");
                  alert("Chat initialized!");
                }}
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                }
              />
            </UserButton.MenuItems> */}
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
        <SignedIn>
          <Link
            to={`/users/${user?.id}`}
            className={styles.mobileNavLink}
            onClick={toggleMobileMenu}
          >
            Your Profile
          </Link>
        </SignedIn>
      </div>
    </nav>
  );
}

export default Navigation;
