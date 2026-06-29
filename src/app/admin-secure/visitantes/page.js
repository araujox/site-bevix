'use client';

import { useState, useEffect } from 'react';
import { Search, Phone, Calendar, MapPin, Users, RefreshCw } from 'lucide-react';

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/visitors');
      if (res.ok) {
        const data = await res.json();
        setVisitors(data);
      }
    } catch (err) {
      console.error('Erro ao buscar visitantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Filtrar visitantes por termo de busca
  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.whatsapp.includes(searchTerm) ||
    v.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neutral-800)' }}>Registro de Visitantes (Leads)</h2>
          <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '2px' }}>
            Acompanhe em tempo real quem acessou o catálogo e coletou dados de contato.
          </p>
        </div>
        <button 
          onClick={fetchVisitors} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid var(--neutral-300)', backgroundColor: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Stats Summary & Search */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Total Views Card */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#ffe4e6', color: 'var(--color-primary, #e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Visualizações Reais</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--neutral-800)', marginTop: '2px' }}>{visitors.length}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nome, whatsapp ou cidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Visitor List Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--neutral-200)', overflow: 'hidden' }}>
        {loading && visitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--neutral-500)' }}>
            Carregando lista de visitantes...
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--neutral-500)' }}>
            Nenhum visitante encontrado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--neutral-600)' }}>Nome do Visitante</th>
                  <th style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--neutral-600)' }}>WhatsApp</th>
                  <th style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--neutral-600)' }}>Cidade / Local</th>
                  <th style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--neutral-600)' }}>Data do Acesso</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} style={{ borderBottom: '1px solid var(--neutral-100)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--neutral-800)' }}>{visitor.name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <a 
                        href={`https://wa.me/${visitor.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#25d366', fontWeight: '600', textDecoration: 'none' }}
                      >
                        <Phone size={13} /> {visitor.whatsapp}
                      </a>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--neutral-600)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--neutral-400)' }} /> {visitor.city}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--neutral-600)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: 'var(--neutral-400)' }} /> {formatDate(visitor.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
