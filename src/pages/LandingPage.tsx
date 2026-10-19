import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.tsx';
import { ButtonLink, buttonClass } from '../components/ui/Button.tsx';

const nav = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#for-patients', label: 'For Patients' },
  { href: '#for-doctors', label: 'For Doctors' },
  { href: '#for-caregivers', label: 'For Caregivers' },
];

const features = [
  {
    index: '01',
    title: 'Medication reminders',
    body: 'See the day’s schedule by time. Record a reminder as taken, skipped, or missed. That status is what someone selected — it is not proof a dose was swallowed.',
  },
  {
    index: '02',
    title: 'Appointments',
    body: 'Keep upcoming, completed, cancelled, and rescheduled visits in a calendar and a list. Moving or cancelling a visit asks for confirmation first.',
  },
  {
    index: '03',
    title: 'Prescriptions',
    body: 'Read the sample list, the clinician, and the date. An upload flow is ready for a real scanner later. In this demo, nothing is read from the file or medically verified.',
  },
  {
    index: '04',
    title: 'Follow-ups',
    body: 'The next check-in stays on a timeline, tied to the visit or prescription that prompted it, until someone records it as done.',
  },
];

const steps = [
  { title: 'Open the right view', body: 'Patients, clinicians, and caregivers each sign in to a view limited to the people they are linked with.' },
  { title: 'Keep one loop current', body: 'Reminders, visits, prescriptions, and follow-ups sit together so the next action is visible.' },
  { title: 'Close the follow-up', body: 'When the check-in happens, mark it complete and leave a note about what comes next.' },
];

const audiences = [
  {
    id: 'for-patients',
    kicker: 'For patients',
    title: 'Know what today actually asks of you.',
    points: ['A schedule of reminders, not a pile of paper.', 'The next visit and why it was booked.', 'A place to keep prescription copies you uploaded yourself.'],
  },
  {
    id: 'for-doctors',
    kicker: 'For clinicians',
    title: 'A panel, not every record in the system.',
    points: ['Only patients assigned to you are opened.', 'Today’s visits and follow-ups that still need a look.', 'A demo prescription entry that is never described as a pharmacy order.'],
  },
  {
    id: 'for-caregivers',
    kicker: 'For caregivers',
    title: 'Help without losing track of who you are updating.',
    points: ['Switch between linked people, with the name kept in view.', 'Record a reminder status only for someone linked to you.', 'See overdue follow-ups before the day gets away.'],
  },
  {
    id: 'for-older-adults',
    kicker: 'For older adults',
    title: 'A calmer view, with a person alongside.',
    points: ['Readable type, with a larger-text setting in the app.', 'A caregiver can watch the same schedule when access is granted.', 'No extra clinical claims hiding in the interface.'],
  },
];

const faqs = [
  {
    q: 'Does Aarogya Loop diagnose or treat?',
    a: 'No. It coordinates reminders, visits, documents, and follow-ups. It is not an emergency service and it does not give medical advice.',
  },
  {
    q: 'Are the people in the demo real?',
    a: 'No. Aarav Mehta, Lakshmi Nair, Priya Mehta, and Ananya Shah are sample identities. Their records were written for this demo.',
  },
  {
    q: 'If I mark a reminder as taken, was the medicine taken?',
    a: 'Not necessarily. The app stores the status you chose. It cannot know whether a dose was actually consumed.',
  },
  {
    q: 'Does choosing “Doctor” verify a clinician?',
    a: 'No. The role only changes which demo screens you see. A registration number entered here is not checked against any medical council.',
  },
  {
    q: 'Will I get SMS, email, or push alerts?',
    a: 'Not from this demo. You can ask the browser for an on-screen alert after you choose to enable it. No message is sent in the background.',
  },
];

