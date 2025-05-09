import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { AdminService } from "../services/adminService";
import styles from "../styles/pages/AdminPage.module.css"; // Import the CSS module

const AdminPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bannerImageUrl: "",
    startDate: "",
    endDate: "",
    votingStartDate: "",
    votingEndDate: "",
    maxPhotosPerUser: 3,
  });
  const [editingContestId, setEditingContestId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [sameAsEndDate, setSameAsEndDate] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);

  // Get user's current time zone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (isSignedIn) {
      // Check if user is admin
      checkIfAdmin();
    }
  }, [isSignedIn]);

  // Only fetch contests if user is admin
  useEffect(() => {
    if (isAdmin && isSignedIn) {
      fetchContests();
    }
  }, [isAdmin, isSignedIn]);

  const checkIfAdmin = async () => {
    try {
      // Try to access an admin endpoint - if it succeeds, the user is an admin
      await AdminService.getContests();
      setIsAdmin(true);
      setError(null);
    } catch (err) {
      // Check for network errors vs authorization errors
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        setError("Unable to connect to the server. Please try again later.");
        console.error("Network error during admin check");
      } else if (err.response && err.response.status === 403) {
        // If we get a 403 Forbidden, the user is not an admin
        setIsAdmin(false);
        setError(null);
      } else {
        // For other errors, show a generic message
        setError(
          "An error occurred while checking admin access. Please try again."
        );
        console.error("Error during admin check");
      }
    } finally {
      setAdminCheckDone(true);
      setLoading(false);
    }
  };

  // Effect to sync votingStartDate with endDate when sameAsEndDate is true
  useEffect(() => {
    if (sameAsEndDate && formData.endDate) {
      setFormData((prev) => ({
        ...prev,
        votingStartDate: formData.endDate,
      }));
    }
  }, [sameAsEndDate, formData.endDate]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getContests();
      setContests(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // If changing endDate and sameAsEndDate is true, update votingStartDate as well
    if (name === "endDate" && sameAsEndDate) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        votingStartDate: value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    setSameAsEndDate(e.target.checked);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      bannerImageUrl: "",
      startDate: "",
      endDate: "",
      votingStartDate: "",
      votingEndDate: "",
      maxPhotosPerUser: 3,
    });
    setEditingContestId(null);
    setSameAsEndDate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert string values to appropriate formats
      const contestData = {
        ...formData,
        maxPhotosPerUser: parseInt(formData.maxPhotosPerUser, 10),
      };

      if (editingContestId) {
        // Updating existing contest
        await AdminService.updateContest(editingContestId, contestData);
        setSuccessMessage("Contest updated successfully!");
      } else {
        // Creating new contest
        await AdminService.createContest(contestData);
        setSuccessMessage("New contest created successfully!");
      }

      // Refresh contests list and reset form
      await fetchContests();
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (editingContestId
            ? "Failed to update contest"
            : "Failed to create contest")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (contestId) => {
    try {
      setLoading(true);
      const contest = await AdminService.getContest(contestId);

      // Format dates for input fields (YYYY-MM-DDTHH:MM) in local time
      const formatDateForInput = (dateString) => {
        // Convert the UTC date from the database to a local date for display
        const date = new Date(dateString);

        // Get year, month, day, hours, minutes in user's local time
        const year = date.getFullYear();
        // getMonth() is 0-based, so add 1 and pad with a leading zero if needed
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        // Format as YYYY-MM-DDTHH:MM for datetime-local input
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        return formattedDate;
      };

      const formattedEndDate = formatDateForInput(contest.endDate);
      const formattedVotingStartDate = formatDateForInput(
        contest.votingStartDate
      );

      // Check if votingStartDate is the same as endDate (within 1 minute)
      const endDateObj = new Date(contest.endDate);
      const votingStartDateObj = new Date(contest.votingStartDate);
      const timeDiffMinutes =
        Math.abs(votingStartDateObj - endDateObj) / (1000 * 60);
      const datesAreSame = timeDiffMinutes < 1;

      setSameAsEndDate(datesAreSame);

      const updatedFormData = {
        title: contest.title,
        description: contest.description || "",
        bannerImageUrl: contest.bannerImageUrl || "",
        startDate: formatDateForInput(contest.startDate),
        endDate: formattedEndDate,
        votingStartDate: formattedVotingStartDate,
        votingEndDate: formatDateForInput(contest.votingEndDate),
        maxPhotosPerUser: contest.maxPhotosPerUser || 3,
      };

      setFormData(updatedFormData);

      setEditingContestId(contestId);
      setError(null);
      // Scroll to form
      document
        .getElementById("contestForm")
        .scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load contest details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contestId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this contest? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await AdminService.deleteContest(contestId);
      setSuccessMessage("Contest deleted successfully!");
      await fetchContests();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete contest");
    } finally {
      setLoading(false);
    }
  };

  // Format a date for display, showing local time with time zone
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Format with local time zone and include AM/PM
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short", // Show the time zone name (e.g., MDT)
    };

    return date.toLocaleString("en-US", options);
  };

  if (!isLoaded) {
    return <div className="container mt-4">Loading user data...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="container mt-4">
        Please sign in to access the admin page.
      </div>
    );
  }

  if (adminCheckDone && !isAdmin) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card shadow ${styles.card}`}>
              <div className={`card-header ${styles.cardHeader}`}>
                <h5 className="mb-0">Access Denied</h5>
              </div>
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <i
                    className="bi bi-shield-lock-fill"
                    style={{ fontSize: "3rem", color: "#dc3545" }}
                  ></i>
                </div>
                <h4 className="mb-3">Unauthorized Access</h4>
                <p className="text-muted mb-4">
                  You don't have permission to access the admin dashboard. This
                  area is restricted to site administrators only.
                </p>
                <a
                  href="/"
                  className={`btn ${styles.button} ${styles.buttonPrimary}`}
                >
                  Return to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mt-4 mb-5 ${styles.container}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.title}>Admin Dashboard</h1>
        <div className="text-end">
          <p className="text-muted mb-0">
            <small>
              Logged in as: {user?.primaryEmailAddress?.emailAddress}
            </small>
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
            aria-label="Close"
          ></button>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-12">
          <div className={`card shadow mb-5 ${styles.card}`} id="contestForm">
            <div className={`card-header ${styles.cardHeader}`}>
              <h5 className="mb-0">
                {editingContestId ? "Edit Contest" : "Create New Contest"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="p-2">
                <div className="row mb-4">
                  <div className="col-12">
                    <h6
                      className={`text-muted mb-3 border-bottom pb-2 ${styles.sectionTitle}`}
                    >
                      Contest Information
                    </h6>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="title" className="form-label fw-bold">
                      Title*
                    </label>
                    <input
                      type="text"
                      className={`form-control ${styles.input}`}
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter contest title"
                      required
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="description" className="form-label fw-bold">
                      Description
                    </label>
                    <textarea
                      className={`form-control ${styles.input}`}
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Describe the contest theme, rules, and expectations"
                    ></textarea>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label
                      htmlFor="bannerImageUrl"
                      className="form-label fw-bold"
                    >
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      className={`form-control ${styles.input}`}
                      id="bannerImageUrl"
                      name="bannerImageUrl"
                      value={formData.bannerImageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.bannerImageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.bannerImageUrl}
                          alt="Banner preview"
                          className="img-thumbnail"
                          style={{ maxHeight: "100px" }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h6
                      className={`text-muted mb-3 border-bottom pb-2 ${styles.sectionTitle}`}
                    >
                      Contest Timeline
                    </h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="startDate" className="form-label fw-bold">
                      Start Date*
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control ${styles.input}`}
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                    <small className="text-muted">
                      When submissions can begin
                    </small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="endDate" className="form-label fw-bold">
                      End Date (Submission Deadline)*
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control ${styles.input}`}
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                    <small className="text-muted">
                      When submissions will close
                    </small>
                  </div>

                  <div className="col-12 mb-3">
                    <div className="form-check ps-0">
                      <div className={`card p-3 ${styles.featureBox}`}>
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className={`form-check-input me-2 ${styles.checkbox}`}
                            id="sameAsEndDate"
                            checked={sameAsEndDate}
                            onChange={handleCheckboxChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="sameAsEndDate"
                          >
                            <strong>
                              Set voting start date same as submission end date
                            </strong>
                          </label>
                        </div>
                        <small className="text-muted mt-1 ps-4">
                          When checked, voting begins as soon as submissions
                          close
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label
                      htmlFor="votingStartDate"
                      className="form-label fw-bold"
                    >
                      Voting Start Date*
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control ${styles.input}`}
                      id="votingStartDate"
                      name="votingStartDate"
                      value={formData.votingStartDate}
                      onChange={handleInputChange}
                      disabled={sameAsEndDate}
                      required
                    />
                    <small className="text-muted">
                      When voting phase begins
                    </small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label
                      htmlFor="votingEndDate"
                      className="form-label fw-bold"
                    >
                      Voting End Date*
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control ${styles.input}`}
                      id="votingEndDate"
                      name="votingEndDate"
                      value={formData.votingEndDate}
                      onChange={handleInputChange}
                      required
                    />
                    <small className="text-muted">
                      When voting phase ends and winners are announced
                    </small>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <h6
                      className={`text-muted mb-3 border-bottom pb-2 ${styles.sectionTitle}`}
                    >
                      Contest Rules
                    </h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label
                      htmlFor="maxPhotosPerUser"
                      className="form-label fw-bold"
                    >
                      Max Photos Per User
                    </label>
                    <input
                      type="number"
                      className={`form-control ${styles.input}`}
                      id="maxPhotosPerUser"
                      name="maxPhotosPerUser"
                      value={formData.maxPhotosPerUser}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                    />
                    <small className="text-muted">
                      Maximum number of photos each user can submit
                    </small>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className={`btn ${styles.button} ${styles.buttonPrimary}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : editingContestId ? (
                      "Update Contest"
                    ) : (
                      "Create Contest"
                    )}
                  </button>

                  {editingContestId && (
                    <button
                      type="button"
                      className={`btn ${styles.button} ${styles.buttonSecondary}`}
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-12">
          <div className={`card shadow ${styles.card}`}>
            <div className={`card-header ${styles.cardHeaderSecondary}`}>
              <h5 className="mb-0">Manage Contests</h5>
            </div>
            <div className="card-body">
              {loading && !contests.length ? (
                <div className="text-center p-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className={`table-responsive ${styles.tableContainer}`}>
                  <table
                    className={`table table-hover align-middle ${styles.table}`}
                  >
                    <thead className={styles.tableHead}>
                      <tr>
                        <th className={styles.tableHeadCell}>Title</th>
                        <th className={styles.tableHeadCell}>Status</th>
                        <th className={styles.tableHeadCell}>Dates</th>
                        <th className={styles.tableHeadCell}>Submissions</th>
                        <th className={`text-end ${styles.tableHeadCell}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contests.length === 0 ? (
                        <tr className={styles.tableRow}>
                          <td
                            className={`text-center py-5 ${styles.tableCell}`}
                            colSpan="5"
                          >
                            <div className="d-flex flex-column align-items-center">
                              <p className="text-muted mb-3">
                                No contests found
                              </p>
                              <p className="text-muted">
                                Create your first contest using the form above
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        contests.map((contest) => (
                          <tr key={contest.id} className={styles.tableRow}>
                            <td className={styles.tableCell}>
                              <div className="fw-bold">{contest.title}</div>
                              <div
                                className="small text-muted text-truncate"
                                style={{ maxWidth: "300px" }}
                              >
                                {contest.description
                                  ? contest.description.substring(0, 100) +
                                    (contest.description.length > 100
                                      ? "..."
                                      : "")
                                  : "No description"}
                              </div>
                            </td>
                            <td className={styles.tableCell}>
                              <span
                                className={`badge ${styles.badge} ${
                                  contest.status === "upcoming"
                                    ? styles.badgeInfo
                                    : contest.status === "open"
                                    ? styles.badgeSuccess
                                    : contest.status === "voting"
                                    ? styles.badgeWarning
                                    : styles.badgeSecondary
                                }`}
                              >
                                {contest.status}
                              </span>
                            </td>
                            <td className={styles.tableCell}>
                              <div className="small">
                                <div>
                                  <strong>Starts:</strong>{" "}
                                  {formatDate(contest.startDate)}
                                </div>
                                <div>
                                  <strong>Ends:</strong>{" "}
                                  {formatDate(contest.endDate)}
                                </div>
                                <div>
                                  <strong>Voting Ends:</strong>{" "}
                                  {formatDate(contest.votingEndDate)}
                                </div>
                              </div>
                            </td>
                            <td className={styles.tableCell}>
                              <span
                                className={`badge ${styles.badge} ${styles.badgeLight}`}
                              >
                                Max: {contest.maxPhotosPerUser || "Unlimited"}
                              </span>
                            </td>
                            <td className={`${styles.tableCell}`}>
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  className={`btn ${styles.button} ${styles.buttonSm} ${styles.buttonOutlinePrimary}`}
                                  onClick={() => handleEdit(contest.id)}
                                  disabled={loading}
                                  title="Edit contest"
                                >
                                  Edit
                                </button>

                                <button
                                  className={`btn ${styles.button} ${styles.buttonSm} ${styles.buttonOutlineDanger}`}
                                  onClick={() => handleDelete(contest.id)}
                                  disabled={loading}
                                  title="Delete contest"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
