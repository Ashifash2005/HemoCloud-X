import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Field from "../components/Field.jsx";
import { api, getApiErrorMessage } from "../api/client.js";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Other"];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDateForInput(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function DonorRegister() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState(
    formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  const [healthStatus, setHealthStatus] = useState("");

  const [medicalReportFile, setMedicalReportFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return (
      fullName.trim() &&
      Number(age) > 0 &&
      phone.trim() &&
      isValidEmail(email) &&
      location.trim() &&
      lastDonationDate &&
      healthStatus.trim() &&
      medicalReportFile &&
      profileImageFile
    );
  }, [
    fullName,
    age,
    phone,
    email,
    location,
    lastDonationDate,
    healthStatus,
    medicalReportFile,
    profileImageFile,
  ]);

  function handleProfileFileChange(file) {
    setProfileImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
  }

  function validate() {
    const errors = [];
    if (!fullName.trim()) errors.push("Full Name is required");
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) errors.push("Age must be 1-120");
    if (!genders.includes(gender)) errors.push("Invalid gender");
    if (!bloodGroups.includes(bloodGroup)) errors.push("Invalid blood group");
    if (!phone.trim()) errors.push("Phone Number is required");
    if (!isValidEmail(email)) errors.push("Email is invalid");
    if (!location.trim()) errors.push("Location is required");
    if (!lastDonationDate) errors.push("Last Donation Date is required");
    if (!healthStatus.trim()) errors.push("Health Status is required");
    if (!medicalReportFile) errors.push("Medical report file is required");
    if (!profileImageFile) errors.push("Profile image file is required");
    return errors;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationErrors = validate();
    if (validationErrors.length) {
      setError(validationErrors.join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", fullName.trim());
      formData.append("age", String(Number(age)));
      formData.append("gender", gender);
      formData.append("bloodGroup", bloodGroup);
      formData.append("phone", phone.trim());
      formData.append("email", email.trim());
      formData.append("location", location.trim());
      formData.append("lastDonationDate", lastDonationDate);
      formData.append("healthStatus", healthStatus.trim());
      formData.append("medicalReport", medicalReportFile);
      formData.append("profileImage", profileImageFile);

      const res = await api.post("/api/donor/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(res.data?.message || "Registered successfully");
      const donorId = res.data?.donor?._id;
      if (donorId) navigate(`/donor/${donorId}`);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Registration failed. Please check your input and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1024] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900/45 p-6 backdrop-blur-xl">
            <div className="inline-flex rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-100">
              Donor Intake Desk
            </div>
            <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold md:text-4xl">Donor Registration</h1>
            <p className="mt-2 text-sm text-white/70 md:text-base">
              Share verified donor details to improve emergency matching quality. Medical report and
              profile photo are securely uploaded through the backend.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-white/60">Checklist</div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Valid blood group</li>
              <li>Last donation date</li>
              <li>Medical report upload</li>
              <li>Clear profile image</li>
            </ul>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-slate-950/45 p-6 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., Tharun Kumar"
              />
            </Field>

            <Field label="Age">
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., 25"
              />
            </Field>

            <Field label="Gender">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
              >
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Blood Group">
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Phone Number">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., +91 98765 43210"
              />
            </Field>

            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., donor@example.com"
              />
            </Field>

            <Field label="Location (City)">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., Chennai"
              />
            </Field>

            <Field label="Last Donation Date">
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Health Status">
                <input
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                  placeholder="e.g., Fit to donate"
                />
              </Field>
            </div>

            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <Field label="Upload Medical Report">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(e) => setMedicalReportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-red-500 file:px-3 file:py-2 file:text-white file:hover:bg-red-600"
                />
                {medicalReportFile ? (
                  <div className="mt-2 text-xs text-white/70">
                    Selected: {medicalReportFile.name}
                  </div>
                ) : null}
              </Field>

              <Field label="Profile Image Upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProfileFileChange(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-red-500 file:px-3 file:py-2 file:text-white file:hover:bg-red-600"
                />
                {profileImageFile ? (
                  <div className="mt-2 text-xs text-white/70">
                    Selected: {profileImageFile.name}
                  </div>
                ) : null}
              </Field>
            </div>

            {previewUrl ? (
              <div className="md:col-span-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/20 p-3">
                  <div className="text-sm font-medium text-white/80 mb-2">Profile Preview</div>
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-28 w-28 rounded-full object-cover border border-white/10"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {success}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/receiver")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              disabled={submitting}
            >
              Go to Receiver
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Register Donor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

