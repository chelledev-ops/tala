import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  FileText,
  ClipboardCheck,
  Link2,
  ShieldCheck,
  Route as RouteIcon,
  Users,
  Landmark,
  Gavel,
  Eye,
  Globe,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import api from "@/lib/api";
import { peso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HERO_IMG =
  "https://images.unsplash.com/photo-1625119264099-17f9757291bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxwaGlsaXBwaW5lcyUyMGJyaWRnZSUyMGNvbnN0cnVjdGlvbiUyMGhpZ2h3YXl8ZW58MHx8fHwxNzkwOTMwMzk5fDA&ixlib=rb-4.1.0&q=85";

const STEPS = [
  { n: "01", t: "RECORD", icon: FileText, d: "LGUs record project milestones and supporting evidence." },
  { n: "02", t: "REVIEW", icon: ClipboardCheck, d: "Authorized reviewers validate submitted information and evidence." },
  { n: "03", t: "ANCHOR", icon: Link2, d: "TALA creates a deterministic SHA-256 integrity commitment and anchors it to Stellar." },
  { n: "04", t: "VERIFY", icon: ShieldCheck, d: "Citizens and auditors can independently verify the published record." },
];

const FEATURES = [
  { name: "TALA Record", tag: "One timeline for every project.", d: "Track important milestones from approval through implementation and completion.", icon: FileText },
  { name: "TALA Proof", tag: "Know if a record has changed.", d: "Evidence packages receive a deterministic cryptographic fingerprint that can be independently checked.", icon: ShieldCheck },
  { name: "TALA Anchor", tag: "Integrity anchored to Stellar.", d: "Record the cryptographic commitment through Stellar Testnet.", icon: Link2 },
  { name: "TALA Verify", tag: "Check it yourself.", d: "Anyone can independently verify whether the published evidence matches its recorded commitment.", icon: ClipboardCheck },
  { name: "TALA Trace", tag: "Follow the project.", d: "See the history of project milestones, evidence, approvals, and updates.", icon: RouteIcon },
  { name: "TALA Public", tag: "Built for citizens.", d: "Provide an easy-to-understand public view without requiring an account or crypto wallet.", icon: Globe },
];

const LGU_CARDS = [
  { role: "LGU Administrators", d: "Organize project milestones and supporting evidence.", icon: Landmark },
  { role: "Auditors", d: "Review project history, evidence, audit activity, and verification status.", icon: Gavel },
  { role: "Citizens", d: "Explore public projects and independently verify published records.", icon: Eye },
];

const WHY = [
  { t: "Public", d: "Verification can be independently checked." },
  { t: "Verifiable", d: "Evidence commitments can be compared against the recorded commitment." },
  { t: "Efficient", d: "Only lightweight integrity information is anchored." },
  { t: "Independent", d: "Verification does not depend solely on TALA's internal database." },
];

const FAQ = [
  { q: "What is TALA?", a: "TALA is a civic-technology platform that helps Philippine LGUs publish public project milestones and create independently verifiable records of project evidence." },
  { q: "Is TALA a blockchain?", a: "No. TALA is a transparency and verification layer for public projects. It uses a public blockchain (Stellar) only as an integrity anchor for cryptographic commitments." },
  { q: "What does Stellar do?", a: "Stellar stores a small, lightweight integrity commitment (a SHA-256 fingerprint) so that a published evidence package can be independently checked against a public record." },
  { q: "Are government documents stored on blockchain?", a: "No. Sensitive documents remain off-chain. Only a cryptographic commitment and non-sensitive metadata are associated with the Stellar record." },
  { q: "Do citizens need a crypto wallet?", a: "No. Anyone can browse and verify public records without an account, crypto wallet, or blockchain knowledge." },
  { q: "Does an LGU need cryptocurrency?", a: "No. TALA is not a cryptocurrency product. LGUs do not buy, hold, or spend any cryptocurrency to use it." },
  { q: "Does TALA replace existing government systems?", a: "No. TALA does not replace accounting, procurement, or ERP systems. It is an added transparency and verification layer." },
  { q: "Can project records be updated after anchoring?", a: "Project information can continue to be updated, but any change to an attested evidence package will no longer match the commitment anchored earlier — which is exactly what verification detects." },
  { q: "What does blockchain verification actually prove?", a: "It proves the integrity of the specific attested evidence package. It does not by itself prove that the underlying government information is truthful or legally compliant." },
];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data));
    api.get("/projects", { params: { q: "San Isidro Barangay Road" } }).then((r) => {
      if (r.data?.length) setFeatured(r.data[0]);
    });
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-[#0B192C] overflow-hidden">
        <div className="absolute inset-0 isla-grid opacity-40" />
        <div
          className="absolute right-0 top-0 h-full w-1/2 hidden lg:block opacity-25"
          style={{
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "linear-gradient(to left, black, transparent)",
            WebkitMaskImage: "linear-gradient(to left, black, transparent)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl isla-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Integrity anchored to Stellar Testnet
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.03]">
              Public projects.
              <br />
              <span className="text-emerald-400">Verifiable records.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              TALA helps LGUs make public project information easier to understand, trace, and
              independently verify.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/projects" data-testid="hero-explore-cta" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0B192C] font-bold px-6 py-3 rounded-lg transition-colors">
                Explore Projects <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pilot" data-testid="hero-pilot-cta" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                Join the LGU Pilot
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-400">
              <span className="font-semibold text-white">Record → Trace → Anchor → Verify</span>
              {stats && (
                <>
                  <span>{stats.total_projects} public projects</span>
                  <span>{peso(stats.total_value)} tracked</span>
                  <span>{stats.verified_proofs} anchored proofs</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <SectionHeader eyebrow="How it works" title="From project milestone to public verification" sub="Simple enough for a mayor, city administrator, auditor, or citizen to follow." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-extrabold text-emerald-500">{s.n}</span>
                <s.icon className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="mt-4 font-bold text-[#0B192C] tracking-wide">{s.t}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl bg-[#0B192C] text-white p-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm font-semibold">
          {["LGU Project", "Evidence", "SHA-256", "Stellar", "Public Verification"].map((x, i) => (
            <span key={x} className="flex items-center gap-3 sm:gap-5">
              <span className={i === 4 ? "text-emerald-400" : ""}>{x}</span>
              {i < 4 && <ArrowRight className="h-4 w-4 text-slate-500" />}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-slate-50 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeader eyebrow="Features" title="Everything LGUs need to publish verifiable records" sub="Record the project. Trace the milestones. Anchor the evidence. Verify the record." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {FEATURES.map((f) => (
              <div key={f.name} data-testid={`feature-${f.name.replace(/\s+/g, "-").toLowerCase()}`} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-11 w-11 rounded-lg bg-[#0B192C] flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mt-4 font-extrabold text-[#0B192C]">{f.name}</h3>
                <p className="text-sm font-semibold text-emerald-700 mt-0.5">{f.tag}</p>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR LGUs */}
      <section id="for-lgus" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <SectionHeader eyebrow="Built for Philippine LGUs" title="One platform, three audiences" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {LGU_CARDS.map((c) => (
            <div key={c.role} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <c.icon className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-4 font-bold text-lg text-[#0B192C]">{c.role}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold text-[#0B192C]">
          <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No crypto wallet required</span>
          <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No blockchain knowledge required</span>
        </div>
      </section>

      {/* WHY STELLAR */}
      <section id="why-stellar" className="bg-[#0B192C] text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Why Stellar?</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
              A public integrity layer — not a cryptocurrency product
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              TALA uses Stellar as a public integrity layer. Sensitive documents remain off-chain
              while cryptographic commitments can be independently verified against a public
              blockchain record.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-xl bg-white/5 border border-white/10 p-5">
                <h3 className="font-bold text-emerald-400">{w.t}</h3>
                <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-amber-400/40 bg-amber-400/10 p-5 text-sm text-amber-100 leading-relaxed">
            <strong className="font-bold">Important:</strong> Blockchain verification proves the
            integrity of the attested evidence package. It does not by itself prove that the
            underlying government information is truthful or legally compliant.
          </div>
        </div>
      </section>

      {/* FEATURED DEMO PROJECT */}
      <section id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <SectionHeader eyebrow="Featured demo project" title="See a full verifiable project record" />
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm grid lg:grid-cols-5">
          <div
            className="lg:col-span-2 min-h-[220px] bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMG})` }}
          />
          <div className="lg:col-span-3 p-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500">Demo / Synthetic Data</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Verified on Stellar Testnet</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#0B192C] tracking-tight">
              San Isidro Barangay Road Rehabilitation Program
            </h3>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm">
              <Stat label="Project value" value="₱50,000,000" />
              <Stat label="Status" value="In Progress" />
              <Stat label="Progress" value="72%" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {["Budget Approved", "Procurement", "Contract Award", "Disbursement", "Implementation", "Inspection", "Completion"].map((x, i, a) => (
                <span key={x} className="flex items-center gap-1.5">
                  <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5">{x}</span>
                  {i < a.length - 1 && <ArrowRight className="h-3 w-3 text-slate-300" />}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {featured ? (
                <Link to={`/project/${featured.id}`} data-testid="demo-view-project">
                  <Button className="bg-[#0B192C] hover:bg-[#1E293B]">View project <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              ) : (
                <Link to="/projects"><Button className="bg-[#0B192C] hover:bg-[#1E293B]">View projects</Button></Link>
              )}
              <Link to="/verify" data-testid="demo-verify"><Button variant="outline"><ShieldCheck className="h-4 w-4" /> Verify a record</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* PILOT */}
      <section id="pilot" className="bg-slate-50 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeader eyebrow="Join the LGU Pilot" title="Be part of the TALA pilot program" sub="We are inviting Philippine LGUs and public institutions to explore a new way of making public project records easier to trace and independently verify." />
          <PilotForm />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <SectionHeader eyebrow="FAQ" title="Questions LGUs ask first" />
        <Accordion type="single" collapsible className="mt-8" data-testid="faq-accordion">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} data-testid={`faq-item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-[#0B192C]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl bg-[#0B192C] text-white p-10 sm:p-14 isla-grid relative overflow-hidden text-center">
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
                Let's make public projects easier to verify.
              </h2>
              <p className="mt-4 text-slate-300 max-w-xl mx-auto">
                For LGUs, government offices, civic organizations, and technology partners
                interested in exploring TALA.
              </p>
              <a href="#pilot" data-testid="contact-cta" className="mt-7 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0B192C] font-bold px-6 py-3 rounded-lg transition-colors">
                Contact Us <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{eyebrow}</div>
      <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B192C] leading-tight">{title}</h2>
      {sub && <p className="mt-3 text-slate-500 leading-relaxed">{sub}</p>}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-extrabold text-[#0B192C]">{value}</div>
    </div>
  );
}

const INTERESTS = ["Infrastructure Projects", "Public Spending", "Procurement", "Grants", "Other"];

function PilotForm() {
  const [form, setForm] = useState({
    full_name: "", position: "", organization: "", email: "", location: "", interest: "Infrastructure Projects", message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.organization || !form.email) {
      toast.error("Please fill in your name, organization, and email.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/pilot", form);
      setDone(true);
      toast.success("Pilot access request received. We'll be in touch.");
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div data-testid="pilot-success" className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
        <h3 className="mt-3 text-xl font-bold text-[#0B192C]">Request received</h3>
        <p className="mt-1 text-slate-600">Thank you for your interest in the TALA LGU pilot. We'll reach out to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="pilot-form">
      <Field label="Full Name"><Input data-testid="pilot-full-name" value={form.full_name} onChange={set("full_name")} placeholder="Juan Dela Cruz" /></Field>
      <Field label="Position"><Input data-testid="pilot-position" value={form.position} onChange={set("position")} placeholder="City Administrator" /></Field>
      <Field label="LGU / Organization"><Input data-testid="pilot-organization" value={form.organization} onChange={set("organization")} placeholder="City Government of…" /></Field>
      <Field label="Email"><Input data-testid="pilot-email" type="email" value={form.email} onChange={set("email")} placeholder="you@lgu.gov.ph" /></Field>
      <Field label="City / Municipality / Province"><Input data-testid="pilot-location" value={form.location} onChange={set("location")} placeholder="Naga City, Camarines Sur" /></Field>
      <Field label="Area of interest">
        <Select value={form.interest} onValueChange={(v) => setForm({ ...form, interest: v })}>
          <SelectTrigger data-testid="pilot-interest"><SelectValue /></SelectTrigger>
          <SelectContent>
            {INTERESTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Message">
          <Textarea data-testid="pilot-message" value={form.message} onChange={set("message")} placeholder="Tell us how your LGU would like to use TALA…" rows={4} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button data-testid="pilot-submit" type="submit" disabled={busy} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-[#0B192C] font-bold">
          {busy ? "Submitting…" : "Request Pilot Access"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
