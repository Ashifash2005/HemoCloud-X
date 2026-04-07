import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, getApiErrorMessage } from "../api/client.js";
import DonorCard from "../components/DonorCard.jsx";
import Field from "../components/Field.jsx";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toTitleCase(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReceiverSearch() {
  const navigate = useNavigate();

  const [bloodGroup, setBloodGroup] = useState("A+");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [donors, setDonors] = useState([]);

  const canSearch = useMemo(() => {
    return bloodGroup && location.trim().length > 0;
  }, [bloodGroup, location]);

  async function onSearch(e) {
    if (e) e.preventDefault();
    setError("");
    setDonors([]);

    if (!canSearch) {
      setError("Please enter both Blood Group and Location.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/donor/search", {
        params: {
          bloodGroup,
          location: toTitleCase(location),
        },
      });

      setDonors(res.data?.donors || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Search failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-medium transition hover:bg-slate-800"
          >
            <span aria-hidden="true">←</span> Return Home
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900/45 p-6 backdrop-blur-xl">
            <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Receiver Triage Console
            </div>
            <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-bold md:text-4xl">Receiver Search</h1>
            <p className="mt-2 text-sm text-white/70 md:text-base">
              Filter available donors by blood group and city to reduce coordination time during critical requests.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-white/60">Search Tips</div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Type any city name</li>
              <li>Case doesn't matter</li>
              <li>Open profile to verify health details</li>
            </ul>
          </div>
        </div>

        <form
          onSubmit={onSearch}
          className="rounded-2xl border border-white/10 bg-slate-950/45 p-6 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-3 items-end">
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

            <Field label="Location (City)">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2 outline-none focus:ring-2 focus:ring-red-400/40"
                placeholder="e.g., Chennai"
              />
            </Field>

            <button
              type="submit"
              disabled={!canSearch || loading}
              className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
            >
              {loading ? "Searching..." : "Search Donors"}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <div className="text-white/70">Loading donors...</div>
          ) : donors.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {donors.map((d) => (
                <DonorCard
                  key={d._id}
                  donor={d}
                  onView={() => navigate(`/donor/${d._id}`)}
                />
              ))}
            </div>
          ) : null}
          {!loading && !donors.length && canSearch && !error ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/70">
              No donors found yet. Try searching with a different location or blood group.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
