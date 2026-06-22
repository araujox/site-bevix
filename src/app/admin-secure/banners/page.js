'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, X, Upload, ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { compressImage } from '@/lib/image-compress';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = criar novo

  // Campos do Formulário
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [active, setActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      if (!data.error) {
        setBanners(data);
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
    fetchBanners();
  }, [fetchBanners]);

  const openModal = (banner = null) => {
    setError('');
    if (banner) {
      setEditingId(banner.id);
      setTitle(banner.title || '');
      setSubtitle(banner.subtitle || '');
      setImage(banner.image);
      setButtonText(banner.buttonText || '');
      setButtonLink(banner.buttonLink || '');
      setActive(banner.active);
    } else {
      setEditingId(null);
      setTitle('');
      setSubtitle('');
      setImage('');
      setButtonText('');
      setButtonLink('');
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    let file = files[0];
    try {
      file = await compressImage(file, 1920, 1080, 0.8);
    } catch (err) {
      console.warn('Erro ao comprimir imagem do banner:', err);
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImage(data.url);
      } else {
        alert(data.error || 'Erro no upload.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar imagem do banner.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!image) {
      setError('A imagem do banner é obrigatória.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title,
      subtitle,
      image,
      buttonText,
      buttonLink,
      active
    };

    try {
      const url = editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchBanners();
      } else {
        setError(data.error || 'Erro ao processar banner.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir este banner?')) {
      try {
        const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          fetchBanners();
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
          <Plus size={16} /> Novo Banner
        </button>
      </div>

      {/* 2. Listagem de Banners */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
            Buscando banners...
          </div>
        ) : banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            Nenhum banner cadastrado.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {banners.map((b) => (
              <div key={b.id} style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: 'var(--neutral-100)' }}>
                  <img src={b.image} alt={b.title || 'Banner'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className={`status-badge ${b.active ? 'status-paid' : 'status-cancelled'}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {b.active ? 'Ativo' : 'Oculto'}
                  </span>
                </div>
                
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--neutral-800)' }}>{b.title || 'Sem título'}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--neutral-500)', lineHeight: '1.4', flex: 1 }}>{b.subtitle || 'Sem subtítulo'}</p>
                  
                  {b.buttonText && (
                    <div style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: '600', marginTop: '6px' }}>
                      Botão: "{b.buttonText}" → Link: "{b.buttonLink || '#'}"
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--neutral-100)', paddingTop: '12px', marginTop: '12px' }}>
                    <button className="btn-detail" style={{ flex: 1, padding: '8px' }} onClick={() => openModal(b)}>Editar</button>
                    <button className="btn-detail" style={{ padding: '8px', color: 'var(--color-danger)' }} onClick={() => handleDelete(b.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <div style={{ padding: '30px' }}>
              <h3 className="form-title" style={{ marginBottom: '20px' }}>
                {editingId ? 'Editar Banner' : 'Criar Novo Banner'}
              </h3>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Título do Banner</label>
                  <input type="text" className="form-input" placeholder="Ex: Lançamentos Outono/Inverno" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Subtítulo (Descrição)</label>
                  <input type="text" className="form-input" placeholder="Ex: Peças exclusivas a partir de R$ 29,90 no atacado" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Texto do Botão (Opcional)</label>
                    <input type="text" className="form-input" placeholder="Ex: Ver Coleção" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link do Botão (Opcional)</label>
                    <input type="text" className="form-input" placeholder="Ex: #produtos" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} />
                  </div>
                </div>

                {/* Upload de Imagem */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', border: '1px solid var(--neutral-200)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Imagem do Banner</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <label className="btn-detail" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', width: 'fit-content' }}>
                        <Upload size={16} /> 
                        {uploadingImage ? 'Enviando...' : 'Selecionar Imagem'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                  
                  {image ? (
                    <div style={{ position: 'relative', width: '100%', height: '90px', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={image} alt="Preview Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setImage('')} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '90px', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-300)' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    Banner Ativo (Exibir no carrossel)
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
