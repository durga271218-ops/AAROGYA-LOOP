import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button.tsx';
import { TextField } from '../components/ui/Fields.tsx';
import { PageHeader, Panel } from '../components/ui/Surface.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCare } from '../context/CareContext.tsx';
import { updateProfile } from '../services/care.ts';
import { ageFrom, formatDate } from '../utils/dates.ts';
import { profileSchema, zodFormResolver, type ProfileValues } from '../utils/validators.ts';

export function ProfilePage() {
  const { data, refresh } = useCare();
  const { user } = useAuth();
  const profile = data?.user ?? user;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodFormResolver(profileSchema),
    values: profile ? { name: profile.name, phone: profile.phone, city: profile.city } : undefined,
  });
  if (!profile || !data) return null;

  return (
    <div className="grid gap-5">
      <PageHeader title="Profile" description="Details stored with this demo account in the browser." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Personal information">
          <form className="grid gap-3" onSubmit={handleSubmit((values) => {
            updateProfile(profile.id, values);
            refresh();
            toast.success('Profile saved in this browser.');
          })} noValidate>
            <TextField label="Full name" error={errors.name?.message} {...register('name')} />
            <TextField label="Email" value={profile.email} readOnly hint="Email stays fixed so the demo sign-in remains recognizable." />
            <TextField label="Phone" error={errors.phone?.message} {...register('phone')} />
            <TextField label="City" error={errors.city?.message} {...register('city')} />
            <Button type="submit" disabled={isSubmitting}>Save profile</Button>
          </form>
        </Panel>
        <Panel title="Account">
          <dl className="grid gap-2 text-sm">
            <div><dt className="font-semibold text-navy">Role</dt><dd className="capitalize">{profile.role}</dd></div>
            {profile.dateOfBirth ? <div><dt className="font-semibold text-navy">Date of birth</dt><dd>{formatDate(profile.dateOfBirth)} · {ageFrom(profile.dateOfBirth)} years</dd></div> : null}
            {profile.specialty ? <div><dt className="font-semibold text-navy">Specialty</dt><dd>{profile.specialty}. Not verified.</dd></div> : null}
            {profile.registrationNumber ? <div><dt className="font-semibold text-navy">Registration number</dt><dd>{profile.registrationNumber}. Not checked against a registry.</dd></div> : null}
            {profile.relationship ? <div><dt className="font-semibold text-navy">Relationship</dt><dd>{profile.relationship}</dd></div> : null}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
