'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Check, HelpCircle } from 'lucide-react';
import { compressImage } from '@/lib/image-compress';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Campos de Configuração
  const [storeName, setStoreName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [minimumItems, setMinimumItems] = useState(6);
  const [minimumValue, setMinimumValue] = useState(0.00);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('TELEFONE');
  const [pixReceiverName, setPixReceiverName] = useState('');
  const [pixBank, setPixBank] = useState('');
  const [logo, setLogo] = useState('');
  const [qrCodePix, setQrCodePix] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [originCep, setOriginCep] = useState('');
  const [shippingMode, setShippingMode] = useState('FALLBACK');
  const [fallbackShippingFee, setFallbackShippingFee] = useState(20.00);
  const [primaryColor, setPrimaryColor] = useState('#881337');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [footerText, setFooterText] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (!data.error) {
          setStoreName(data.storeName || '');
          setWhatsapp(data.whatsapp || '');
          setInstagram(data.instagram || '');
          setEmail(data.email || '');
          setCnpj(data.cnpj || '');
          setAddress(data.address || '');
          setDescription(data.description || '');
          setMinimumItems(data.minimumItems || 6);
          setMinimumValue(data.minimumValue || 0.00);
          setPixKey(data.pixKey || '');
          setPixKeyType(data.pixKeyType || 'TELEFONE');
          setPixReceiverName(data.pixReceiverName || '');
          setPixBank(data.pixBank || '');
          setLogo(data.logo || '');
          setQrCodePix(data.qrCodePix || '');
          setOriginAddress(data.originAddress || '');
          setOriginCity(data.originCity || '');
          setOriginState(data.originState || '');
          setOriginCep(data.originCep || '');
          setShippingMode(data.shippingMode || 'FALLBACK');
          setFallbackShippingFee(data.fallbackShippingFee || 20.00);
          setPrimaryColor(data.primaryColor || '#881337');
          setSecondaryColor(data.secondaryColor || '#0f172a');
          setFooterText(data.footerText || '');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar configurações.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = async (e, type) => {
    let file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    if (type === 'qr') setUploadingQr(true);

    try {
      file = await compressImage(file, 800, 800, 0.85);
    } catch (err) {
      console.warn('Erro ao comprimir imagem de configurações:', err);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'logo') setLogo(data.url);
        if (type === 'qr') setQrCodePix(data.url);
      } else {
        alert(data.error || 'Erro ao realizar upload.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar imagem.');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      if (type === 'qr') setUploadingQr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const payload = {
      storeName,
      whatsapp,
      instagram,
      email,
      cnpj,
      address,
      description,
      minimumItems: parseInt(minimumItems),
      minimumValue: parseFloat(minimumValue),
      pixKey,
      pixKeyType,
      pixReceiverName,
      pixBank,
      logo,
      qrCodePix,
      originAddress,
      originCity,
      originState,
      originCep,
      shippingMode,
      fallbackShippingFee: parseFloat(fallbackShippingFee),
      primaryColor,
      secondaryColor,
      footerText,
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        // Recarregar a página após um curto delay para re-injetar os estilos CSS no Root Layout
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar configurações.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
        <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
        Carregando configurações da loja...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: 'var(--color-success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
          <Check size={16} />
          <span>Configurações salvas! Atualizando a identidade visual do site...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Seção 1: Identidade e Contato */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Identidade e Informações de Contato
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nome da Loja</label>
              <input type="text" required className="form-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="form-label">WhatsApp (com DDI/DDD)</label>
              <input type="text" required className="form-input" placeholder="Ex: 5581998609447" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Logo da Loja (Upload)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  className="form-input" 
                  onChange={(e) => handleImageUpload(e, 'logo')} 
                />
                {logo && <img src={logo} alt="Preview Logo" style={{ height: '38px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} />}
              </div>
              {uploadingLogo && <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>Enviando imagem...</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Instagram (apenas usuário)</label>
              <input type="text" className="form-input" placeholder="Ex: instagram_da_loja" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">E-mail de Contato</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">CNPJ (Opcional)</label>
                <input type="text" className="form-input" placeholder="Ex: 12.345.678/0001-99" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pedido Mínimo (Peças)</label>
                <input type="number" required className="form-input" value={minimumItems} onChange={(e) => setMinimumItems(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pedido Mínimo (Valor R$)</label>
                <input type="number" step="0.01" required className="form-input" value={minimumValue} onChange={(e) => setMinimumValue(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Endereço Físico</label>
            <input type="text" className="form-input" placeholder="Ex: Rua Silva Teles, 150 - Brás, São Paulo - SP" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Descrição Curta da Loja (Sobre)</label>
            <textarea className="form-textarea" rows={3} placeholder="Descreva brevemente a história ou foco da sua loja..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Seção 2: Configuração do Pix */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Configurações de Recebimento Pix
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Tipo de Chave Pix</label>
              <select className="form-select" value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)}>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="TELEFONE">Telefone</option>
                <option value="ALEATORIA">Chave Aleatória (EVP)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Chave Pix</label>
              <input type="text" required className="form-input" placeholder="Digite sua chave Pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Nome Completo do Recebedor</label>
              <input type="text" required className="form-input" placeholder="Nome titular da conta bancária" value={pixReceiverName} onChange={(e) => setPixReceiverName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Banco do Recebedor (Opcional)</label>
              <input type="text" className="form-input" placeholder="Ex: Itaú, Nubank, Bradesco..." value={pixBank} onChange={(e) => setPixBank(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Imagem QR Code Pix (Upload)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*"
                className="form-input" 
                onChange={(e) => handleImageUpload(e, 'qr')} 
              />
              {qrCodePix && <img src={qrCodePix} alt="Preview QR Code" style={{ height: '38px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }} />}
            </div>
            {uploadingQr && <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>Enviando imagem...</span>}
          </div>
        </div>

        {/* Seção 2.5: Configurações de Origem e Frete */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Configurações de Origem e Frete dos Correios
          </h3>

          <div className="form-grid">
            <div className="form-group" style={{ flex: '3' }}>
              <label className="form-label">Endereço de Origem (para postagem)</label>
              <input type="text" required className="form-input" placeholder="Ex: Rua Principal, 100" value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: '1' }}>
              <label className="form-label">CEP de Origem</label>
              <input type="text" required className="form-input" placeholder="Ex: 55190-000" value={originCep} onChange={(e) => setOriginCep(e.target.value)} />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Cidade de Origem</label>
              <input type="text" required className="form-input" value={originCity} onChange={(e) => setOriginCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Estado de Origem</label>
              <input type="text" required maxLength={2} className="form-input" value={originState} onChange={(e) => setOriginState(e.target.value)} />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Modo de Cálculo de Frete</label>
              <select className="form-select" value={shippingMode} onChange={(e) => setShippingMode(e.target.value)}>
                <option value="FALLBACK">Correios Simulado / Tabela Regional</option>
                <option value="FIXO">Valor de Envio Fixo (Geral)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Valor do Frete Fixo / Fallback (R$)</label>
              <input type="number" step="0.01" required className="form-input" value={fallbackShippingFee} onChange={(e) => setFallbackShippingFee(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Seção 3: Design e Identidade Visual (Cores) */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Identidade Visual (Cores da Marca)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--neutral-200)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)} 
                style={{ width: '44px', height: '44px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              />
              <div>
                <span className="form-label" style={{ display: 'block', fontSize: '13px' }}>Cor Principal (Destaques)</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--neutral-500)' }}>{primaryColor}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--neutral-200)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <input 
                type="color" 
                value={secondaryColor} 
                onChange={(e) => setSecondaryColor(e.target.value)} 
                style={{ width: '44px', height: '44px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              />
              <div>
                <span className="form-label" style={{ display: 'block', fontSize: '13px' }}>Cor Secundária (Fundo/Headers)</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--neutral-500)' }}>{secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 4: Configuração Adicional Rodapé */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Rodapé do Site
          </h3>
          <div className="form-group">
            <label className="form-label">Texto de Direitos Autorais (Footer)</label>
            <input type="text" className="form-input" placeholder="Ex: © 2026 Minha Loja Atacado. Todos os direitos reservados." value={footerText} onChange={(e) => setFooterText(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-checkout" style={{ padding: '16px', fontSize: '15px', backgroundColor: 'var(--color-secondary)' }}>
          <Save size={18} style={{ marginRight: '6px' }} /> {saving ? 'Salvando Configurações...' : 'Salvar Configurações'}
        </button>

      </form>
    </div>
  );
}
