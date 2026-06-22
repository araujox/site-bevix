'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit, Trash2, Upload, X, Star, RefreshCw, 
  Search, Eye, EyeOff, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { compressImage } from '@/lib/image-compress';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Estados do Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = criar novo
  
  // Campos do Formulário
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [sizes, setSizes] = useState('P,M,G');
  const [colors, setColors] = useState('Preto,Branco');
  const [featured, setFeatured] = useState(false);
  const [plusSize, setPlusSize] = useState(false);
  const [active, setActive] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [useColorStock, setUseColorStock] = useState(false);
  const [colorStockMap, setColorStockMap] = useState({});
  const [useSizePrices, setUseSizePrices] = useState(false);
  const [sizePricesMap, setSizePricesMap] = useState({});
  const [sizePromoPricesMap, setSizePromoPricesMap] = useState({});

  // Propriedades extras salvas no JSON variations
  const [shortDesc, setShortDesc] = useState('');
  const [veste, setVeste] = useState('');
  const [tecido, setTecido] = useState('');
  const [gramatura, setGramatura] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [observacao, setObservacao] = useState('');

  // Estados de Upload
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // --- 1. Carregar Dados do Servidor ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData);
        setCategories(catData);
      } else {
        setError('Erro ao buscar dados de produtos/categorias.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Abrir Modal de Edição ou Criação ---
  const openModal = (product = null) => {
    setError('');
    if (product) {
      // Editar
      setEditingId(product.id);
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.categoryId);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setPromotionalPrice(product.promotionalPrice ? product.promotionalPrice.toString() : '');
      setStock(product.stock);
      setSizes(product.sizes);
      setColors(product.colors);
      setFeatured(product.featured);
      setPlusSize(product.plusSize || false);
      setActive(product.active);
      setMainImage(product.mainImage);
      setGalleryImages(product.images?.map(img => img.url) || []);

      // Deserializar variations JSON
      let parsed = { veste: '', tecido: '', gramatura: '', caracteristicas: [], observacao: '', descricaoCurta: '', colorStock: null };
      if (product.variations) {
        try {
          parsed = JSON.parse(product.variations);
        } catch (e) {
          parsed.observacao = product.variations;
        }
      }
      setVeste(parsed.veste || '');
      setShortDesc(parsed.descricaoCurta || '');
      setTecido(parsed.tecido || '');
      setGramatura(parsed.gramatura || '');
      setCaracteristicas(Array.isArray(parsed.caracteristicas) ? parsed.caracteristicas.join(', ') : '');
      setObservacao(parsed.observacao || '');

      if (parsed.colorStock) {
        setUseColorStock(true);
        setColorStockMap(parsed.colorStock);
      } else {
        setUseColorStock(false);
        setColorStockMap({});
      }

      if (parsed.useSizePrices) {
        setUseSizePrices(true);
        setSizePricesMap(parsed.sizePrices || {});
        setSizePromoPricesMap(parsed.sizePromotionalPrices || {});
      } else {
        setUseSizePrices(false);
        setSizePricesMap({});
        setSizePromoPricesMap({});
      }
    } else {
      // Criar Novo
      setEditingId(null);
      setName('');
      setSku('');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setPrice('');
      setPromotionalPrice('');
      setStock(10);
      setSizes('P,M,G');
      setColors('Preto,Branco');
      setFeatured(false);
      setPlusSize(false);
      setActive(true);
      setMainImage('');
      setGalleryImages([]);

      setVeste('');
      setShortDesc('');
      setTecido('');
      setGramatura('');
      setCaracteristicas('');
      setObservacao('');
      setUseColorStock(false);
      setColorStockMap({});
      setUseSizePrices(false);
      setSizePricesMap({});
      setSizePromoPricesMap({});
    }
    setIsModalOpen(true);
  };

  // --- 3. Enviar Formulário (Salvar / Criar) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mainImage) {
      setError('A imagem principal do produto é obrigatória.');
      return;
    }

    const activeColors = colors.split(',').map(c => c.trim()).filter(Boolean);
    let finalColorStock = null;
    let finalStock = parseInt(stock);

    if (useColorStock) {
      finalColorStock = {};
      let totalCalculatedStock = 0;
      activeColors.forEach(c => {
        const qty = colorStockMap[c] !== undefined ? colorStockMap[c] : 0;
        finalColorStock[c] = qty;
        totalCalculatedStock += qty;
      });
      finalStock = totalCalculatedStock;
    }

    const serializedVariations = JSON.stringify({
      veste,
      tecido,
      gramatura,
      descricaoCurta: shortDesc,
      caracteristicas: caracteristicas.split(',').map(c => c.trim()).filter(Boolean),
      observacao,
      colorStock: finalColorStock,
      useSizePrices,
      sizePrices: useSizePrices ? sizePricesMap : null,
      sizePromotionalPrices: useSizePrices ? sizePromoPricesMap : null
    });

    const payload = {
      name,
      sku,
      categoryId,
      description,
      price: parseFloat(price),
      promotionalPrice: promotionalPrice ? parseFloat(promotionalPrice) : null,
      stock: finalStock,
      sizes,
      colors,
      variations: serializedVariations,
      featured,
      plusSize,
      active,
      mainImage,
      galleryImages
    };

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(data.error || 'Erro ao salvar produto.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao salvar.');
    }
  };

  // --- 4. Excluir Produto ---
  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir este produto? Esta ação não pode ser desfeita.')) {
      try {
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          fetchData();
        } else {
          alert(data.error || 'Erro ao excluir produto.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro de conexão.');
      }
    }
  };

  // --- 5. Upload de Arquivos Local ---
  const handleFileUpload = async (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
      setUploadingMain(true);
      let file = files[0];
      try {
        file = await compressImage(file);
      } catch (err) {
        console.warn('Erro ao comprimir imagem principal:', err);
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
          setMainImage(data.url);
        } else {
          alert(data.error || 'Erro no upload.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao enviar imagem.');
      } finally {
        setUploadingMain(false);
      }
    } else {
      setUploadingGallery(true);
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        try {
          file = await compressImage(file);
        } catch (err) {
          console.warn('Erro ao comprimir imagem da galeria:', err);
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
            uploadedUrls.push(data.url);
          }
        } catch (err) {
          console.error(err);
        }
      }

      setGalleryImages(prev => [...prev, ...uploadedUrls]);
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // Quick Toggles
  const toggleFeatured = async (product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrar lista de produtos localmente na pesquisa
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, SKU, categoria..." 
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn-checkout" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }} onClick={() => openModal(null)}>
          <Plus size={16} /> Cadastrar Produto
        </button>
      </div>

      {/* 2. Listagem de Produtos */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
            Buscando produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            Nenhum produto cadastrado ou correspondente.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Plus Size</th>
                  <th>Destaque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const hasPromo = !!p.promotionalPrice;
                  return (
                    <tr key={p.id}>
                      <td>
                        <img 
                          src={p.mainImage} 
                          alt={p.name} 
                          style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: '500' }}>SKU: {p.sku}</div>
                      </td>
                      <td>{p.category?.name}</td>
                      <td>
                        {hasPromo ? (
                          <div>
                            <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>R$ {p.promotionalPrice.toFixed(2)}</span>
                            <span style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--neutral-400)', marginLeft: '6px' }}>R$ {p.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: '700' }}>R$ {p.price.toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: p.stock <= 5 ? 'var(--color-danger)' : 'inherit' }}>
                          {p.stock} peças
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: p.plusSize ? '#fdf2f8' : '#f1f5f9', color: p.plusSize ? '#db2777' : '#475569', fontWeight: '600' }}>
                          {p.plusSize ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleFeatured(p)} aria-label="Toggle Featured">
                          <Star size={18} fill={p.featured ? 'var(--color-warning)' : 'none'} color={p.featured ? 'var(--color-warning)' : 'var(--neutral-300)'} />
                        </button>
                      </td>
                      <td>
                        <button onClick={() => toggleActive(p)} aria-label="Toggle Active">
                          {p.active ? (
                            <span className="status-badge status-paid" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Eye size={12} /> Visível</span>
                          ) : (
                            <span className="status-badge status-cancelled" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><EyeOff size={12} /> Oculto</span>
                          )}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-detail" style={{ padding: '6px 10px' }} onClick={() => openModal(p)}><Edit size={14} /></button>
                          <button className="btn-detail" style={{ padding: '6px 10px', color: 'var(--color-danger)' }} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <div style={{ padding: '30px' }}>
              <h3 className="form-title" style={{ marginBottom: '20px' }}>
                {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nome do Produto</label>
                    <input type="text" required className="form-input" placeholder="Ex: Vestido Midi Satin" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Código SKU</label>
                      <input type="text" required className="form-input" placeholder="Ex: VES-002" value={sku} onChange={(e) => setSku(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Categoria</label>
                      <select required className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Preço Normal (R$)</label>
                    <input type="number" step="0.01" required className="form-input" placeholder="Ex: 59.90" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço Promocional (R$ - Opcional)</label>
                    <input type="number" step="0.01" className="form-input" placeholder="Ex: 49.90" value={promotionalPrice} onChange={(e) => setPromotionalPrice(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estoque Inicial {useColorStock && '(calculado)'}</label>
                    <input 
                      type="number" 
                      required 
                      readOnly={useColorStock}
                      className="form-input" 
                      style={useColorStock ? { backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)' } : {}}
                      placeholder="Ex: 50" 
                      value={useColorStock ? colors.split(',').map(c => c.trim()).filter(Boolean).reduce((acc, c) => acc + (colorStockMap[c] || 0), 0) : stock} 
                      onChange={(e) => setStock(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tamanhos (separados por vírgula)</label>
                    <input type="text" required className="form-input" placeholder="Ex: G,GG,Extra G" value={sizes} onChange={(e) => setSizes(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cores (separadas por vírgula)</label>
                    <input type="text" required className="form-input" placeholder="Ex: Preto,Verde militar,Azul marinho" value={colors} onChange={(e) => setColors(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Veste (Equivalência de tamanho)</label>
                    <input type="text" className="form-input" placeholder="Ex: 46 ao 50 ou G veste 44 ao 48" value={veste} onChange={(e) => setVeste(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--neutral-700)' }}>
                    <input 
                      type="checkbox" 
                      checked={useColorStock} 
                      onChange={(e) => setUseColorStock(e.target.checked)} 
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} 
                    />
                    Habilitar controle de estoque individual por cor
                  </label>
                </div>

                {useColorStock && (
                  <div style={{ border: '1px solid var(--neutral-200)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--neutral-50)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-700)', textTransform: 'uppercase' }}>Estoque por Cor:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                      {colors.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                        <div key={c} className="form-group">
                          <label className="form-label" style={{ fontSize: '12px' }}>{c}</label>
                          <input 
                            type="number" 
                            min="0" 
                            className="form-input" 
                            value={colorStockMap[c] !== undefined ? colorStockMap[c] : 0} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setColorStockMap(prev => ({ ...prev, [c]: val }));
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--neutral-700)' }}>
                    <input 
                      type="checkbox" 
                      checked={useSizePrices} 
                      onChange={(e) => setUseSizePrices(e.target.checked)} 
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} 
                    />
                    Habilitar preço diferenciado por tamanho
                  </label>
                </div>

                {useSizePrices && (
                  <div style={{ border: '1px solid var(--neutral-200)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--neutral-50)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-700)', textTransform: 'uppercase' }}>Preços por Tamanho:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sizes.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                        <div key={s} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--neutral-700)' }}>Tamanho {s}</span>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Preço Base (R$)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              required={useSizePrices}
                              placeholder="Ex: 45.00"
                              className="form-input" 
                              value={sizePricesMap[s] !== undefined ? sizePricesMap[s] : ''} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSizePricesMap(prev => ({ ...prev, [s]: val }));
                              }} 
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Preço Promocional (R$ - Opcional)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Ex: 40.00"
                              className="form-input" 
                              value={sizePromoPricesMap[s] !== undefined ? sizePromoPricesMap[s] : ''} 
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : '';
                                setSizePromoPricesMap(prev => ({ ...prev, [s]: val }));
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Tecido</label>
                    <input type="text" className="form-input" placeholder="Ex: Poliamida, Caneladinho brilhoso" value={tecido} onChange={(e) => setTecido(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gramatura</label>
                    <input type="text" className="form-input" placeholder="Ex: Dramatura 310" value={gramatura} onChange={(e) => setGramatura(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Características (separadas por vírgula)</label>
                    <input type="text" className="form-input" placeholder="Ex: Zero transparência, Sem logomarca, Alta compressão" value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição Curta (Comercial)</label>
                  <input type="text" className="form-input" placeholder="Breve frase de efeito comercial..." value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição Completa</label>
                  <textarea className="form-textarea" rows={3} placeholder="Descreva os detalhes completos do produto..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-textarea" rows={2} placeholder="Ex: Tamanho único, veste do 48 ao 52." value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </div>

                {/* Área de Upload de Imagem Principal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', border: '1px solid var(--neutral-200)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Imagem Principal (Capa)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <label className="btn-detail" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', width: 'fit-content' }}>
                        <Upload size={16} /> 
                        {uploadingMain ? 'Enviando...' : 'Selecionar Foto'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'main')} />
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>Recomendado proporção 4:5 vertical</span>
                    </div>
                  </div>
                  
                  {mainImage ? (
                    <div style={{ position: 'relative', width: '80px', height: '100px', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={mainImage} alt="Preview Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setMainImage('')} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                    </div>
                  ) : (
                    <div style={{ width: '80px', height: '100px', border: '2px dashed var(--neutral-300)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-300)' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>

                {/* Galeria de Fotos */}
                <div style={{ border: '1px solid var(--neutral-200)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <label className="form-label">Galeria de Fotos do Produto (Opcional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', marginBottom: '14px' }}>
                    <label className="btn-detail" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px' }}>
                      <Upload size={16} /> 
                      {uploadingGallery ? 'Enviando fotos...' : 'Adicionar Fotos na Galeria'}
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'gallery')} />
                    </label>
                  </div>

                  {galleryImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {galleryImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '70px', height: '88px', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                          <img src={img} alt="Galeria preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeGalleryImage(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destaque e Status Visível */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    Destacar produto (Vitrine Inicial)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input type="checkbox" checked={plusSize} onChange={(e) => setPlusSize(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    Destaque Plus Size (Até o 54)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                    Produto Ativo (Visível para o cliente)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-detail" style={{ padding: '14px' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-checkout" style={{ flex: 1, backgroundColor: 'var(--color-secondary)' }}>
                    Salvar Alterações
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
