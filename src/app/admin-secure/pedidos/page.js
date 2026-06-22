'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Phone, Printer, Save, RefreshCw, X, 
  ChevronDown, MessageSquare, AlertCircle, Calendar
} from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modificar Status/Notas Internas
  const [savingStatus, setSavingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' 
        ? '/api/admin/orders' 
        : `/api/admin/orders?status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSaveOrderChanges = async (orderId) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          internalNotes: internalNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Atualizar lista local
        setOrders(prev => prev.map(o => o.id === orderId ? data : o));
        setSelectedOrder(data);
        alert('Pedido atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSavingStatus(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
      case 'Em separação':
        return 'status-badge status-pending';
      case 'AWAITING_PIX':
      case 'Aguardando pagamento':
        return 'status-badge status-awaiting';
      case 'PAID':
      case 'Pago':
        return 'status-badge status-paid';
      case 'SHIPPED':
      case 'Enviado':
        return 'status-badge status-shipped';
      case 'FINISHED':
      case 'Finalizado':
        return 'status-badge status-finished';
      case 'CANCELLED':
      case 'Cancelado':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'PENDING': return 'Em separação';
      case 'AWAITING_PIX': return 'Aguardando pagamento';
      case 'PAID': return 'Pago';
      case 'SHIPPED': return 'Enviado';
      case 'FINISHED': return 'Finalizado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  // Abrir Detalhes do Pedido
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setInternalNotes(order.internalNotes || '');
  };

  // Imprimir/Exportar Resumo do Pedido em Texto Limpo
  const handlePrintOrder = (order) => {
    const orderCode = order.id.slice(0, 8).toUpperCase();
    const dateStr = new Date(order.createdAt).toLocaleString('pt-BR');
    
    const addressStr = order.street 
      ? `${order.street}, ${order.number}${order.complement ? ` - ${order.complement}` : ''}, ${order.neighborhood}, CEP: ${order.cep}`
      : order.address || '';

    let text = `========================================\n`;
    text += `          COMPROVANTE DE PEDIDO         \n`;
    text += `========================================\n`;
    text += `PEDIDO COD: #${orderCode}\n`;
    text += `DATA: ${dateStr}\n`;
    text += `STATUS: ${translateStatus(order.status)}\n`;
    text += `========================================\n`;
    text += `CLIENTE: ${order.customerName}\n`;
    text += `WHATSAPP: ${order.customerWhatsapp}\n`;
    text += `CIDADE/ESTADO: ${order.city} - ${order.state}\n`;
    text += `ENDEREÇO DE ENTREGA: ${addressStr}\n`;
    text += `FORMA DE ENVIO: ${order.deliveryMethod}\n`;
    if (order.notes) text += `OBSERVAÇÕES: ${order.notes}\n`;
    text += `========================================\n`;
    text += `ITENS DO PEDIDO:\n`;
    
    order.items.forEach((item, index) => {
      text += `${index + 1}. [${item.productName}] x${item.quantity}\n`;
      text += `   Tamanho: ${item.size} | Cor: ${item.color}\n`;
      text += `   Preço Unitário: R$ ${item.unitPrice.toFixed(2)} | Subtotal: R$ ${item.subtotal.toFixed(2)}\n`;
    });
    
    text += `========================================\n`;
    text += `SUBTOTAL: R$ ${(order.subtotal || 0).toFixed(2)}\n`;
    text += `FRETE: R$ ${(order.shippingFee || 0).toFixed(2)}\n`;
    text += `VALOR TOTAL: R$ ${order.total.toFixed(2)}\n`;
    text += `========================================\n`;
    
    // Abrir janela para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${text}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerWhatsapp.includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header do Painel com Filtros de Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, ID do pedido..." 
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Abas de Status */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'Aguardando pagamento', 'Pago', 'Em separação', 'Enviado', 'Cancelado', 'Finalizado'].map((st) => (
            <button 
              key={st}
              className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
              style={{ fontSize: '13px', padding: '6px 12px' }}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'ALL' ? 'Todos' : translateStatus(st)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tabela de Pedidos */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
            Buscando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--neutral-400)' }}>
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Envio</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleString('pt-BR');
                  const orderCode = order.id.slice(0, 8).toUpperCase();
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '700' }}>#{orderCode}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{order.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>{order.customerWhatsapp}</div>
                      </td>
                      <td>{dateStr}</td>
                      <td>{order.deliveryMethod}</td>
                      <td style={{ fontWeight: '700' }}>R$ {order.total.toFixed(2)}</td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {translateStatus(order.status)}
                        </span>
                      </td>
                      <td>
                        <button className="btn-detail" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openOrderDetails(order)}>
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--neutral-800)' }}>
                    Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={12} /> {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-detail" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }} onClick={() => handlePrintOrder(selectedOrder)}>
                    <Printer size={14} /> Imprimir
                  </button>
                  <a 
                    href={`https://wa.me/${selectedOrder.customerWhatsapp}`} 
                    target="_blank" 
                    className="btn-detail" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', color: '#25d366' }}
                  >
                    <Phone size={14} /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Grid de Dados do Cliente e Envio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '8px' }}>Cliente</h4>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--neutral-800)' }}>{selectedOrder.customerName}</p>
                  <p style={{ fontSize: '13px', color: 'var(--neutral-600)', marginTop: '2px' }}>WhatsApp: {selectedOrder.customerWhatsapp}</p>
                  {selectedOrder.street ? (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>
                        <strong>Rua:</strong> {selectedOrder.street}, {selectedOrder.number}
                      </p>
                      {selectedOrder.complement && (
                        <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>
                          <strong>Complemento:</strong> {selectedOrder.complement}
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>
                        <strong>Bairro:</strong> {selectedOrder.neighborhood}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>
                        <strong>CEP:</strong> {selectedOrder.cep} | {selectedOrder.city} - {selectedOrder.state}
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Local: {selectedOrder.city} - {selectedOrder.state}</p>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-600)' }}>Endereço: {selectedOrder.address}</p>
                    </>
                  )}
                </div>
                
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '8px' }}>Envio & Notas</h4>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--neutral-800)' }}>Metodo: {selectedOrder.deliveryMethod}</p>
                  <p style={{ fontSize: '13px', color: 'var(--neutral-600)', marginTop: '4px' }}>
                    <strong>Observações do Cliente:</strong> {selectedOrder.notes || 'Nenhuma observação.'}
                  </p>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '10px' }}>Itens Comprados</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--neutral-100)' : 'none', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--neutral-800)' }}>{item.productName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Tamanho: {item.size} | Cor: {item.color} | Qtd: {item.quantity}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--neutral-800)' }}>R$ {item.subtotal.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>R$ {item.unitPrice.toFixed(2)} cada</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--neutral-200)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--neutral-600)' }}>
                    <span>Subtotal:</span>
                    <span>R$ {(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--neutral-600)' }}>
                    <span>Frete:</span>
                    <span>R$ {(selectedOrder.shippingFee || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: 'var(--neutral-800)', marginTop: '4px' }}>
                    <span>Total do Pedido:</span>
                    <span style={{ color: 'var(--color-primary)' }}>R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Configurações Administrativas do Pedido (Editar Status / Anotações Internas) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--neutral-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--neutral-700)', textTransform: 'uppercase' }}>Configurações Administrativas</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Alterar Status</label>
                    <select 
                      className="form-select" 
                      style={{ padding: '8px' }}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Aguardando pagamento">Aguardando pagamento</option>
                      <option value="Pago">Pago</option>
                      <option value="Em separação">Em separação</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Anotações Internas (Admin)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px' }}
                      placeholder="Ex: Cliente pagou via chave e-mail, enviado por ônibus guapó" 
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => handleSaveOrderChanges(selectedOrder.id)}
                  disabled={savingStatus}
                  className="btn-checkout" 
                  style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', backgroundColor: 'var(--color-secondary)' }}
                >
                  <Save size={14} /> {savingStatus ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
