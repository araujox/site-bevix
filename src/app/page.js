'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, Search, X, Plus, Minus, Trash2, 
  Copy, Check, MapPin, Truck, CreditCard, ArrowRight, 
  Mail, Phone, Info, DollarSign, Package, 
  Eye, Filter, CheckCircle, ChevronLeft, ChevronRight, Users
} from 'lucide-react';

const Instagram = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const colorMap = {
  'preto': '#000000',
  'roxo': '#7e22ce',
  'verde acinzentado': '#6b7280',
  'azul': '#2563eb',
  'pink': '#db2777',
  'verde água': '#2dd4bf',
  'azul marinho': '#1e3a8a',
  'verde militar': '#556b2f',
  'marrom': '#78350f',
  'açaí/vinho': '#581c87',
  'açaí': '#581c87',
  'salmão': '#f87171',
  'terracota': '#c2410c',
  'vermelho': '#dc2626',
  'azul royal': '#1d4ed8',
  'azul céu': '#38bdf8',
  'rosa': '#f472b6',
  'salmão/rosa claro': '#fed7aa',
};

const getColorHex = (colorName) => {
  const normalized = colorName.trim().toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return '#cbd5e1'; // fallback gray
};

const parseVariations = (product) => {
  let parsed = {
    veste: '',
    tecido: '',
    gramatura: '',
    caracteristicas: [],
    observacao: '',
    descricaoCurta: ''
  };

  if (product && product.variations) {
    try {
      const data = JSON.parse(product.variations);
      parsed = { ...parsed, ...data };
    } catch (e) {
      parsed.observacao = product.variations;
    }
  }
  
  if (!Array.isArray(parsed.caracteristicas)) {
    parsed.caracteristicas = [];
  }
  
  return parsed;
};

const getProductPriceForSize = (product, size) => {
  if (!product) return { price: 0, promotionalPrice: null, activePrice: 0 };
  let basePrice = product.price;
  let promoPrice = product.promotionalPrice;

  if (product.variations && size) {
    try {
      const parsed = JSON.parse(product.variations);
      const cleanSize = size.trim();
      if (parsed.useSizePrices && parsed.sizePrices && parsed.sizePrices[cleanSize] !== undefined) {
        basePrice = parsed.sizePrices[cleanSize];
        promoPrice = parsed.sizePromotionalPrices?.[cleanSize] || null;
      }
    } catch (e) {}
  }

  return {
    price: basePrice,
    promotionalPrice: promoPrice,
    activePrice: promoPrice || basePrice
  };
};

const getProductGridPrice = (product) => {
  if (!product) return { price: 0, promotionalPrice: null, activePrice: 0, isStartingPrice: false };
  let basePrice = product.price;
  let promoPrice = product.promotionalPrice;
  let isStartingPrice = false;

  if (product.variations) {
    try {
      const parsed = JSON.parse(product.variations);
      if (parsed.useSizePrices && parsed.sizePrices) {
        const prices = Object.values(parsed.sizePrices);
        const promoPrices = parsed.sizePromotionalPrices ? Object.values(parsed.sizePromotionalPrices).filter(Boolean) : [];
        
        if (prices.length > 0) {
          const minBasePrice = Math.min(...prices);
          const minPromoPrice = promoPrices.length > 0 ? Math.min(...promoPrices) : null;
          
          basePrice = minBasePrice;
          promoPrice = minPromoPrice;
          isStartingPrice = true;
        }
      }
    } catch (e) {}
  }

  return {
    price: basePrice,
    promotionalPrice: promoPrice,
    activePrice: promoPrice || basePrice,
    isStartingPrice
  };
};

const displaySizeVeste = (product, parsedVars) => {
  const veste = parsedVars.veste || '';
  if (!veste) return product.sizes;
  if (veste.toLowerCase().includes('veste')) {
    return veste;
  }
  return `${product.sizes} (veste ${veste})`;
};

const getProductBadges = (product, parsedVars) => {
  const badges = [];
  if (!product || !parsedVars) return badges;
  const features = parsedVars.caracteristicas || [];
  const desc = (product.description || '').toLowerCase();
  const fabric = (parsedVars.tecido || '').toLowerCase();
  const grammage = (parsedVars.gramatura || '').toLowerCase();
  
  // Zero transparência
  if (features.some(f => f.toLowerCase().includes('transparência')) || desc.includes('zero transparência') || fabric.includes('blackout')) {
    badges.push({ text: 'Zero transparência', type: 'transparency' });
  }
  // Sem logomarca
  if (features.some(f => f.toLowerCase().includes('logomarca')) || desc.includes('sem logomarca')) {
    badges.push({ text: 'Sem logomarca', type: 'brandless' });
  }
  // Alta compressão
  if (features.some(f => f.toLowerCase().includes('compressão')) || desc.includes('alta compressão') || fabric.includes('caneladinho')) {
    badges.push({ text: 'Alta compressão', type: 'compression' });
  }
  // Plus size
  if (product.plusSize || desc.includes('plus size') || (parsedVars.modelagem && parsedVars.modelagem.toLowerCase().includes('plus')) || features.some(f => f.toLowerCase().includes('plus'))) {
    badges.push({ text: 'Plus size', type: 'plus' });
  }
  // Poliamida Blackout / Tecido Premium
  if (fabric.includes('blackout') || desc.includes('blackout')) {
    badges.push({ text: 'Poliamida Blackout', type: 'fabric-blackout' });
    badges.push({ text: 'Tecido Premium', type: 'premium' });
  } else if (fabric.includes('poliamida') || desc.includes('poliamida')) {
    badges.push({ text: 'Poliamida', type: 'fabric' });
  }
  // Gramatura 310
  if (grammage.includes('310') || desc.includes('310')) {
    badges.push({ text: 'Gramatura 310', type: 'grammage' });
  }
  // Caneladinho brilhoso
  if (fabric.includes('caneladinho') || desc.includes('caneladinho') || fabric.includes('brilhoso') || desc.includes('brilhoso')) {
    badges.push({ text: 'Caneladinho brilhoso', type: 'texture' });
    badges.push({ text: 'Brilho Sofisticado', type: 'shine' });
    badges.push({ text: 'Caimento Perfeito', type: 'fit' });
  }
  // Bolsos
  if (features.some(f => f.toLowerCase().includes('bolso')) || desc.includes('com bolsos') || desc.includes('dois bolsos') || desc.includes('bolso atrás') || desc.includes('bolsos na frente')) {
    badges.push({ text: 'Com bolsos', type: 'pockets' });
  }
  return badges;
};

const getProductAltText = (product, parsedVars) => {
  if (!product || !parsedVars) return '';
  const fabric = parsedVars.tecido || '';
  const firstColor = product.colors.split(',')[0]?.trim() || '';
  const badges = getProductBadges(product, parsedVars).map(b => b.text.toLowerCase());
  const featuresText = badges.includes('zero transparência') ? 'zero transparência' : '';
  const plusSizeText = product.plusSize ? 'plus size' : '';
  const pieces = [
    product.name,
    fabric,
    firstColor,
    plusSizeText,
    featuresText
  ].filter(Boolean).join(' ');
  return pieces;
};

