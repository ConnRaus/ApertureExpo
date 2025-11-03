import React, { useState, useEffect } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useContestService } from "../../hooks";
import logoImage from "../../assets/TransparentLogo.svg";
import styles from "./LandingPage.module.css";

// Background slideshow component for hero section
function HeroBackgroundSlideshow() {
  const [winners, setWinners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const contestService = useContestService();

  useEffect(() => {
    const fetchRecentWinners = async () => {
      try {
        const allContests = await contestService.fetchContests();

        const completedContests = allContests.filter(
          (contest) =>
            contest.phase === "ended" || contest.status === "completed"
        );

        if (completedContests.length === 0) {
          setIsLoading(false);
          return;
        }

        const contestsWithPhotos = completedContests.filter(
          (contest) => contest.submissionCount > 0
        );

        if (contestsWithPhotos.length === 0) {
          setIsLoading(false);
          return;
        }

        contestsWithPhotos.sort(
          (a, b) => new Date(b.votingEndDate) - new Date(a.votingEndDate)
        );

        const recentContests = contestsWithPhotos.slice(0, 2);

        const winnerPromises = recentContests.map(async (contest) => {
          try {
            const topPhotos = await contestService.fetchTopPhotos(
              contest.id,
              3
            );
            return Array.isArray(topPhotos) ? topPhotos.slice(0, 3) : [];
          } catch (error) {
            return [];
          }
        });

        const contestWinners = await Promise.all(winnerPromises);

        const allWinningPhotos = contestWinners
          .flat()
          .filter((photo) => photo && (photo.imageUrl || photo.s3Url));
        // Normalize the image URL property
        allWinningPhotos.forEach((photo) => {
          if (!photo.imageUrl && photo.s3Url) {
            photo.imageUrl = photo.s3Url;
          }
        });

        if (allWinningPhotos.length > 0) {
          setWinners(allWinningPhotos.slice(0, 6)); // Max 6 photos for slideshow
        }
      } catch (error) {
        // Silent fail - no slideshow if there's an error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentWinners();
  }, []);

  // Auto-advance slideshow
  useEffect(() => {
    if (winners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % winners.length);
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [winners.length]);

  if (isLoading || winners.length === 0) {
    return <div className={styles.backgroundOverlay} />;
  }

  return (
    <>
      {winners.map((photo, index) => (
        <div
          key={photo.id}
          className={`${styles.backgroundSlide} ${
            index === currentIndex ? styles.backgroundSlideActive : ""
          }`}
          style={{
            backgroundImage: `url(${photo.imageUrl})`,
          }}
        />
      ))}
      <div className={styles.backgroundOverlay} />
    </>
  );
}

function LandingPage() {
  const features = [
    {
      icon: "📸",
      title: "Photography Competitions",
      description:
        "Submit your photos to themed contests and let the community vote on them. New competitions launch regularly with different themes and categories.",
    },
    {
      icon: "🏆",
      title: "Earn XP & Level Up",
      description:
        "Win contests, get votes, and participate in the community to earn XP. Level up your profile and climb the leaderboard.",
    },
    {
      icon: "💬",
      title: "Photography Discussion",
      description:
        "Connect with other photographers in dedicated forums. Share tips about gear, techniques, and get feedback on your work.",
    },
    {
      icon: "🎯",
      title: "Constructive Feedback",
      description:
        "Get genuine feedback on your submissions through comments and voting. Learn what resonates with viewers and refine your photographic eye.",
    },
    {
      icon: "📁",
      title: "Portfolio Showcase",
      description:
        "Build your profile gallery and track your contest history. Watch your portfolio grow as you submit to competitions and level up your account.",
    },
    {
      icon: "🔍",
      title: "Discover Talent",
      description:
        "Browse winning photos from past contests and see what other photographers are creating. Get inspired for your next shot.",
    },
  ];

  const stats = [
    { number: "New", label: "Competition Platform" },
    { number: "Regular", label: "Photography Contests" },
    { number: "Growing", label: "Photographer Network" },
    { number: "Fair", label: "Community Judging" },
  ];

  return (
    <div className={styles.landingPage}>
      {/* Hero Section with Background Slideshow */}
      <section className={styles.heroSection}>
        <HeroBackgroundSlideshow />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.logoContainer}>
              <img
                src={logoImage}
                alt="Aperture Expo"
                className={styles.heroLogo}
              />
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.brandName}>Aperture Expo</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Compete in themed photography contests, earn XP, level up your
              profile, and showcase your best work to a community of passionate
              photographers.
            </p>

            {/* CTA Buttons */}
            <div className={styles.ctaContainer}>
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              >
                <button className={styles.primaryButton}>
                  <span>Create Account</span>
                  <svg
                    className={styles.buttonIcon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </SignUpButton>

              <SignInButton
                mode="modal"
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              >
                <button className={styles.secondaryButton}>Sign In</button>
              </SignInButton>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsContainer}>
              {stats.map((stat, index) => (
                <div key={index} className={styles.statItem}>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Competition Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to compete, improve, and connect with other
            photographers
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureContent}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Three simple steps to start competing and earning XP
          </p>
        </div>

        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Submit Your Photos</h3>
              <p className={styles.stepDescription}>
                Choose from active themed contests and upload your best shots.
                Each submission earns you XP and a chance to win.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Vote & Get Voted On</h3>
              <p className={styles.stepDescription}>
                Vote on other submissions during the voting phase. Your votes
                help determine winners and earn you XP too.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Earn XP & Win</h3>
              <p className={styles.stepDescription}>
                Winners get featured and everyone earns XP based on their
                performance. Use XP to level up and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCtaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Enter Your First Competition?
          </h2>
          <p className={styles.ctaDescription}>
            Join the community and start earning XP today. Your next great shot
            could be a winner.
          </p>

          <div className={styles.finalCtaButtons}>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/"
              fallbackRedirectUrl="/"
            >
              <button className={styles.primaryButton}>
                <span>Start Competing</span>
                <svg
                  className={styles.buttonIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
