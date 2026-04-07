import React from "react";
import { Link } from "react-router-dom";

function HomeCard({ title, description, to, cta }) {
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl border border-white/15 bg-slate-900/45 p-6 text-white shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-red-300/40"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-400/20 blur-2xl" />
      <div className="relative">
        <div className="text-lg font-bold tracking-wide">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-white/80">{description}</div>
      </div>
      <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-200">
        {cta}
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d1f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-red-500/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-red-900/35 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 md:p-10 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
            Regional Emergency Network
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <h1 className="font-['Space_Grotesk'] text-4xl font-bold leading-tight text-white md:text-6xl">
                Find blood support in minutes, not hours.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
                A city-wide donor coordination platform for urgent and planned requests.
                Donors can register with medical proof, and receivers can quickly locate
                matching blood groups by location.
              </p>
            </div>

            <div className="md:col-span-2 grid gap-3 self-start">
              <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Response Readiness</div>
                <div className="mt-2 text-2xl font-extrabold text-emerald-200">24 x 7</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Storage Pipeline</div>
                <div className="mt-2 text-2xl font-extrabold text-cyan-200">AWS S3 + DynamoDB</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <HomeCard
              title="Donor"
              description="Create or update your donor profile with health history, contact details, and validated report uploads."
              to="/donor"
              cta="Register as Donor"
            />
            <HomeCard
              title="Receiver"
              description="Search by blood group and city to identify eligible donors quickly during emergencies."
              to="/receiver"
              cta="Search for Donors"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-white/70">
            Before use: start backend and frontend servers. Receiver search and donor profile
            image links are generated live from backend APIs.
          </div>
        </div>
      </div>
    </div>
  );
}