export default function Home() {
  // Dados Básicos da Loja
  const [storeData, setStoreData] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  // Filtros e Pesquisa
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [onlyPlusSize, setOnlyPlusSize] = useState(false);
  const [orderBy, setOrderBy] = useState('featured');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Novos Filtros
  const [selectedType, setSelectedType] = useState('all');
  const [hasPockets, setHasPockets] = useState(false);
  const [highCompression, setHighCompression] = useState(false);
  const [zeroTransparency, setZeroTransparency] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState('all');
  const [onlySemLogomarca, setOnlySemLogomarca] = useState(false);

  // Carrinho
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal de Detalhes do Produto
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductImage, setSelectedProductImage] = useState('');
  const [selectedSizeOption, setSelectedSizeOption] = useState('');
  const [selectedColorOption, setSelectedColorOption] = useState('');
  const [isColorToConfirm, setIsColorToConfirm] = useState(false);
  const [quantityOption, setQuantityOption] = useState(1);

  // Checkout e Pix
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Formulário, 2 = Pix / Sucesso
  const [copiedPix, setCopiedPix] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Formulário do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerPhonePrefix, setCustomerPhonePrefix] = useState('55');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [complement, setComplement] = useState('');
  const [deliveryType, setDeliveryType] = useState('correios'); // 'correios', 'excursao', 'retirada'
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Modal de Boas-vindas (Identificação de Visitante)
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorWhatsapp, setVisitorWhatsapp] = useState('');
  const [visitorPhonePrefix, setVisitorPhonePrefix] = useState('55');
  const [visitorCity, setVisitorCity] = useState('');
  const [submittingVisitor, setSubmittingVisitor] = useState(false);

  // Buscar CEP e calcular frete
  const handleCepChange = async (val) => {
    const clean = val.replace(/\D/g, '');
    setCep(clean);
    
    if (clean.length === 8) {
      setLoadingShipping(true);
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const viaCepData = await viaCepRes.json();
        
        if (!viaCepData.erro) {
          setStreet(viaCepData.logradouro || '');
          setNeighborhood(viaCepData.bairro || '');
          setCity(viaCepData.localidade || '');
          setState(viaCepData.uf || '');
          
          // Chamar cálculo de frete
          const shipRes = await fetch('/api/shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cep: clean })
          });
          const shipData = await shipRes.json();
          if (shipData.success && shipData.methods) {
            setShippingMethods(shipData.methods);
            setSelectedShippingMethod(shipData.methods[0]);
            setShippingFee(shipData.methods[0].price);
          }
        } else {
          alert('CEP não encontrado. Digite o endereço manualmente.');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP/frete:', err);
      } finally {
        setLoadingShipping(false);
      }
    } else {
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      setShippingFee(0);
    }
  };

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    if (type === 'excursao') {
      setShippingFee(10.00);
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      setCep('');
      setStreet('');
      setNumber('');
      setNeighborhood('');
      setCity('');
      setState('');
    } else if (type === 'retirada') {
      setShippingFee(0.00);
      setShippingMethods([]);
      setSelectedShippingMethod(null);
      setCep('');
      setStreet('Retirada presencial');
      setNumber('');
      setNeighborhood('');
      setCity('Santa Cruz do Capibaribe');
      setState('PE');
      setComplement('');
    } else {
      setShippingFee(0.00);
      setCep('');
      setStreet('');
      setNumber('');
      setNeighborhood('');
      setCity('');
      setState('');
    }
  };

  // Banner Carousel Index
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // --- 1. Carregar Dados Iniciais da Loja ---
  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/store-info');
      const data = await res.json();
      if (!data.error) {
        setStoreData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar info da loja:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
    // Verificar se o visitante já se identificou no localStorage
    const savedVisitorId = localStorage.getItem('bevix_visitor_id');
    if (!savedVisitorId) {
      setIsVisitorModalOpen(true);
    }
  }, []);

  // --- 2. Carregar e Filtrar Produtos ---
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSize && selectedSize !== 'all') params.append('size', selectedSize);
      if (selectedColor && selectedColor !== 'all') params.append('color', selectedColor);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (inStock) params.append('inStock', 'true');
      if (onlyPlusSize) params.append('plusSize', 'true');
      if (search) params.append('search', search);
      if (orderBy) params.append('orderBy', orderBy);

      // Novos filtros
      if (selectedType && selectedType !== 'all') params.append('type', selectedType);
      if (hasPockets) params.append('pockets', 'true');
      if (highCompression) params.append('compression', 'true');
      if (zeroTransparency) params.append('transparency', 'true');
      if (selectedFabric && selectedFabric !== 'all') params.append('fabric', selectedFabric);
      if (onlySemLogomarca) params.append('semLogomarca', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (!data.error) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, [
    selectedCategory, selectedSize, selectedColor, minPrice, maxPrice, 
    inStock, onlyPlusSize, search, orderBy, selectedType, hasPockets, 
    highCompression, zeroTransparency, selectedFabric, onlySemLogomarca
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // SEO dinâmico para produtos no modal
  useEffect(() => {
    const storeName = storeData?.settings?.storeName || 'NOME_DA_LOJA';
    if (selectedProduct) {
      const parsed = parseVariations(selectedProduct);
      document.title = `${selectedProduct.name} | ${storeName}`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `${selectedProduct.name} - ${parsed.descricaoCurta || selectedProduct.description}`);
    } else {
      document.title = `${storeName} | Catálogo de Roupas`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', storeData?.settings?.description || 'Coleção de roupas premium no atacado e varejo.');
      }
    }
  }, [selectedProduct, storeData]);

  // --- 3. Recuperar Carrinho de LocalStorage ---
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Erro ao parsear carrinho:', e);
      }
    }
  }, []);

  // Salvar Carrinho ao Alterar
  useEffect(() => {
    localStorage.setItem('wholesale_cart', JSON.stringify(cart));
  }, [cart]);

  // --- 4. Ações de Banners (Carrossel) ---
  const nextBanner = () => {
    if (storeData?.banners?.length) {
      setCurrentBannerIndex((prev) => (prev + 1) % storeData.banners.length);
    }
  };

  const prevBanner = () => {
    if (storeData?.banners?.length) {
      setCurrentBannerIndex((prev) => (prev - 1 + storeData.banners.length) % storeData.banners.length);
    }
  };

  // Carrossel Automático
  useEffect(() => {
    if (storeData?.banners?.length > 1) {
      const timer = setInterval(nextBanner, 6000);
      return () => clearInterval(timer);
    }
  }, [storeData?.banners]);

  const getActiveColorStock = () => {
    if (!selectedProduct) return 0;
    const pVars = parseVariations(selectedProduct);
    const chosenColor = selectedColorOption?.trim();
    if (isColorToConfirm) {
      return 99;
    }
    if (pVars.colorStock && chosenColor && pVars.colorStock[chosenColor] !== undefined) {
      return pVars.colorStock[chosenColor];
    }
    return selectedProduct.stock;
  };

  // --- 5. Ações do Carrinho ---
  const addToCart = (product, size, color, quantity, isToConfirm) => {
    if (!size || !color) return;
    const finalColor = isToConfirm ? `${color} (a confirmar)` : color;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => 
          item.productId === product.id && 
          item.size === size && 
          item.color === finalColor
      );

      // Determine stock limit for this specific color
      const pVars = parseVariations(product);
      const cleanColor = color.trim();
      let colorLimit = product.stock;
      if (isToConfirm) {
        colorLimit = 99; // default limit for custom order
      } else if (pVars.colorStock && pVars.colorStock[cleanColor] !== undefined) {
        colorLimit = pVars.colorStock[cleanColor];
      }

      if (existingItemIndex > -1) {
        // Atualizar quantidade
        const newCart = [...prevCart];
        const newQty = newCart[existingItemIndex].quantity + quantity;
        
        if (newQty > colorLimit) {
          alert(`Desculpe, quantidade máxima em estoque atingida para a cor "${color}" (${colorLimit} peças).`);
          return prevCart;
        }

        newCart[existingItemIndex].quantity = newQty;
        newCart[existingItemIndex].subtotal = newQty * newCart[existingItemIndex].unitPrice;
        return newCart;
      } else {
        // Adicionar novo item
        const priceInfo = getProductPriceForSize(product, size);
        const price = priceInfo.activePrice;
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            mainImage: product.mainImage,
            size,
            color: finalColor,
            quantity,
            unitPrice: price,
            subtotal: quantity * price,
            maxStock: colorLimit
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        // Remover item
        return prevCart.filter((_, i) => i !== index);
      }

      if (newQty > item.maxStock) {
        alert(`Apenas ${item.maxStock} peças em estoque.`);
        return prevCart;
      }

      const newCart = [...prevCart];
      newCart[index].quantity = newQty;
      newCart[index].subtotal = newQty * item.unitPrice;
      return newCart;
    });
  };

  const removeCartItem = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('wholesale_cart');
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const minItemsRequired = storeData?.settings?.minimumItems || 6;
  const minValueRequired = storeData?.settings?.minimumValue || 0.00;
  const isMinimumItemsReached = totalItems >= minItemsRequired;
  const isMinimumValueReached = cartSubtotal >= minValueRequired;
  const isMinimumReached = isMinimumItemsReached && isMinimumValueReached;

  // --- 6. Abrir Detalhes do Produto ---
  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setSelectedProductImage(product.mainImage);
    // Auto-selecionar primeiro tamanho e cor
    const sizes = product.sizes.split(',');
    const colors = product.colors.split(',');
    setSelectedSizeOption(sizes[0]?.trim() || '');
    setSelectedColorOption(colors[0]?.trim() || '');
    setIsColorToConfirm(false);
    setQuantityOption(1);
  };

  // --- Visitor Identification Submit ---
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    if (!visitorName || !visitorWhatsapp || !visitorCity) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    
    const cleanNumber = visitorWhatsapp.replace(/\D/g, '');
    const fullWhatsapp = `${visitorPhonePrefix}${cleanNumber}`;
    
    setSubmittingVisitor(true);
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName,
          whatsapp: fullWhatsapp,
          city: visitorCity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('bevix_visitor_id', data.visitorId);
        setIsVisitorModalOpen(false);
      } else {
        alert(data.error || 'Erro ao registrar acesso. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao registrar acesso.');
    } finally {
      setSubmittingVisitor(false);
    }
  };

  // --- 7. Checkout e WhatsApp Redirect ---
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!isMinimumItemsReached) {
      alert(`Erro: Seu carrinho possui ${totalItems} itens, o mínimo exigido é ${minItemsRequired} peças.`);
      return;
    }

    if (!isMinimumValueReached) {
      alert(`Erro: Seu carrinho possui R$ ${cartSubtotal.toFixed(2)}, o valor mínimo exigido para pedidos é R$ ${minValueRequired.toFixed(2)}.`);
      return;
    }

    setSubmittingOrder(true);

    try {
      let finalDeliveryMethod = '';
      if (deliveryType === 'correios') {
        finalDeliveryMethod = selectedShippingMethod ? `${selectedShippingMethod.name} (${selectedShippingMethod.deadline})` : 'Correios';
      } else if (deliveryType === 'excursao') {
        finalDeliveryMethod = 'Excursão (Mandar no Ônibus)';
      } else {
        finalDeliveryMethod = 'Retirada na Loja';
      }

      const cleanNumber = customerWhatsapp.replace(/\D/g, '');
      const fullWhatsapp = `${customerPhonePrefix}${cleanNumber}`;

      const payload = {
        customerName,
        customerWhatsapp: fullWhatsapp,
        customerCpfCnpj,
        customerEmail,
        cep: deliveryType === 'correios' ? cep : '',
        street: deliveryType !== 'retirada' ? street : 'Retirada presencial',
        number: deliveryType !== 'retirada' ? number : '',
        neighborhood: deliveryType !== 'retirada' ? neighborhood : '',
        city,
        state,
        complement,
        deliveryMethod: finalDeliveryMethod,
        shippingFee: parseFloat(shippingFee) || 0,
        notes: deliveryNotes,
        items: cart.map(item => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setCreatedOrder(data.order);
        setCheckoutStep(2); // Avançar para o Pix/Sucesso
      } else {
        alert(data.error || 'Erro ao processar pedido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na requisição do pedido:', error);
      alert('Erro de conexão ao salvar pedido. Tente novamente.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleWhatsappRedirect = () => {
    if (!createdOrder || !storeData) return;

    const storeWhatsapp = storeData.settings.whatsapp;
    
    // Montagem da mensagem estruturada conforme solicitado pelo usuário
    const storeName = storeData?.settings?.storeName || 'NOME_DA_LOJA';
    let message = `Olá, vim pelo catálogo da ${storeName} e quero finalizar este pedido:\n\n`;
    
    message += `*DADOS DO CLIENTE:*\n`;
    message += `Nome: ${createdOrder.customerName}\n`;
    message += `WhatsApp: ${createdOrder.customerWhatsapp}\n`;
    message += `CPF/CNPJ: ${createdOrder.customerCpfCnpj || 'Não informado'}\n`;
    message += `E-mail: ${createdOrder.customerEmail || 'Não informado'}\n`;
    message += `CEP: ${createdOrder.cep || 'Não informado'}\n`;
    
    if (createdOrder.cep) {
      message += `Endereço: ${createdOrder.street}, ${createdOrder.number} - ${createdOrder.neighborhood} ${createdOrder.complement ? `(${createdOrder.complement})` : ''}\n`;
    } else {
      message += `Endereço: ${createdOrder.street || 'Retirada presencial'}\n`;
    }
    message += `Cidade/UF: ${createdOrder.city}/${createdOrder.state}\n\n`;

    message += `*PRODUTOS:*\n`;
    createdOrder.items.forEach(item => {
      message += `${item.productName}\n`;
      message += `Tamanho: ${item.size}\n`;
      message += `Quantidade: ${item.quantity}\n`;
      message += `Valor unitário: R$ ${item.unitPrice.toFixed(2).replace('.', ',')}\n`;
      message += `Subtotal: R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n\n`;
    });

    message += `*FRETE:*\n`;
    message += `Tipo de envio: ${createdOrder.deliveryMethod}\n`;
    message += `Valor do frete: R$ ${createdOrder.shippingFee.toFixed(2).replace('.', ',')}\n\n`;

    message += `*TOTAL DO PEDIDO:*\n`;
    message += `R$ ${createdOrder.total.toFixed(2).replace('.', ',')}\n\n`;

    message += `*PAGAMENTO:*\n`;
    message += `Pix\n\n`;

    message += `Observação:\n`;
    message += `Aguardando confirmação da loja.`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodedText}`;

    // Abrir o WhatsApp
    window.open(whatsappUrl, '_blank');

    // Fechar checkout, limpar carrinho e reiniciar estados
    clearCart();
    setIsCheckoutOpen(false);
    setCheckoutStep(1);
    setCreatedOrder(null);
  };

  const copyPixKey = () => {
    if (!storeData?.settings?.pixKey) return;
    navigator.clipboard.writeText(storeData.settings.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleDirectWhatsappPurchase = (product) => {
    const sizes = product.sizes.split(',');
    const colors = product.colors.split(',');
    const chosenSize = sizes[0]?.trim() || '';
    const chosenColor = colors[0]?.trim() || '';
    const price = product.promotionalPrice || product.price;
    const storeWhatsapp = storeData?.settings?.whatsapp || '5581998609447';
    
    let message = `Olá! Tenho interesse neste produto:\n\n`;
    message += `Produto: ${product.name}\n`;
    message += `Preço: R$ ${price.toFixed(2).replace('.', ',')}\n`;
    message += `Tamanho: ${chosenSize}\n`;
    message += `Cor: ${chosenColor}\n`;
    message += `Gostaria de saber se ainda está disponível.`;
    
    if (typeof window !== 'undefined' && product.mainImage && !product.mainImage.startsWith('data:')) {
      const imageUrl = `${window.location.origin}${product.mainImage}`;
      message += `\n\nImagem do produto: ${imageUrl}`;
    }
    
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- 8. Listar Cores/Tamanhos Únicos para Filtro ---
  const uniqueSizes = ['G', 'GG', 'Extra G', 'Tamanho único', 'A confirmar'];
  const uniqueColors = ['Preto', 'Verde militar', 'Azul marinho', 'Marrom', 'Açaí/Vinho', 'Açaí', 'Salmão', 'Terracota', 'Pink', 'Vermelho', 'Azul', 'Roxo', 'Verde acinzentado', 'Verde água', 'Azul royal'];

  // --- MODO MANUTENÇÃO (STANDBY) ---
  if (storeData?.settings?.maintenanceMode) {
    const maintenanceTitle = storeData.settings.maintenanceTitle || 'Preparando Novidades!';
    const maintenanceMessage = storeData.settings.maintenanceMessage || 'Estamos atualizando nosso catálogo. Voltamos em breve!';
    const storeWhatsapp = storeData.settings.whatsapp || '5581999999999';
    const storeInstagram = storeData.settings.instagram;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a', // Slate 900
        backgroundImage: 'radial-gradient(circle at top right, rgba(225, 29, 72, 0.15), transparent), radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.9), transparent)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        {/* Main Card */}
        <div style={{
          maxWidth: '550px',
          width: '100%',
          backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slate 800 with transparency
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '40px 30px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Logo / Brand Name */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            {storeData?.settings?.logo ? (
              <img 
                src={storeData.settings.logo} 
                alt={storeData.settings.storeName} 
                style={{ maxHeight: '64px', objectFit: 'contain' }} 
              />
            ) : (
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-primary, #e11d48)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {storeData?.settings?.storeName || 'Bevix Moda Fitness'}
              </h1>
            )}
          </div>

          {/* Animated SVG Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            color: 'var(--color-primary, #e11d48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="8" rx="1" />
              <path d="M17 14v7" />
              <path d="M7 14v7" />
              <path d="M17 3v3" />
              <path d="M7 3v3" />
              <path d="M10 14v7" />
              <path d="M14 14v7" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '14px', color: '#ffffff' }}>
            {maintenanceTitle}
          </h2>

          {/* Description */}
          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '32px' }}>
            {maintenanceMessage}
          </p>

          {/* Action Links / Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a 
              href={`https://wa.me/${storeWhatsapp}`} 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#25d366',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'opacity 0.2s',
                boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.2)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Falar no WhatsApp
            </a>

            {storeInstagram && (
              <a 
                href={storeInstagram.startsWith('http') ? storeInstagram : `https://instagram.com/${storeInstagram.replace('@', '')}`}
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Seguir no Instagram
              </a>
            )}
          </div>
        </div>

        {/* Small Footer */}
        <div style={{ marginTop: '24px', fontSize: '12px', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} {storeData?.settings?.storeName || 'Bevix Moda Fitness'}. Todos os direitos reservados.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Header Fixo com Glassmorphism */}
      <header className="header-wrapper">
        <div className="top-bar">
          🚚 Compre no atacado com pedido mínimo de apenas {minItemsRequired} peças!
        </div>
        <div className="container navbar">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => fetchProducts()}>
            {storeData?.settings?.logo ? (
              <img 
                src={storeData.settings.logo} 
                alt={storeData.settings.storeName} 
                style={{ height: '48px', objectFit: 'contain' }} 
              />
            ) : (
              <>
                {storeData?.settings?.storeName || 'NOME_DA_LOJA'}
                <div className="logo-dot" />
              </>
            )}
          </div>

          <nav className="nav-links">
            <a href="#" className={`nav-link ${selectedCategory === 'all' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setSelectedCategory('all'); }}>Início</a>
            {storeData?.categories?.slice(0, 7).map((cat) => (
              <a 
                key={cat.id} 
                href={`#${cat.slug}`} 
                className={`nav-link ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setSelectedCategory(cat.slug); }}
              >
                {cat.name}
              </a>
            ))}
          </nav>

          <div className="navbar-actions">
            <a 
              href={`https://wa.me/${storeData?.settings?.whatsapp}`} 
              target="_blank" 
              className="btn-detail" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <Phone size={14} /> <span className="atendimento-text">Atendimento</span>
            </a>
            <button className="nav-btn" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrinho">
              <ShoppingCart size={20} />
              {totalItems > 0 && <div className="cart-badge">{totalItems}</div>}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* 2. Banner Carrossel Dinâmico */}
        {storeData?.banners && storeData.banners.length > 0 && (
          <div className="hero-banner-carousel">
            {storeData.banners.map((banner, index) => (
              <div 
                key={banner.id || index}
                className={`hero-slide ${index === currentBannerIndex ? 'active' : ''}`}
              >
                <div className="hero-content">
                  <div className="hero-badge">Destaque da Loja</div>
                  <h1 className="hero-title">{banner.title}</h1>
                  <p className="hero-subtitle">{banner.subtitle}</p>
                  {banner.buttonText && (
                    <a href={banner.buttonLink || '#produtos'} className="hero-btn">
                      {banner.buttonText}
                    </a>
                  )}
                </div>
                
                <div 
                  className="hero-image-overlay"
                  style={{ backgroundImage: `url(${banner.image})` }}
                />
              </div>
            ))}

            {storeData.banners.length > 1 && (
              <>
                <button onClick={prevBanner} className="carousel-control-btn prev" aria-label="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextBanner} className="carousel-control-btn next" aria-label="Próximo">
                  <ChevronRight size={20} />
                </button>
                <div className="carousel-indicators">
                  {storeData.banners.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator-dot ${index === currentBannerIndex ? 'active' : ''}`}
                      onClick={() => setCurrentBannerIndex(index)}
                      aria-label={`Ir para o slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Barra de Pesquisa e Filtros */}
        <section className="search-filter-section" id="produtos">
          <div className="search-row">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Busque por nome, código SKU ou categoria..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              className={`btn-detail ${showAdvancedFilters ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px' }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} /> Filtros {showAdvancedFilters ? 'Ativos' : ''}
            </button>

            <select 
              className="sort-select"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
            >
              <option value="featured">Mais Vendidos</option>
              <option value="cheap">Menor Preço</option>
              <option value="expensive">Maior Preço</option>
              <option value="az">Nome A-Z</option>
              <option value="za">Nome Z-A</option>
            </select>
          </div>

          {/* Categorias Rápidas */}
          <div className="filter-row">
            <button 
              className={`filter-chip ${selectedCategory === 'all' && !onlyPlusSize ? 'active' : ''}`}
              onClick={() => { setSelectedCategory('all'); setOnlyPlusSize(false); }}
            >
              Todas as Categorias
            </button>
            {storeData?.categories?.map((cat) => (
              <button 
                key={cat.id} 
                className={`filter-chip ${selectedCategory === cat.slug && !onlyPlusSize ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat.slug); setOnlyPlusSize(false); }}
              >
                {cat.name}
              </button>
            ))}
            <button 
              className={`filter-chip ${onlyPlusSize ? 'active' : ''}`}
              style={{ backgroundColor: onlyPlusSize ? 'var(--color-primary)' : '', color: onlyPlusSize ? 'white' : '' }}
              onClick={() => { setOnlyPlusSize(!onlyPlusSize); setSelectedCategory('all'); }}
            >
              ✨ Destaque Plus Size (Até o 54)
            </button>
          </div>

          {/* Filtros Avançados Ocultáveis */}
          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="filter-group">
                <span className="filter-label">Tamanho</span>
                <select className="filter-select" value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                  <option value="all">Todos</option>
                  {uniqueSizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Cor</span>
                <select className="filter-select" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                  <option value="all">Todas</option>
                  {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Tipo de Peça</span>
                <select className="filter-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  <option value="all">Todos</option>
                  <option value="conjunto-short">Conjuntos com Short</option>
                  <option value="conjunto-calca">Conjuntos com Calça</option>
                  <option value="macaquinho">Macaquinhos</option>
                  <option value="macacao">Macacões</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Tecido</span>
                <select className="filter-select" value={selectedFabric} onChange={(e) => setSelectedFabric(e.target.value)}>
                  <option value="all">Todos</option>
                  <option value="Poliamida Blackout">Poliamida Blackout</option>
                  <option value="Caneladinho Brilhoso">Caneladinho Brilhoso</option>
                  <option value="Poliamida">Poliamida</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Preço</span>
                <div className="price-inputs">
                  <input type="number" placeholder="Mín R$" className="price-input" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <input type="number" placeholder="Máx R$" className="price-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>

              <div className="filter-group" style={{ display: 'flex', gap: '20px', justifyContent: 'center', gridColumn: '1 / -1', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Apenas itens em estoque
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={onlyPlusSize} onChange={(e) => setOnlyPlusSize(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Destaque Plus Size (Até o 54)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={hasPockets} onChange={(e) => setHasPockets(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Com bolsos
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={highCompression} onChange={(e) => setHighCompression(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Alta compressão
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={zeroTransparency} onChange={(e) => setZeroTransparency(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Zero transparência
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: 'var(--neutral-700)' }}>
                  <input type="checkbox" checked={onlySemLogomarca} onChange={(e) => setOnlySemLogomarca(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  Sem logomarca
                </label>
              </div>
            </div>
          )}
        </section>

        {/* 5. Grid de Produtos */}
        <section className="products-grid-section">
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
              <Package size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              Carregando vitrine de produtos...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
              <Info size={36} style={{ margin: '0 auto 12px auto', color: 'var(--neutral-400)' }} />
              <p style={{ fontWeight: '600', color: 'var(--neutral-700)' }}>Nenhum produto encontrado</p>
              <p style={{ fontSize: '14px', color: 'var(--neutral-400)', marginTop: '4px' }}>Tente alterar os seus filtros de pesquisa.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => {
                const gridPriceInfo = getProductGridPrice(product);
                const hasPromo = !!gridPriceInfo.promotionalPrice;
                const parsedVars = parseVariations(product);
                const sizeVeste = displaySizeVeste(product, parsedVars);
                const badges = getProductBadges(product, parsedVars);
                
                return (
                  <div key={product.id} className="product-card">
                    {hasPromo && <div className="product-badge-promo">Oferta</div>}
                    
                    <div className="product-image-container" onClick={() => openProductDetails(product)}>
                      <img src={product.mainImage} alt={getProductAltText(product, parsedVars)} className="product-img" loading="lazy" />
                    </div>
 
                    <div className="product-card-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="product-sku">SKU: {product.sku}</div>
                      <h3 className="product-title" onClick={() => openProductDetails(product)}>{product.name}</h3>
                      
                      <div className="product-prices" style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                        {gridPriceInfo.isStartingPrice && <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: '500' }}>A partir de:</span>}
                        <span className={hasPromo ? 'product-price-promo' : 'product-price'}>
                          R$ {gridPriceInfo.activePrice.toFixed(2).replace('.', ',')}
                        </span>
                        {hasPromo && (
                          <span className="product-price-old">R$ {gridPriceInfo.price.toFixed(2).replace('.', ',')}</span>
                        )}
                      </div>

                      <span className="product-category-name">{product.category?.name}</span>

                      {/* Tamanho/veste */}
                      <div className="product-size-fit" style={{ fontSize: '13px', color: 'var(--neutral-700)', margin: '6px 0', fontWeight: '500' }}>
                        <strong>Tamanho/Veste:</strong> {sizeVeste}
                      </div>

                      {/* Badges do card */}
                      <div className="product-badges-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0 10px 0' }}>
                        {badges
                          .filter(b => ['transparency', 'brandless', 'compression', 'plus', 'fabric-blackout', 'premium', 'shine', 'fit'].includes(b.type))
                          .map((badge, idx) => {
                            let bg = '#f1f5f9';
                            let fg = '#475569';
                            if (badge.type === 'plus') { bg = '#fdf2f8'; fg = '#db2777'; }
                            else if (badge.type === 'compression') { bg = '#eff6ff'; fg = '#2563eb'; }
                            else if (badge.type === 'transparency') { bg = '#f0fdf4'; fg = '#16a34a'; }
                            else if (badge.type === 'fabric-blackout' || badge.type === 'premium') { bg = '#f5f3ff'; fg = '#7c3aed'; }
                            else if (badge.type === 'shine') { bg = '#fffbeb'; fg = '#d97706'; }
                            else if (badge.type === 'fit') { bg = '#f0fdfa'; fg = '#0d9488'; }
                            
                            return (
                              <span key={idx} className={`badge-pill badge-${badge.type}`} style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: bg,
                                color: fg,
                                border: '1px solid currentColor',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                display: 'inline-block'
                              }}>
                                {badge.text}
                              </span>
                            );
                          })}
                      </div>

                      {/* Variações rápidas visualização */}
                      <div className="product-variations" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: '600' }}>
                          Cores disponíveis:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {product.colors.split(',').map((c, idx) => (
                            <span 
                              key={idx} 
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: getColorHex(c),
                                border: '1px solid var(--neutral-300)',
                                display: 'inline-block',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                              }}
                              title={c.trim()}
                            />
                          ))}
                          {(() => {
                            const unColors = parsedVars.coresIndisponiveisOuAConfirmar || [];
                            return unColors.map((c, idx) => (
                              <span 
                                key={`un-${idx}`} 
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: getColorHex(c),
                                  border: '1px dashed var(--neutral-400)',
                                  opacity: 0.4,
                                  display: 'inline-block',
                                  position: 'relative',
                                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                }}
                                title={`${c.trim()} (A confirmar)`}
                              >
                                <span style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '0',
                                  width: '100%',
                                  height: '1.5px',
                                  backgroundColor: '#ef4444',
                                  transform: 'rotate(-45deg) translateY(-50%)',
                                  transformOrigin: 'center'
                                }} />
                              </span>
                            ));
                          })()}
                        </div>
                      </div>

                      <div className="product-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button className="btn-detail" style={{ flex: 1, padding: '10px' }} onClick={() => openProductDetails(product)}>Ver Detalhes</button>
                        <button 
                          className="btn-buy" 
                          style={{ 
                            backgroundColor: '#25d366', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px 14px', 
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.2)'
                          }}
                          onClick={() => handleDirectWhatsappPurchase(product)}
                          aria-label="Comprar pelo WhatsApp"
                          title="Comprar pelo WhatsApp"
                        >
                          <Phone size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 6. Informações da Loja */}
      <section className="info-section">
        <div className="container info-grid">
          <div className="info-col">
            <div className="logo-container" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {storeData?.settings?.logo ? (
                <img 
                  src={storeData.settings.logo} 
                  alt={storeData.settings.storeName} 
                  style={{ height: '48px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} // logo em branco para o rodapé escuro se for imagem
                />
              ) : (
                <>
                  {storeData?.settings?.storeName || 'NOME_DA_LOJA'}
                  <div className="logo-dot" />
                </>
              )}
            </div>
            <p className="info-text">
              {storeData?.settings?.description || 'Coleções exclusivas atacadistas. Roupas com estilo, sofisticação e qualidade para lojistas de todo o Brasil.'}
            </p>
          </div>

          <div className="info-col">
            <h4 className="info-title">Atendimento</h4>
            <div className="contact-item">
              <Phone size={16} /> {storeData?.settings?.whatsapp ? 
                `(${storeData.settings.whatsapp.substring(2, 4)}) ${storeData.settings.whatsapp.substring(4, 9)}-${storeData.settings.whatsapp.substring(9)}` : 
                '(81) 99999-9999'}
            </div>
            <div className="contact-item"><Mail size={16} /> {storeData?.settings?.email || 'contato@lojaexemplo.com.br'}</div>
            <div className="contact-item"><MapPin size={16} /> {storeData?.settings?.address || 'ENDERECO_DA_LOJA'}</div>
          </div>

          <div className="info-col">
            <h4 className="info-title">Formas de Envio</h4>
            <p className="info-text">Enviamos para todo o Brasil via Correios (PAC/Sedex), Ônibus de Excursão do Moda Center Santa Cruz e Transportadoras credenciadas.</p>
          </div>

          <div className="info-col">
            <h4 className="info-title">Redes Sociais</h4>
            <p className="info-text">Siga nossa página para acompanhar as novidades e reposições diárias!</p>
            <div className="social-links">
              <a href={`https://instagram.com/${storeData?.settings?.instagram}`} target="_blank" className="social-link-btn" aria-label="Acessar Instagram"><Instagram size={18} /></a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Rodapé */}
      <footer className="footer">
        <div className="container footer-content">
          <p>{storeData?.settings?.footerText || '© 2026 NOME_DA_LOJA. Todos os direitos reservados.'}</p>
          <div className="footer-seals">
            <div className="seal-badge">
              <CheckCircle className="seal-icon" size={14} /> SSL Ambiente Seguro
            </div>
            <div className="seal-badge">
              <CreditCard className="seal-icon" size={14} /> Pix Aprovado na Hora
            </div>
          </div>
        </div>
      </footer>

      {/* 8. WhatsApp Widget */}
      <a 
        href={`https://wa.me/${storeData?.settings?.whatsapp}`} 
        target="_blank" 
        className="whatsapp-widget"
        aria-label="Fale conosco no WhatsApp"
      >
        <Phone size={24} />
      </a>

      {/* --- MODAIS --- */}

      {/* A. Detalhes do Produto Modal */}
      {/* A. Detalhes do Produto Modal */}
      {selectedProduct && (() => {
        const pVars = parseVariations(selectedProduct);
        return (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}><X size={20} /></button>
              <div className="product-modal-grid">
                <div className="modal-gallery-pane">
                  <img src={selectedProductImage} alt={getProductAltText(selectedProduct, pVars)} className="modal-main-image" style={{ objectFit: 'contain' }} />
                  <div className="modal-gallery-thumbs">
                    <img 
                      src={selectedProduct.mainImage} 
                      alt="Principal"
                      className={`modal-thumb ${selectedProductImage === selectedProduct.mainImage ? 'active' : ''}`}
                      onClick={() => setSelectedProductImage(selectedProduct.mainImage)}
                    />
                    {selectedProduct.images?.map((img) => (
                      <img 
                        key={img.id}
                        src={img.url} 
                        alt="Galeria"
                        className={`modal-thumb ${selectedProductImage === img.url ? 'active' : ''}`}
                        onClick={() => setSelectedProductImage(img.url)}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-info-pane">
                  <div style={{ fontSize: '12px', color: 'var(--neutral-400)', fontWeight: '600' }}>SKU: {selectedProduct.sku}</div>
                  <h2 className="modal-title">{selectedProduct.name}</h2>
                  
                  {(() => {
                    const sizeForPricing = selectedSizeOption || selectedProduct.sizes.split(',')[0]?.trim();
                    const currentPriceInfo = getProductPriceForSize(selectedProduct, sizeForPricing);
                    const hasPromo = !!currentPriceInfo.promotionalPrice;
                    return (
                      <div className="modal-prices">
                        <span className={hasPromo ? 'product-price-promo' : 'product-price'}>
                          R$ {currentPriceInfo.activePrice.toFixed(2).replace('.', ',')}
                        </span>
                        {hasPromo && (
                          <span className="product-price-old">R$ {currentPriceInfo.price.toFixed(2).replace('.', ',')}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Badges do Modal */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                    {getProductBadges(selectedProduct, pVars).map((badge, idx) => {
                      let bg = '#f1f5f9';
                      let fg = '#475569';
                      if (badge.type === 'plus') { bg = '#fdf2f8'; fg = '#db2777'; }
                      else if (badge.type === 'compression') { bg = '#eff6ff'; fg = '#2563eb'; }
                      else if (badge.type === 'transparency') { bg = '#f0fdf4'; fg = '#16a34a'; }
                      else if (badge.type === 'fabric-blackout' || badge.type === 'premium') { bg = '#f5f3ff'; fg = '#7c3aed'; }
                      else if (badge.type === 'shine') { bg = '#fffbeb'; fg = '#d97706'; }
                      else if (badge.type === 'fit') { bg = '#f0fdfa'; fg = '#0d9488'; }
                      
                      return (
                        <span key={idx} className={`badge-pill badge-${badge.type}`} style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: bg,
                          color: fg,
                          border: '1px solid currentColor',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em'
                        }}>
                          {badge.text}
                        </span>
                      );
                    })}
                  </div>

                  <p className="modal-desc">{selectedProduct.description || 'Nenhuma descrição disponível para este produto.'}</p>

                  {/* Características técnicas */}
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--neutral-800)', marginBottom: '8px' }}>Características Técnicas:</h4>
                    <ul style={{ fontSize: '13px', color: 'var(--neutral-600)', paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {pVars.tecido && <li><strong>Tecido:</strong> {pVars.tecido}</li>}
                      {pVars.gramatura && <li><strong>Gramatura:</strong> {pVars.gramatura}</li>}
                      {pVars.veste && <li><strong>Veste:</strong> {pVars.veste}</li>}
                      {(pVars.modelagem || selectedProduct.plusSize) && <li><strong>Modelagem:</strong> Plus size</li>}
                      {pVars.caracteristicas && pVars.caracteristicas.length > 0 && (
                        <li><strong>Destaques:</strong> {pVars.caracteristicas.join(', ')}</li>
                      )}
                    </ul>
                  </div>

                  {pVars.observacao && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 'var(--radius-sm)', color: '#b45309', fontSize: '12.5px' }}>
                      <strong>Observação:</strong> {pVars.observacao}
                    </div>
                  )}

                  {/* Seleção de Tamanho */}
                  <div style={{ marginTop: '16px' }}>
                    <h4 className="modal-selection-title">Tamanho:</h4>
                    <div className="swatch-selectors">
                      {selectedProduct.sizes.split(',').map((sizeStr) => {
                        const sz = sizeStr.trim();
                        return (
                          <button 
                            key={sz} 
                            className={`swatch-btn ${selectedSizeOption === sz ? 'active' : ''}`}
                            onClick={() => setSelectedSizeOption(sz)}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seleção de Cor */}
                  <div style={{ marginTop: '12px' }}>
                    <h4 className="modal-selection-title">Cor:</h4>
                    <div className="swatch-selectors" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedProduct.colors.split(',').map((colorStr) => {
                        const c = colorStr.trim();
                        const isEsgotado = pVars.colorStock && pVars.colorStock[c] !== undefined && pVars.colorStock[c] <= 0;
                        return (
                          <button 
                            key={c} 
                            className={`swatch-btn ${selectedColorOption === c ? 'active' : ''}`}
                            style={isEsgotado ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
                            onClick={() => {
                              setSelectedColorOption(c);
                              setIsColorToConfirm(false);
                            }}
                            title={isEsgotado ? `${c} (Esgotado)` : c}
                          >
                            {c} {isEsgotado && ' (esgotado)'}
                          </button>
                        );
                      })}
                      {(() => {
                        const unColors = pVars.coresIndisponiveisOuAConfirmar || [];
                        return unColors.map((colorStr) => {
                          const c = colorStr.trim();
                          const isSelected = selectedColorOption === c;
                          return (
                            <button 
                              key={`un-${c}`}
                              className={`swatch-btn ${isSelected ? 'active' : ''}`}
                              style={{
                                opacity: 0.6,
                                border: isSelected ? '2px solid var(--color-primary)' : '1px dashed var(--neutral-400)',
                                position: 'relative'
                              }}
                              onClick={() => {
                                setSelectedColorOption(c);
                                setIsColorToConfirm(true);
                              }}
                              title={`${c} (A confirmar)`}
                            >
                              <span style={{ textDecoration: 'line-through' }}>{c}</span>
                              <span style={{ fontSize: '9px', display: 'block', fontWeight: 'normal', color: 'var(--neutral-500)' }}>(a confirmar)</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                    {isColorToConfirm && (
                      <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#b91c1c', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={14} /> Esta cor está indisponível para pronta entrega (disponibilidade a confirmar).
                      </div>
                    )}
                  </div>

                  {/* Seleção de Quantidade */}
                  <div style={{ marginTop: '12px' }}>
                    <h4 className="modal-selection-title">Quantidade:</h4>
                    <div className="qty-selector" style={{ marginTop: '6px' }}>
                      <button className="qty-btn" onClick={() => setQuantityOption(Math.max(1, quantityOption - 1))}><Minus size={14} /></button>
                      <div className="qty-val">{quantityOption}</div>
                      <button className="qty-btn" onClick={() => setQuantityOption(Math.min(getActiveColorStock(), quantityOption + 1))}><Plus size={14} /></button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--neutral-400)', marginTop: '4px', display: 'block' }}>
                      {isColorToConfirm ? (
                        'Cor sob encomenda (disponibilidade a confirmar com a fábrica)'
                      ) : getActiveColorStock() <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: '600' }}>Esgotado nesta cor</span>
                      ) : (
                        <>Estoque disponível para esta cor: {getActiveColorStock()} peças</>
                      )}
                    </span>
                  </div>

                  <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button 
                      className="btn-modal-add"
                      style={{ width: '100%' }}
                      disabled={selectedProduct.stock <= 0 || (!isColorToConfirm && getActiveColorStock() <= 0)}
                      onClick={() => {
                        addToCart(selectedProduct, selectedSizeOption, selectedColorOption, quantityOption, isColorToConfirm);
                        setSelectedProduct(null);
                      }}
                    >
                      <ShoppingCart size={18} /> 
                      {selectedProduct.stock <= 0 ? 'Sem estoque' : (!isColorToConfirm && getActiveColorStock() <= 0) ? 'Indisponível nesta cor' : 'Adicionar ao Carrinho'}
                    </button>

                    <button 
                      className="btn-modal-whatsapp"
                      style={{ 
                        width: '100%', 
                        backgroundColor: '#25d366', 
                        color: 'white', 
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                        border: 'none',
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                      onClick={() => {
                        const price = selectedProduct.promotionalPrice || selectedProduct.price;
                        const storeWhatsapp = storeData?.settings?.whatsapp || '5581998609447';
                        
                        let message = `Olá! Tenho interesse neste produto:\n\n`;
                        message += `Produto: ${selectedProduct.name}\n`;
                        message += `Preço: R$ ${price.toFixed(2).replace('.', ',')}\n`;
                        message += `Tamanho: ${selectedSizeOption}\n`;
                        message += `Cor: ${selectedColorOption}${isColorToConfirm ? ' (a confirmar)' : ''}\n`;
                        message += `Gostaria de saber se ainda está disponível.`;
                        
                        if (typeof window !== 'undefined' && selectedProduct.mainImage && !selectedProduct.mainImage.startsWith('data:')) {
                          const imageUrl = `${window.location.origin}${selectedProduct.mainImage}`;
                          message += `\n\nImagem do produto: ${imageUrl}`;
                        }
                        
                        const encodedText = encodeURIComponent(message);
                        const whatsappUrl = `https://wa.me/${storeWhatsapp}?text=${encodedText}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <Phone size={18} /> Comprar pelo WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* B. Carrinho Lateral Retrátil */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <div className="cart-title">
                <ShoppingCart size={22} /> Seu Carrinho
              </div>
              <button onClick={() => setIsCartOpen(false)} className="cart-close" aria-label="Fechar carrinho"><X size={24} /></button>
            </div>

            <div className="cart-items-list">
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <ShoppingCart size={48} />
                  <div className="cart-empty-text">Seu carrinho está vazio</div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <img src={item.mainImage} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-meta">Tam: {item.size} | Cor: {item.color}</div>
                      <div className="cart-item-price-row">
                        <div className="qty-selector">
                          <button className="qty-btn" onClick={() => updateCartQty(index, -1)} style={{ width: '24px', height: '24px' }}><Minus size={10} /></button>
                          <span className="qty-val" style={{ width: '28px', fontSize: '13px' }}>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateCartQty(index, 1)} style={{ width: '24px', height: '24px' }}><Plus size={10} /></button>
                        </div>
                        <span className="cart-item-price">R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeCartItem(index)} aria-label="Remover item"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>

            {/* Barra de Progresso Pedido Mínimo */}
            {cart.length > 0 && (
              <div className="minimum-order-banner" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div className="min-order-status">
                    <span>Mínimo de peças ({minItemsRequired})</span>
                    <span>{totalItems} / {minItemsRequired}</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (totalItems / minItemsRequired) * 100)}%` }}
                    />
                  </div>
                </div>

                {minValueRequired > 0 && (
                  <div>
                    <div className="min-order-status" style={{ marginTop: '2px' }}>
                      <span>Valor Mínimo (R$ {minValueRequired.toFixed(2).replace('.', ',')})</span>
                      <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${Math.min(100, (cartSubtotal / minValueRequired) * 100)}%`,
                          backgroundColor: isMinimumValueReached ? '#10b981' : 'var(--color-primary, #e11d48)' 
                        }}
                      />
                    </div>
                  </div>
                )}

                {!isMinimumReached && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: '#be123c', fontWeight: '500', marginTop: '2px' }}>
                    {!isMinimumItemsReached && (
                      <span>• Adicione mais {minItemsRequired - totalItems} peças para liberar a finalização.</span>
                    )}
                    {!isMinimumValueReached && (
                      <span>• Faltam R$ {(minValueRequired - cartSubtotal).toFixed(2).replace('.', ',')} para atingir o valor mínimo.</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal-row">
                  <span>Subtotal</span>
                  <span className="cart-subtotal-val">R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  className="btn-checkout" 
                  disabled={!isMinimumReached}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Finalizar Pedido <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visitor Gate Modal */}
      {isVisitorModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" style={{ maxWidth: '450px', width: '90%', animation: 'scaleUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ffe4e6', color: 'var(--color-primary, #e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Users size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neutral-800)', marginBottom: '8px' }}>Seja bem-vindo(a)!</h2>
              <p style={{ fontSize: '13px', color: 'var(--neutral-500)', lineHeight: '1.5' }}>
                Para acessar nosso catálogo completo de moda fitness no atacado e varejo, por favor identifique-se abaixo.
              </p>
            </div>

            <form onSubmit={handleVisitorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Seu Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="Ex: Amanda Souza" 
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>WhatsApp (com DDD)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-input" 
                    style={{ width: '90px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer' }}
                    value={visitorPhonePrefix}
                    onChange={(e) => setVisitorPhonePrefix(e.target.value)}
                  >
                    <option value="55">+55 🇧🇷</option>
                    <option value="1">+1 🇺🇸</option>
                    <option value="351">+351 🇵🇹</option>
                    <option value="34">+34 🇪🇸</option>
                    <option value="54">+54 🇦🇷</option>
                    <option value="598">+598 🇺🇾</option>
                    <option value="595">+595 🇵🇾</option>
                    <option value="56">+56 🇨🇱</option>
                    <option value="57">+57 🇨🇴</option>
                  </select>
                  <input 
                    type="tel" 
                    required 
                    className="form-input" 
                    style={{ flex: 1 }}
                    placeholder="Ex: 999999999" 
                    value={visitorWhatsapp}
                    onChange={(e) => setVisitorWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>Sua Cidade / Estado</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="Ex: Santa Cruz do Capibaribe - PE" 
                  value={visitorCity}
                  onChange={(e) => setVisitorCity(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingVisitor}
                className="btn-checkout" 
                style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: 'var(--color-primary, #e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submittingVisitor ? 'Acessando...' : 'Acessar Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* C. Checkout Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => { if (checkoutStep === 1) setIsCheckoutOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            {checkoutStep === 1 ? (
              <>
                <button className="modal-close" onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
                <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                  <h3 className="form-title">Dados do Seu Pedido</h3>

                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="Ex: João da Silva" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">CPF ou CNPJ (para Nota Fiscal)</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input" 
                        placeholder="Ex: 000.000.000-00" 
                        value={customerCpfCnpj}
                        onChange={(e) => setCustomerCpfCnpj(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-mail (para envio da NF-e)</label>
                      <input 
                        type="email" 
                        required 
                        className="form-input" 
                        placeholder="Ex: seuemail@email.com" 
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">WhatsApp (com DDD)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                          className="form-input" 
                          style={{ width: '90px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer' }}
                          value={customerPhonePrefix}
                          onChange={(e) => setCustomerPhonePrefix(e.target.value)}
                        >
                          <option value="55">+55 🇧🇷</option>
                          <option value="1">+1 🇺🇸</option>
                          <option value="351">+351 🇵🇹</option>
                          <option value="34">+34 🇪🇸</option>
                          <option value="54">+54 🇦🇷</option>
                          <option value="598">+598 🇺🇾</option>
                          <option value="595">+595 🇵🇾</option>
                          <option value="56">+56 🇨🇱</option>
                          <option value="57">+57 🇨🇴</option>
                        </select>
                        <input 
                          type="tel" 
                          required 
                          className="form-input" 
                          style={{ flex: 1 }}
                          placeholder="Ex: 999999999" 
                          value={customerWhatsapp}
                          onChange={(e) => setCustomerWhatsapp(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Forma de Envio</label>
                      <select 
                        required 
                        className="form-select"
                        value={deliveryType}
                        onChange={(e) => handleDeliveryTypeChange(e.target.value)}
                      >
                        <option value="correios">Correios (PAC / SEDEX)</option>
                        <option value="excursao">Excursão (Mandar no Ônibus) (+ R$ 10,00)</option>
                        <option value="retirada">Retirada na Loja (Grátis)</option>
                      </select>
                    </div>
                  </div>

                  {deliveryType === 'correios' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">CEP</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            required 
                            maxLength={9}
                            className="form-input" 
                            placeholder="Ex: 55190-000" 
                            value={cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                          />
                          {loadingShipping && (
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--neutral-400)' }}>
                              Buscando frete...
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group" style={{ flex: '3' }}>
                          <label className="form-label">Rua / Logradouro</label>
                          <input 
                            type="text" 
                            required 
                            className="form-input" 
                            placeholder="Rua..." 
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ flex: '1' }}>
                          <label className="form-label">Número</label>
                          <input 
                            type="text" 
                            required 
                            className="form-input" 
                            placeholder="123" 
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Bairro</label>
                          <input 
                            type="text" 
                            required 
                            className="form-input" 
                            placeholder="Bairro..." 
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Complemento</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Apto, bloco (opcional)" 
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Cidade</label>
                          <input 
                            type="text" 
                            required 
                            readOnly
                            className="form-input" 
                            style={{ backgroundColor: 'var(--neutral-100)' }}
                            value={city}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Estado</label>
                          <input 
                            type="text" 
                            required 
                            readOnly
                            maxLength={2} 
                            className="form-input" 
                            style={{ backgroundColor: 'var(--neutral-100)' }}
                            value={state}
                          />
                        </div>
                      </div>

                      {shippingMethods.length > 0 && (
                        <div className="form-group">
                          <label className="form-label">Opção de Envio (Correios)</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {shippingMethods.map((m) => (
                              <label 
                                key={m.id} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '10px', 
                                  padding: '12px', 
                                  border: `1px solid ${selectedShippingMethod?.id === m.id ? 'var(--color-primary)' : 'var(--neutral-200)'}`, 
                                  borderRadius: 'var(--radius-sm)', 
                                  cursor: 'pointer',
                                  backgroundColor: selectedShippingMethod?.id === m.id ? 'var(--neutral-50)' : 'white'
                                }}
                              >
                                <input 
                                  type="radio" 
                                  name="shippingMethod" 
                                  checked={selectedShippingMethod?.id === m.id}
                                  onChange={() => {
                                    setSelectedShippingMethod(m);
                                    setShippingFee(m.price);
                                  }}
                                  style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px' }}>
                                  <div>
                                    <strong>{m.name}</strong>
                                    <div style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>{m.deadline}</div>
                                  </div>
                                  <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                    R$ {m.price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {deliveryType === 'excursao' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Identificação da Excursão / Ônibus / Placa</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input" 
                          placeholder="Ex: Ônibus da Excursão X, Placa ABC-1234, Estacionamento Y" 
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                        />
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Cidade de Destino</label>
                          <input 
                            type="text" 
                            required 
                            className="form-input" 
                            placeholder="Cidade..." 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Estado</label>
                          <input 
                            type="text" 
                            required 
                            maxLength={2}
                            className="form-input" 
                            placeholder="UF..." 
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Complemento / Instruções</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ex: Deixar com o motorista João" 
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {deliveryType === 'retirada' && (
                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>
                      <strong>Retirada presencial:</strong> Você pode retirar seu pedido diretamente em nosso showroom em Santa Cruz do Capibaribe - PE, sem taxas adicionais de frete. Entraremos em contato via WhatsApp para agendar a retirada assim que o pagamento for confirmado.
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Observações do Pedido</label>
                    <textarea 
                      className="form-textarea" 
                      rows={2} 
                      placeholder="Ex: Observações adicionais sobre o pedido..." 
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'var(--neutral-100)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--neutral-600)' }}>
                      <span>Subtotal das Peças:</span>
                      <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--neutral-600)' }}>
                      <span>Frete / Envio:</span>
                      <span>R$ {shippingFee.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '15px', borderTop: '1px dashed var(--neutral-200)', paddingTop: '6px', marginTop: '4px' }}>
                      <span>Total Geral:</span>
                      <span>R$ {(cartSubtotal + shippingFee).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <button type="submit" disabled={submittingOrder} className="btn-checkout">
                    {submittingOrder ? 'Processando...' : 'Avançar para o Pagamento'} <ArrowRight size={18} />
                  </button>
                </form>
              </>
            ) : (
              // Passo 2: Instruções do Pix
              <div className="checkout-pix-panel">
                <CheckCircle size={56} style={{ color: 'var(--color-success)' }} />
                
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--neutral-800)' }}>Pedido Pré-Registrado!</h3>
                  <p style={{ color: 'var(--neutral-500)', fontSize: '14px', marginTop: '6px' }}>
                    Para concluir e enviar o pedido pelo WhatsApp, faça o pagamento via Pix.
                  </p>
                </div>

                <div style={{ width: '100%', padding: '16px', backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--neutral-600)', marginBottom: '8px' }}>
                    <span>Destinatário:</span>
                    <span style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{storeData?.settings?.pixReceiverName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--neutral-600)', marginBottom: '8px' }}>
                    <span>Banco:</span>
                    <span style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{storeData?.settings?.pixBank || 'Não informado'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--neutral-600)', borderTop: '1px dashed var(--neutral-200)', paddingTop: '8px', marginBottom: '8px' }}>
                    <span>Valor a pagar:</span>
                    <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '18px' }}>R$ {createdOrder?.total.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Chave Pix ({storeData?.settings?.pixKeyType}):</label>
                    <div className="pix-key-wrapper">
                      <span className="pix-key-text">{storeData?.settings?.pixKey}</span>
                      <button className="btn-copy" onClick={copyPixKey}>
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', textAlign: 'left' }}>
                  <Info size={24} style={{ flexShrink: 0 }} />
                  <span><strong>Importante:</strong> Copie a chave Pix acima, efetue o pagamento no aplicativo do seu banco e clique no botão abaixo para nos enviar o pedido com o comprovante no WhatsApp.</span>
                </div>

                <button 
                  onClick={handleWhatsappRedirect}
                  className="btn-checkout" 
                  style={{ backgroundColor: '#25d366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)', width: '100%', padding: '16px' }}
                >
                  Enviar Pedido e Comprovante pelo WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
