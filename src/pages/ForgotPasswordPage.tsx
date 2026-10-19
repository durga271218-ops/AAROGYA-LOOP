import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthFrame } from './AuthFrame.tsx';
import { Button } from '../components/ui/Button.tsx';
import { TextField } from '../components/ui/Fields.tsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter the email address you would use to sign in.');
      setDone(false);
      return;
    }
    setError('');
    setDone(true);
  }

  return (
    <AuthFrame title="Forgot password" lede="Password reset email is not configured. Submitting this form does not send a message or change a password.">
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <TextField label="Email" type="email" autoComplete="email" value={email} error={error} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit">Request reset</Button>
      </form>
      {done ? (
        <p role="status" className="mt-4 rounded-lg bg-mint px-3 py-2 text-sm">
          No email was sent. In this demo, sign in with a sample password from the sign-in page, or with the password you chose for a browser-only account.
        </p>
      ) : null}
      <p className="mt-4 text-sm"><Link to="/login" className="font-semibold text-teal">Return to sign in</Link></p>
    </AuthFrame>
  );
}
