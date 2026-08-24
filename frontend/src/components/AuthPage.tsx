import { FormEvent, useState } from 'react';
import { BookOpenCheck, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../auth/supabase';
import { AUTH_LOGOUT_REASON_KEY } from '../auth/inactivity';

const initialSessionNotice = () => {
  const reason = sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);
  sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
  if (reason === 'inactivity')
    return 'Sua sessão foi encerrada após um período de inatividade. Entre novamente para continuar.';
  if (reason === 'restore-timeout')
    return 'A sessão anterior demorou para responder e foi encerrada. Entre novamente para continuar.';
  return '';
};

const authenticationErrorMessage = (cause: unknown) => {
  const error = cause as Partial<AuthError> | undefined;
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').trim();
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'E-mail ou senha incorretos.';
  }
  if (
    (cause instanceof Error && isAuthRetryableFetchError(cause as AuthError)) ||
    /failed to fetch|network|timeout|timed out/i.test(message)
  ) {
    return 'Não foi possível conectar agora. Confira sua internet e tente novamente.';
  }
  if (message) return message;
  if (cause && typeof cause === 'object') {
    const record = cause as Record<string, unknown>;
    for (const key of ['message', 'error_description', 'details', 'hint']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim() && value.trim() !== '{}') {
        return value.trim();
      }
    }
  }
  return 'Não foi possível concluir o cadastro. Verifique se o e-mail ainda existe e tente novamente.';
};

const wait = (milliseconds: number) => new Promise<void>(resolve => window.setTimeout(resolve, milliseconds));

const signInWithRetry = async (email: string, password: string) => {
  for (let attempt = 0; ; attempt += 1) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return;
    if (attempt === 0 && isAuthRetryableFetchError(error)) {
      await wait(500);
      continue;
    }
    throw error;
  }
};

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialSessionNotice);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!isSupabaseConfigured) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no frontend.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithRetry(email.trim(), password);
      } else {
        if (name.trim().length < 2) throw new Error('Informe seu nome.');
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;
        if (!data.session)
          setNotice(
            'Confira seu e-mail para confirmar a conta. Se ela já existia, entre ou solicite a redefinição de senha.'
          );
      }
    } catch (authError) {
      setError(authenticationErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-presentation">
        <div className="auth-brand">
          <span>
            <BookOpenCheck />
          </span>
          <strong>Gabarita Concursos</strong>
        </div>
        <div className="auth-presentation-copy">
          <span className="auth-eyebrow">
            <Sparkles /> ESTUDO ADAPTATIVO
          </span>
          <h1>Seu plano, seu ritmo, sua aprovação.</h1>
          <p>Organize os assuntos, mantenha sua ofensiva e transforme cada sessão em progresso mensurável.</p>
        </div>
        <div className="auth-benefits">
          <article>
            <BookOpenCheck />
            <div>
              <strong>Rotina conectada</strong>
              <span>Conteúdo, revisão e cronograma no mesmo assunto.</span>
            </div>
          </article>
          <article>
            <LockKeyhole />
            <div>
              <strong>Progresso privado</strong>
              <span>Seus dados ficam vinculados à sua conta.</span>
            </div>
          </article>
        </div>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-heading">
            <div className="auth-mobile-brand" aria-label="Gabarita Concursos">
              <span className="auth-mobile-logo" aria-hidden="true">
                <BookOpenCheck />
              </span>
              <strong>Gabarita Concursos</strong>
            </div>
            <p className="auth-kicker">BEM-VINDO AO GABARITA</p>
            <h2>{mode === 'login' ? 'Entre para continuar' : 'Crie sua conta'}</h2>
            <p>
              {mode === 'login'
                ? 'Retome sua sessão exatamente de onde parou.'
                : 'Comece seu plano de estudos personalizado.'}
            </p>
          </div>
          {!isSupabaseConfigured && (
            <div className="auth-message is-error">Supabase ainda não foi configurado neste ambiente.</div>
          )}
          {error && (
            <div role="alert" className="auth-message is-error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="auth-message is-success">
              {notice}
            </div>
          )}
          {mode === 'signup' && (
            <label>
              <span>Nome</span>
              <div className="auth-input">
                <UserRound />
                <input
                  autoComplete="name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            </label>
          )}
          <label>
            <span>E-mail</span>
            <div className="auth-input">
              <Mail />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>
          </label>
          <label>
            <span>Senha</span>
            <div className="auth-input">
              <LockKeyhole />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>
          <button className="auth-submit" disabled={busy || !isSupabaseConfigured}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <p className="auth-switch">
            {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(value => (value === 'login' ? 'signup' : 'login'));
                setError('');
                setNotice('');
              }}
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
