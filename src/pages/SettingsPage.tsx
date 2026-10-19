import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button.tsx';
import { PasswordField } from '../components/ui/Fields.tsx';
import { ConfirmDialog } from '../components/ui/Modal.tsx';
import { Notice, PageHeader, Panel } from '../components/ui/Surface.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCare } from '../context/CareContext.tsx';
import { changePassword, exportScopedData, getUser, resetDemo, updatePreferences } from '../services/care.ts';
import type { NotificationPrefs } from '../types/models.ts';
import { downloadText, personName } from '../utils/text.ts';
import { passwordSchema, zodFormResolver, type PasswordValues } from '../utils/validators.ts';

export function SettingsPage() {
  const { data, refresh, textSize, setTextSize } = useCare();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({
    resolver: zodFormResolver(passwordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
  });
  if (!data) return null;
  const prefs = data.user.notificationPrefs;

  function savePrefs(next: NotificationPrefs) {
    updatePreferences(data!.user.id, next);
    refresh();
    toast.success('Notification preferences saved in this browser.');
  }

  const connections = data.user.role === 'patient'
    ? data.links.filter((link) => link.patientId === data.user.id).map((link) => `${personName(data.people, link.caregiverId)} · ${link.relationship}`)
    : data.user.role === 'caregiver'
      ? data.links.map((link) => `${personName(data.people, link.patientId)} · ${link.relationship}`)
      : data.patients.map((patient) => patient.name);

  return (
    <div className="grid gap-5">
      <PageHeader title="Settings" description="Preferences, password, and the people this demo account can open." />
      <Panel title="Notification preferences">
        <div className="grid gap-2 text-sm">
          <Pref label="Medication reminders" checked={prefs.medication} onChange={(medication) => savePrefs({ ...prefs, medication })} />
          <Pref label="Appointment reminders" checked={prefs.appointment} onChange={(appointment) => savePrefs({ ...prefs, appointment })} />
          <Pref label="Follow-up reminders" checked={prefs.followUp} onChange={(followUp) => savePrefs({ ...prefs, followUp })} />
        </div>
        <p className="mt-3 text-sm text-muted">These switches only hide reminders inside the app. They do not turn email or SMS on or off.</p>
      </Panel>
      <Panel title="Reading size">
        <div className="flex gap-2">
          <Button variant={textSize === 'comfortable' ? 'primary' : 'secondary'} onClick={() => setTextSize('comfortable')}>Comfortable</Button>
          <Button variant={textSize === 'large' ? 'primary' : 'secondary'} onClick={() => setTextSize('large')}>Large text</Button>
        </div>
      </Panel>
      <Panel title="Password">
        <form className="grid max-w-md gap-3" onSubmit={handleSubmit((values) => {
          const error = changePassword(data.user.id, values.current, values.next);
          if (error) {
            setMessage(error);
            return;
          }
          setMessage('Password updated for this browser demo.');
          reset();
          toast.success('Password updated in this browser.');
        })} noValidate>
          <PasswordField label="Current password" error={errors.current?.message} {...register('current')} />
          <PasswordField label="New password" error={errors.next?.message} {...register('next')} />
          <PasswordField label="Confirm new password" error={errors.confirm?.message} {...register('confirm')} />
          {message ? <p role="status" className="text-sm">{message}</p> : null}
          <Button type="submit">Change password</Button>
        </form>
      </Panel>
      <Panel title={data.user.role === 'doctor' ? 'Patients on your panel' : data.user.role === 'caregiver' ? 'Linked patients' : 'Caregivers with access'}>
        {connections.length === 0 ? <p className="text-sm text-muted">No one is linked yet. Invitations need an account service, which is not connected.</p> : (
          <ul className="grid gap-2 text-sm">{connections.map((item) => <li key={item} className="rounded-lg bg-foam px-3 py-2">{item}</li>)}</ul>
        )}
        <p className="mt-3 text-sm text-muted">Invite is unavailable until accounts live on a server.</p>
      </Panel>
      <Panel title="Privacy and this demo">
        <Notice>Frontend checks only hide screens. A real deployment must enforce access on the server. Resetting removes changes stored in this browser, including accounts you created here.</Notice>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadText('aarogya-loop-demo.json', exportScopedData(data.user.id))}>Download my demo data</Button>
          <Button variant="danger" onClick={() => setResetOpen(true)}>Reset demo data</Button>
          <Button variant="secondary" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
        </div>
      </Panel>
      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        body="Reminders, visits, and accounts created in this browser will be removed. Sample people return to their starting state. You will stay signed in if your account is one of the built-in samples."
        confirmLabel="Reset demo data"
        tone="danger"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          const userId = data.user.id;
          resetDemo();
          setResetOpen(false);
          if (!getUser(userId)) {
            logout();
            navigate('/login');
            toast.success('Demo data reset. That account existed only in this browser, so you have been signed out.');
            return;
          }
          refresh();
          toast.success('Demo data reset.');
        }}
      />
    </div>
  );
}

function Pref({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
