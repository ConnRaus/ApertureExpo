import React from "react";
import { Link } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import styles from "../styles/components/Navigation.module.css";

function Navigation() {
  const { user } = useUser();

  return (
    <nav className={styles.navHeader}>
      <div className={styles.navLeft}>
        <Link to="/" className={styles.navLink}>
          Home
        </Link>
        <Link to="/events" className={styles.navLink}>
          Events
        </Link>
      </div>
      <div className={styles.navRight}>
        <SignedIn>
          <Link to={`/users/${user?.id}`} className={styles.navLink}>
            Your Profile
          </Link>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className={styles.signInButton}>Sign In</button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}

export default Navigation;
