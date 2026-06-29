'use client';

import { useState, useEffect } from 'react';
import { 
  Package, LayoutDashboard, ShoppingCart, DollarSign, 
  AlertTriangle, ArrowUpRight, ArrowRight, RefreshCw, Eye
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const statsData = await res.json();
        setData(statsData);
      } else {
        setError('Erro ao carregar dados do dashboard.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Aguardando pagamento': return 'status-badge status-awaiting';
      case 'Pago': return 'status-badge status-paid';
      case 'Em separação': return 'status-badge status-pending';
      case 'Enviado': return 'status-badge status-shipped';
      case 'Finalizado': return 'status-badge status-finished';
      case 'Cancelado': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  const translateStatus = (status) => {
    return status;
  };

  // Renderizador do gráfico SVG
  const renderSVGChart = () => {
    if (!data?.chartData || data.chartData.length === 0) return null;

    const chartWidth = 500;
    const chartHeight = 180;
    const padding = 30;

    const maxSales = Math.max(...data.chartData.map(d => d.sales), 100);
    
    // Mapear pontos
    const points = data.chartData.map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (data.chartData.length - 1);
      // Inverter Y pois 0 é o topo
      const y = chartHeight - padding - (d.sales * (chartHeight - padding * 2)) / maxSales;
      return { x, y, sales: d.sales, date: d.date };
    });

    // Formular caminho da linha (path string)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Formular caminho para a área preenchida (gradiente sob a linha)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Linhas de grade horizontais */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          const value = maxSales * (1 - ratio);
          return (
            <g key={i}>
              <line 
                x1={padding} 
                y1={y} 
                x2={chartWidth - padding} 
                y2={y} 
                stroke="var(--neutral-200)" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
              <text 
                x={padding - 5} 
                y={y + 4} 
                fontSize="10" 
                fill="var(--neutral-400)" 
                textAnchor="end"
                fontWeight="500"
              >
                R$ {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Gradiente sob a curva */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Linha da curva de vendas */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="var(--color-primary)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Pontos de dados e labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="white" 
              stroke="var(--color-primary)" 
              strokeWidth="2.5" 
            />
            {/* Tooltip simples de valor no hover do SVG */}
            <title>R$ {p.sales.toFixed(2)} - {p.date}</title>
            
            {/* Eixo X - Datas */}
            <text 
              x={p.x} 
              y={chartHeight - 8} 
              fontSize="10" 
              fill="var(--neutral-400)" 
              textAnchor="middle"
              fontWeight="600"
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--neutral-400)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
        Carregando painel de dados...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>
        <AlertTriangle size={36} style={{ margin: '0 auto 12px auto' }} />
        <p>{error}</p>
        <button onClick={fetchStats} className="btn-detail" style={{ marginTop: '16px', display: 'inline-flex', padding: '10px 20px' }}>Tentar Novamente</button>
      </div>
    );
  }

  const { stats, recentOrders, recentVisitors, fiscalStats } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Indicadores Rápidos (Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        
        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Vendas Faturadas</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px', color: 'var(--color-success)' }}>
              R$ {stats.totalSales.toFixed(2)}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: 'var(--color-success)' }}><DollarSign size={20} /></div>
        </div>

        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Total de Pedidos</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px' }}>{stats.totalOrders}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--color-secondary)' }}><ShoppingCart size={20} /></div>
        </div>

        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Pedidos Pendentes</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px', color: 'var(--color-warning)' }}>
              {stats.pendingOrders}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: 'var(--color-warning)' }}><ArrowUpRight size={20} /></div>
        </div>

        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Modelos Cadastrados</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px' }}>{stats.totalProducts}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--color-secondary)' }}><Package size={20} /></div>
        </div>

        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Visualizações Reais</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px' }}>{stats.visits}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--color-secondary)' }}><Eye size={20} /></div>
        </div>

        <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div className="stat-label">Estoque Crítico (≤ 5)</div>
            <div className="stat-value" style={{ fontSize: '22px', marginTop: '6px', color: stats.lowStock > 0 ? 'var(--color-danger)' : 'var(--neutral-700)' }}>
              {stats.lowStock}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: stats.lowStock > 0 ? '#fef2f2' : 'var(--neutral-100)', color: stats.lowStock > 0 ? 'var(--color-danger)' : 'var(--neutral-500)' }}>
            <AlertTriangle size={20} />
          </div>
        </div>

      </div>

      {/* 2. Gráfico e Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        
        {/* Gráfico de Vendas */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neutral-700)' }}>Desempenho de Vendas (Últimos 7 dias)</h3>
            <span style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: '600', textTransform: 'uppercase' }}>Valores Pagos / Concluídos</span>
          </div>
          
          <div style={{ height: '220px', padding: '10px 0 20px 0', position: 'relative' }}>
            {renderSVGChart()}
          </div>
        </div>

        {/* Resumos Laterais */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resumo de Estoque */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neutral-700)' }}>Status do Inventário</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--neutral-50)' ? 'var(--neutral-500)' : 'inherit' }}>Total de Produtos</span>
                <strong style={{ color: 'var(--neutral-800)' }}>{stats.totalProducts} itens</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--neutral-50)' ? 'var(--neutral-500)' : 'inherit' }}>Produtos sem Estoque</span>
                <strong style={{ color: stats.lowStock > 0 ? 'var(--color-danger)' : 'var(--neutral-800)' }}>{stats.lowStock} itens</strong>
              </div>
              <Link 
                href="/admin-secure/produtos" 
                className="btn-detail" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', borderRadius: 'var(--radius-sm)' }}
              >
                Gerenciar Produtos <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Resumo Fiscal (NF-e) */}
          {fiscalStats && (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neutral-700)' }}>Resumo Fiscal (NF-e)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Notas Autorizadas</span>
                  <strong style={{ color: 'var(--color-success)' }}>{fiscalStats.authorized} notas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Processando</span>
                  <strong style={{ color: 'var(--color-warning)' }}>{fiscalStats.processing} notas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Rejeitadas</span>
                  <strong style={{ color: fiscalStats.rejected > 0 ? 'var(--color-danger)' : 'var(--neutral-800)' }}>{fiscalStats.rejected} notas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Canceladas</span>
                  <strong style={{ color: 'var(--neutral-600)' }}>{fiscalStats.cancelled} notas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Faturado (Nota)</span>
                  <strong style={{ color: 'var(--color-success)' }}>R$ {fiscalStats.totalInvoiced.toFixed(2)}</strong>
                </div>
                {fiscalStats.paidWithoutInvoice > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', backgroundColor: '#fef2f2', padding: '6px 8px', borderRadius: '4px', color: '#b91c1c', fontWeight: '500', marginTop: '4px' }}>
                    <span>Pagos sem Nota:</span>
                    <strong>{fiscalStats.paidWithoutInvoice} pedidos</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Grid de Pedidos e Visitantes Recentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '24px' }}>
        
        {/* Pedidos Recentes */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neutral-700)' }}>Pedidos Recentes</h3>
            <Link href="/admin-secure/pedidos" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--neutral-400)' }}>
              Nenhum pedido registrado.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const orderCode = order.id.slice(0, 8).toUpperCase();
                    return (
                      <tr key={order.id}>
                        <td style={{ fontWeight: '700' }}>#{orderCode}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{order.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>{order.customerWhatsapp}</div>
                        </td>
                        <td style={{ fontWeight: '700' }}>R$ {order.total.toFixed(2)}</td>
                        <td>
                          <span className={getStatusBadgeClass(order.status)}>
                            {translateStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visitantes Recentes */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--neutral-700)' }}>Visualizações Recentes (Acessos)</h3>
            <Link href="/admin-secure/visitantes" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {!recentVisitors || recentVisitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--neutral-400)' }}>
              Nenhum acesso registrado ainda.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>WhatsApp</th>
                    <th>Cidade</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td style={{ fontWeight: '600', color: 'var(--neutral-800)' }}>{visitor.name}</td>
                      <td>
                        <a 
                          href={`https://wa.me/${visitor.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#25d366', fontWeight: '600', textDecoration: 'none' }}
                        >
                          {visitor.whatsapp}
                        </a>
                      </td>
                      <td style={{ color: 'var(--neutral-500)' }}>{visitor.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
