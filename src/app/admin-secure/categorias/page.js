'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, X, RefreshCw, AlertCircle, Save } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de Criação/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = criar novo
  
  // Campos do Formulário
  const [name, setName] = useState('');
  const [order, setOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (!data.error) {
        setCategories(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (category = null) => {
    setError('');
    if (category) {
      setEditingId(category.id);
      setName(category.name);
      setOrder(category.order.toString());
      setActive(category.active);
    } else {
      setEditingId(null);
      setName('');
      setOrder('0');
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          order: parseInt(order),
          active
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchCategories();
      } else {
        setError(data.error || 'Erro ao processar.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      try {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          fetchCategories();
        } else {
          alert(data.error || 'Erro ao excluir.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header do Painel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button className="btn-checkout" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }} onClick={() => openModal(null)}>
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {/* 2. Listagem de Categorias */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
            Buscando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Nome da Categoria</th>
                <th>URL Slug</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: '700' }}>#{cat.order}</td>
                  <td style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{cat.name}</td>
                  <td style={{ color: 'var(--neutral-500)' }}>{cat.slug}</td>
                  <td>
                    {cat.active ? (
                      <span className="status-badge status-paid">Ativa</span>
                    ) : (
                      <span className="status-badge status-cancelled">Oculta</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-detail" style={{ padding: '6px 10px' }} onClick={() => openModal(cat)}><Edit size={14} /></button>
                      <button className="btn-detail" style={{ padding: '6px 10px', color: 'var(--color-danger)' }} onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <div style={{ padding: '30px' }}>
              <h3 className="form-title" style={{ marginBottom: '20px' }}>
                {editingId ? 'Editar Categoria' : 'Criar Categoria'}
              </h3>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Nome da Categoria</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ex: Vestidos, Fitness, Calças..." 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ordem de Exibição (Número)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    placeholder="Ex: 1, 2, 3..." 
                    value={order} 
                    onChange={(e) => setOrder(e.target.value)} 
                  />
                  <span style={{ fontSize: '11px', color: 'var(--neutral-400)', marginTop: '2px' }}>Define a ordem de listagem no menu do site.</span>
                </div>

                <div className="form-group" style={{ marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      checked={active} 
                      onChange={(e) => setActive(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} 
                    />
                    Categoria Ativa (Exibir no menu e filtros)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-detail" style={{ padding: '14px' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-checkout" style={{ flex: 1, backgroundColor: 'var(--color-secondary)' }}>
                    {submitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
