'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Se já estiver logado, redireciona automático
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          router.push('/admin-secure');
        }
      } catch (err) {
        // Ignora erro
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin-secure');
      } else {
        setError(data.error || 'Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--neutral-100)' }}>
        <p style={{ color: 'var(--neutral-500)', fontSize: '15px', fontWeight: '500' }}>Verificando sessão ativa...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--neutral-100)', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '100%', border: '1px solid var(--neutral-200)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', width: '48px', height: '48px', backgroundColor: 'var(--neutral-100)', color: 'var(--color-primary)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Lock size={22} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--neutral-800)' }}>Acesso Restrito</h2>
          <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '4px' }}>Digite suas credenciais administrativas</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
              <input 
                type="email" 
                required 
                className="form-input" 
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="seuemail@provedor.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
              <input 
                type="password" 
                required 
                className="form-input" 
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-checkout"
            style={{ width: '100%', marginTop: '10px', backgroundColor: 'var(--color-secondary)' }}
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
