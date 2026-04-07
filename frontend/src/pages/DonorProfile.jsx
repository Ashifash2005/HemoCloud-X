import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function DonorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/donor/${id}`);
        if (!mounted) return;
        setDonor(res.data?.donor || null);
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load donor profile."
        );
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-red-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Donor Profile</h1>
            <p className="mt-2 text-sm text-white/70">
              Full donor details and health information.
            </p>
          </div>

          <button
            onClick={() => navigate("/receiver")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Back to Receiver
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70">
            Loading donor...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-100">
            {error}
          </div>
        ) : donor ? (
          <div className="grid gap-6 md:grid-cols-3 items-start">
            <div className="md:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-sm font-semibold text-white/80 mb-4">
                  Profile Image
                </div>
                <img
                  src={donor.profileImageUrl}
                  alt={`${donor.name} profile`}
                  className="h-56 w-full rounded-2xl object-cover border border-white/10 bg-white/5"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{donor.name}</div>
                    <div className="mt-2 text-sm text-white/70">
                      <span className="font-medium text-white/80">Blood:</span> {donor.bloodGroup}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Location:</span> {donor.location}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Contact:</span> {donor.phone}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Email:</span> {donor.email}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Last Donation:</span> {formatDate(donor.lastDonationDate)}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Gender:</span> {donor.gender}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="font-medium text-white/80">Age:</span> {donor.age}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-semibold text-white/80">Health Information</div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm text-white/80">
                    {donor.healthStatus}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-semibold text-white/80">Medical Report</div>
                  <div className="mt-3">
                    <a
                      href={donor.medicalReportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      View / Download Report
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70">
            Donor not found.
          </div>
        )}
      </div>
    </div>
  );
}

