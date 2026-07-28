import { FormEvent, useState } from 'react';
import { BookOpenCheck, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../auth/supabase';

export default function AuthPage() {
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('');setNotice('');
    if(!isSupabaseConfigured){setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no frontend.');return;}
    if(password.length<6){setError('A senha precisa ter pelo menos 6 caracteres.');return;}
    setBusy(true);
    try{
      if(mode==='login'){
        const {error:authError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(authError)throw authError;
      }else{
        if(name.trim().length<2)throw new Error('Informe seu nome.');
        const {data,error:authError}=await supabase.auth.signUp({email:email.trim(),password,
          options:{data:{full_name:name.trim()}}});
        if(authError)throw authError;
        if(!data.session)setNotice('Cadastro realizado. Confira seu e-mail para confirmar a conta e depois entre.');
      }
    }catch(authError){setError(authError instanceof Error?authError.message:'Não foi possível autenticar.');}
    finally{setBusy(false);}
  };

  return <main className="auth-shell">
    <section className="auth-presentation">
      <div className="auth-brand"><span><BookOpenCheck/></span><strong>Gabarita Concursos</strong></div>
      <div className="auth-presentation-copy"><span className="auth-eyebrow"><Sparkles/> ESTUDO ADAPTATIVO</span><h1>Seu plano, seu ritmo, sua aprovação.</h1><p>Organize os assuntos, mantenha sua ofensiva e transforme cada sessão em progresso mensurável.</p></div>
      <div className="auth-benefits"><article><BookOpenCheck/><div><strong>Rotina conectada</strong><span>Conteúdo, revisão e cronograma no mesmo assunto.</span></div></article><article><LockKeyhole/><div><strong>Progresso privado</strong><span>Seus dados ficam vinculados à sua conta.</span></div></article></div>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div><span className="auth-mobile-logo"><BookOpenCheck/></span><p className="auth-kicker">BEM-VINDO AO GABARITA</p><h2>{mode==='login'?'Entre para continuar':'Crie sua conta'}</h2><p>{mode==='login'?'Retome sua sessão exatamente de onde parou.':'Comece seu plano de estudos personalizado.'}</p></div>
        {!isSupabaseConfigured&&<div className="auth-message is-error">Supabase ainda não foi configurado neste ambiente.</div>}
        {error&&<div role="alert" className="auth-message is-error">{error}</div>}
        {notice&&<div role="status" className="auth-message is-success">{notice}</div>}
        {mode==='signup'&&<label><span>Nome</span><div className="auth-input"><UserRound/><input autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Seu nome" required/></div></label>}
        <label><span>E-mail</span><div className="auth-input"><Mail/><input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@email.com" required/></div></label>
        <label><span>Senha</span><div className="auth-input"><LockKeyhole/><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>
        <button className="auth-submit" disabled={busy||!isSupabaseConfigured}>{busy?'Aguarde…':mode==='login'?'Entrar':'Criar conta'}</button>
        <p className="auth-switch">{mode==='login'?'Ainda não tem uma conta?':'Já possui uma conta?'} <button type="button" onClick={()=>{setMode(value=>value==='login'?'signup':'login');setError('');setNotice('');}}>{mode==='login'?'Cadastre-se':'Entrar'}</button></p>
      </form>
    </section>
  </main>;
}
