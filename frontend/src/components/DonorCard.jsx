import React from "react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function DonorCard({ donor, onView }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{donor.name}</div>
          <div className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Blood:</span> {donor.bloodGroup}
          </div>
          <div className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Location:</span> {donor.location}
          </div>
          <div className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Contact:</span> {donor.phone}
          </div>
          <div className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Last donation:</span>{" "}
            {formatDate(donor.lastDonationDate)}
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={onView}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