export function LandingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-foam text-ink">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-20 border-b border-line bg-foam/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo />
          <nav aria-label="Page" className="ml-6 hidden items-center gap-5 lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-navy">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link to="/login" className="px-3 text-sm font-semibold text-navy">Sign in</Link>
            <ButtonLink to="/register">Get Started</ButtonLink>
          </div>
          <button type="button" className="ml-auto grid h-11 w-11 place-items-center lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden">
          <div className="ml-auto flex h-full w-72 flex-col gap-4 bg-foam p-5">
            <button type="button" aria-label="Close menu" className="self-end" onClick={() => setOpen(false)}><X /></button>
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="font-semibold text-navy">{item.label}</a>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
            <ButtonLink to="/register">Get Started</ButtonLink>
          </div>
        </div>
      ) : null}
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">Healthcare coordination</p>
            <h1 className="mt-3 max-w-xl text-5xl leading-[1.05] text-navy sm:text-6xl">Connected care, from prescription to follow-up.</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Aarogya Loop keeps medications, appointments, prescriptions, and follow-ups in one place for a patient, their clinician, and the person helping at home.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to="/register">Get Started</ButtonLink>
              <a href="#features" className={buttonClass('secondary')}>Explore Features</a>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted">Sample records in this demo stay in your browser. The product does not diagnose, prescribe, or replace emergency care.</p>
          </div>
          <Preview />
        </section>

        <section id="features" className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-4xl text-navy">The loop, kept visible.</h2>
              <p className="mt-3 text-muted">Four jobs the product is actually for. Each one stays tied to a person you are allowed to see.</p>
            </div>
            <ol className="divide-y divide-line">
              {features.map((feature) => (
                <li key={feature.index} className="grid grid-cols-[3rem_1fr] gap-4 py-5">
                  <span className="font-display text-2xl text-teal">{feature.index}</span>
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-navy">{feature.title}</h3>
                    <p className="mt-1 text-muted">{feature.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how-it-works" className="bg-sand">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-4xl text-navy">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t-2 border-teal pt-4">
                  <p className="text-sm font-semibold text-teal">Step {index + 1}</p>
                  <h3 className="mt-2 font-sans text-xl font-semibold text-navy">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {audiences.map((audience, index) => (
          <section key={audience.id} id={audience.id} className={index % 2 ? 'bg-white' : 'bg-foam'}>
            <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-14 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">{audience.kicker}</p>
                <h2 className="mt-2 text-4xl text-navy">{audience.title}</h2>
              </div>
              <ul className="grid gap-3">
                {audience.points.map((point) => (
                  <li key={point} className="rounded-lg border border-line bg-white px-4 py-3">{point}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <section id="privacy" className="border-y border-line bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="text-4xl">Privacy, stated plainly.</h2>
              <p className="mt-3 text-white/80">Health information is sensitive. This demo is honest about what it can and cannot protect.</p>
            </div>
            <ul className="grid gap-3 text-sm leading-6">
              <li>Each signed-in person sees only the sample records their role is allowed to open.</li>
              <li>Screens hide records that belong on someone else’s panel, including another clinician’s patients.</li>
              <li>Demo data is stored in this browser. Clearing site data removes it. Nothing is sent to a server unless you later connect one.</li>
              <li>A production system still needs the server to enforce access. These screens are not that enforcement.</li>
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-4xl text-navy">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {faqs.map((item) => (
              <details key={item.q} className="py-4">
                <summary className="cursor-pointer font-semibold text-navy">{item.q}</summary>
                <p className="mt-2 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted">Connected care, from prescription to follow-up.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Product</p>
            <ul className="mt-2 grid gap-1 text-sm">
              {nav.map((item) => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}
              <li><a href="#for-older-adults">For older adults</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Account</p>
            <ul className="mt-2 grid gap-1 text-sm">
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Create a demo account</Link></li>
              <li><Link to="/forgot-password">Forgot password</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Boundary</p>
            <p className="mt-2 text-sm text-muted">No hospital partnership, certification, or patient outcome is claimed here. If someone is in danger, contact local emergency services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Preview() {
  const rows = [
    ['8:00 am', 'Amlodipine 5 mg', 'Not recorded'],
    ['9:00 am', 'Vitamin D 1000 IU', 'Personal reminder'],
    ['10:30 am', 'Follow-up conversation', 'Tomorrow'],
  ];
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">Sample interface</p>
          <p className="font-display text-2xl text-navy">Today for Aarav</p>
        </div>
        <span className="rounded-md bg-amber-bg px-2 py-1 text-xs font-semibold text-amber">2 need a status</span>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map(([time, title, state]) => (
          <li key={title} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm text-muted">{time}</p>
              <p className="font-semibold text-navy">{title}</p>
            </div>
            <span className="text-sm text-muted">{state}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
