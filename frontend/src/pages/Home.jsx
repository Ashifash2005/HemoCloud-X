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
        <div className="absolute -left-10 top-10 h-96 w-96 rounded-full bg-red-500/30 blur-[100px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-red-900/40 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
            Regional Emergency Network
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <h1 className="font-['Space_Grotesk'] text-5xl font-extrabold leading-tight text-white md:text-7xl tracking-tight">
                Find blood support in <span className="text-red-400">minutes</span>, not hours.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-xl">
                A city-wide donor coordination platform for urgent and planned requests.
                Donors can register safely, and receivers can instantly locate matching blood groups nearby.
              </p>
            </div>

            <div className="md:col-span-2 grid gap-3 self-start">
              <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">Response Readiness</div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-300">24 x 7</div>
              </div>
            </div>
          </div>

          {/* New Impact Statistics Block */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-white/60">Lives impact potential</div>
              <div className="mt-2 text-3xl font-bold text-white">12,000+</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-white/60">Active Donors Needed</div>
              <div className="mt-2 text-3xl font-bold text-red-200">5,000+</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-white/60">Average Search Time</div>
              <div className="mt-2 text-3xl font-bold text-cyan-200">&lt; 3 mins</div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <HomeCard
              title="Donor Registration"
              description="Create or update your donor profile with health history, contact details, and validated medical report uploads."
              to="/donor"
              cta="Register as Donor"
            />
            <HomeCard
              title="Receiver Search"
              description="Search by blood group and city to identify eligible donors quickly during critical emergencies."
              to="/receiver"
              cta="Search for Donors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

