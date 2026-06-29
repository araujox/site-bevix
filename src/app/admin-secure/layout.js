'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Package, LayoutDashboard, ShoppingCart, FolderTree, 
  Image as ImageIcon, Settings as SettingsIcon, LogOut, Menu, X, Users
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fechar menu lateral no mobile quando a rota mudar
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Se for a rota de login, não exibir barra lateral e layout administrativo
  if (pathname === '/admin-secure/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do painel administrativo?')) {
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          router.push('/admin-secure/login');
        }
      } catch (err) {
        console.error('Erro ao deslogar:', err);
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin-secure', icon: <LayoutDashboard size={18} /> },
    { name: 'Produtos', path: '/admin-secure/produtos', icon: <Package size={18} /> },
    { name: 'Pedidos', path: '/admin-secure/pedidos', icon: <ShoppingCart size={18} /> },
    { name: 'Visitantes', path: '/admin-secure/visitantes', icon: <Users size={18} /> },
    { name: 'Categorias', path: '/admin-secure/categorias', icon: <FolderTree size={18} /> },
    { name: 'Banners', path: '/admin-secure/banners', icon: <ImageIcon size={18} /> },
    { name: 'Configurações', path: '/admin-secure/configuracoes', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Overlay de fundo no mobile */}
      {isSidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Barra Lateral Administrativa */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            Gestão Interna
          </div>
          <button 
            className="admin-sidebar-close" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="admin-menu">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`admin-menu-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button 
            onClick={handleLogout}
            className="admin-menu-item" 
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="admin-menu-toggle" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="admin-page-title">
              {navItems.find(item => item.path === pathname)?.name || 'Painel Administrativo'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="admin-user-label" style={{ fontSize: '13px', color: 'var(--neutral-500)', fontWeight: '500' }}>Admin Logado</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--neutral-200)', color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              AD
            </div>
          </div>
        </header>
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
