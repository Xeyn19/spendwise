import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#07111f] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <Image
          src="/spendwise-logo.png"
          alt="SpendWise"
          width={96}
          height={96}
          className="mx-auto rounded-3xl"
          priority
        />
        <h1 className="mt-6 font-display text-4xl">You’re offline</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Open the dashboard to continue with data saved on this device. Pending changes will synchronize automatically when your connection returns.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400"
        >
          Open dashboard
        </Link>
      </section>
    </main>
  );
}
