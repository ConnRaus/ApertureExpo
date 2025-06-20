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
        "Submit your work to curated photography contests with diverse themes and categories. Each competition is judged by community voting.",
    },
    {
      icon: "🏆",
      title: "Recognition & Awards",
      description:
        "Winners receive recognition for their photographic excellence. Build your reputation and showcase your achievements.",
    },
    {
      icon: "💬",
      title: "Photography Discussion",
      description:
        "Engage in thoughtful discussions about technique, equipment, and artistic vision with fellow photographers.",
    },
    {
      icon: "🎯",
      title: "Constructive Feedback",
      description:
        "Receive honest critique and learn from others' perspectives. Improve your craft through community interaction.",
    },
    {
      icon: "📁",
      title: "Portfolio Showcase",
      description:
        "Display your photography portfolio and track your competition results. Document your growth as a photographer.",
    },
    {
      icon: "🔍",
      title: "Discover Talent",
      description:
        "Explore outstanding photography from diverse artists and styles. Find inspiration in others' creative work.",
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
              A photography competition platform where photographers submit
              their work to themed contests, receive community feedback, and
              compete for recognition.
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
            Professional photography competitions with community-driven judging
            and feedback
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
          <h2 className={styles.sectionTitle}>How Competitions Work</h2>
          <p className={styles.sectionSubtitle}>
            Simple process for entering and judging photography contests
          </p>
        </div>

        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Submit Your Work</h3>
              <p className={styles.stepDescription}>
                Upload your photographs to active competitions that match your
                style and interests
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Community Voting</h3>
              <p className={styles.stepDescription}>
                Members rate submissions during the voting period to determine
                winners
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Results & Recognition</h3>
              <p className={styles.stepDescription}>
                Winners are announced and featured. All participants receive
                valuable feedback
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
            Join photographers who are submitting their work and participating
            in our contests
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
