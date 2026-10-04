import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Utensils,
  Plus,
  Search,
  X,
  Sparkles,
  CornerDownLeft,
  Edit2,
  Trash2,
  LogOut,
  QrCode,
  Download,
  Upload,
  Database,
  Lock,
  Wifi,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FolderTree,
  Save,
  Printer,
  User
} from 'lucide-react';
import { MenuItem, Category, RestaurantInfo, FoodType, NetworkInfoResponse } from '../types/menu';
import { formatPrice, fetchMenuData } from '../services/menuService';
import { searchMenuItems } from '../services/searchService';
import QRCode from 'qrcode';
import {
  updateItemAvailability,
  updateCategoryAvailability,
  updateBulkAvailability,
  deleteItem,
  saveItem,
  changePassword,
  changeUsername,
  logoutAdmin
} from '../services/adminService';

const POPULAR_ADMIN_SEARCHES = [
  'Chicken Biryani',
  'Fried Rice',
  'Chicken 65',
  'Pizza',
  'Noodles',
  'Veg Biryani',
  'Mojito',
  'Falooda',
  'Milkshake'
];

interface AdminDashboardProps {
  token: string;
  adminUsername: string;
  onLogout: () => void;
  onPreviewMenu: () => void;
  onUpdateUsername?: (newUsername: string, newToken?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUsername,
  onLogout,
  onPreviewMenu,
  onUpdateUsername
}) => {
  const [currentAdminUsername, setCurrentAdminUsername] = useState<string>(adminUsername);
  const [activeTab, setActiveTab] = useState<'items' | 'qr' | 'backup' | 'settings'>('items');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Item filters & search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FoodType>('all');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modal states for Item
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  // Modal states for Category
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState<boolean>(false);

  // Form states for Add/Edit Item
  const [formItem, setFormItem] = useState<{
    id?: string;
    name: string;
    categoryId: string;
    subcategory: string;
    price: number | '';
    type: FoodType;
    availability: boolean;
    description: string;
  }>({
    name: '',
    categoryId: '',
    subcategory: '',
    price: '',
    type: 'veg',
    availability: true,
    description: ''
  });

  // Password change state
  const [pwCurrent, setPwCurrent] = useState<string>('');
  const [pwNew, setPwNew] = useState<string>('');
  const [pwConfirm, setPwConfirm] = useState<string>('');
  const [pwLoading, setPwLoading] = useState<boolean>(false);

  // Username change state
  const [newUsernameInput, setNewUsernameInput] = useState<string>('');
  const [userPwVerify, setUserPwVerify] = useState<string>('');
  const [userLoading, setUserLoading] = useState<boolean>(false);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const menuData = await fetchMenuData();
      if (menuData && menuData.items) {
        setItems(menuData.items);
        setCategories(menuData.categories);
        setRestaurant(menuData.restaurant);
        if (menuData.categories.length > 0 && !formItem.categoryId) {
          setFormItem((prev) => ({ ...prev, categoryId: menuData.categories[0].id }));
        }
      }

      // Try local network info, or synthesize public URL & QR for Cloudflare Pages
      try {
        const netRes = await fetch('/api/network-info');
        const contentType = netRes.headers.get('content-type') || '';
        if (netRes.ok && contentType.includes('application/json')) {
          const netData = await netRes.json().catch(() => null);
          if (netData?.success) {
            setNetworkInfo(netData);
            return;
          }
        }
      } catch (e) {}

      const publicUrl = import.meta.env.VITE_PUBLIC_URL || (window.location.origin + '/');
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#0c2419', light: '#ffffff' }
      }).catch(() => '');

      setNetworkInfo({
        success: true,
        currentIp: window.location.hostname,
        port: Number(window.location.port) || (window.location.protocol === 'https:' ? 443 : 80),
        menuUrl: publicUrl,
        qrDataUrl,
        availableIps: [{ name: 'Cloud / Public URL', address: publicUrl }]
      });
    } catch (err: any) {
      showNotice('error', 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setIsSearchOpen(true);
    if (q.trim().length > 0 && categoryFilter !== 'all') {
      setCategoryFilter('all');
    }
  };

  const handleSearchSubmit = () => {
    setIsSearchOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    setTimeout(() => {
      const tableEl = document.getElementById('admin-items-table');
      if (tableEl) {
        tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleSelectRecommendation = (dish: MenuItem) => {
    setSearchQuery(dish.name);
    setCategoryFilter('all');
    setIsSearchOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    setTimeout(() => {
      const rowEl = document.getElementById(`admin-item-${dish.id}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowEl.classList.add('bg-gold-500/20', 'ring-2', 'ring-gold-400');
        setTimeout(() => {
          rowEl.classList.remove('bg-gold-500/20', 'ring-2', 'ring-gold-400');
        }, 2200);
      } else {
        const tableEl = document.getElementById('admin-items-table');
        if (tableEl) {
          tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const newAvail = !item.availability;
      const res = await updateItemAvailability(item, newAvail, token);
      if (!res.success) throw new Error(res.error || 'Failed to update availability');

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, availability: newAvail } : it))
      );
      showNotice('success', `Marked "${item.name}" as ${newAvail ? 'Available' : 'Unavailable'}`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Toggle availability for all items in an entire category at once
  const handleToggleCategoryAvailability = async (categoryId: string, makeAvailable: boolean) => {
    const cat = categories.find((c) => c.id === categoryId);
    const catName = cat?.name || categoryId;

    try {
      const res = await updateCategoryAvailability(categoryId, makeAvailable, token);
      if (!res.success) throw new Error(res.error || 'Failed to update category');

      setItems((prev) =>
        prev.map((item) =>
          item.categoryId === categoryId ? { ...item, availability: makeAvailable } : item
        )
      );

      showNotice(
        'success',
        `Turned ${makeAvailable ? 'ON' : 'OFF'} all dishes in "${catName}"`
      );
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Toggle availability for all selected items
  const handleBulkSelectedAvailability = async (makeAvailable: boolean) => {
    if (selectedItemIds.size === 0) return;
    const idsArray = Array.from(selectedItemIds);

    try {
      const res = await updateBulkAvailability(idsArray, makeAvailable, token);
      if (!res.success) throw new Error(res.error || 'Failed to update selected items');

      const idSet = new Set(idsArray);
      setItems((prev) =>
        prev.map((item) =>
          idSet.has(item.id) ? { ...item, availability: makeAvailable } : item
        )
      );

      setSelectedItemIds(new Set());
      showNotice(
        'success',
        `Turned ${makeAvailable ? 'ON' : 'OFF'} ${idsArray.length} selected dishes`
      );
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Checkbox toggle helpers
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((it) => it.id)));
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const res = await deleteItem(deletingItem.id, token);
      if (!res.success) throw new Error(res.error || 'Failed to delete item');

      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      showNotice('success', `Deleted "${deletingItem.name}"`);
      setDeletingItem(null);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Open Edit Item
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormItem({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      subcategory: item.subcategory || '',
      price: item.price,
      type: item.type,
      availability: item.availability,
      description: item.description || ''
    });
  };

  // Save Item (Add or Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.name || !formItem.categoryId || formItem.price === '') {
      showNotice('error', 'Please fill in Name, Category, and Price');
      return;
    }

    try {
      const res = await saveItem(formItem, Boolean(editingItem), categories, token);
      if (!res.success) throw new Error(res.error || 'Failed to save item');

      showNotice('success', editingItem ? 'Item updated successfully' : 'Item created successfully');
      setEditingItem(null);
      setIsNewItemModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      showNotice('error', 'New passwords do not match');
      return;
    }
    if (pwNew.length < 6) {
      showNotice('error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setPwLoading(true);
      const res = await changePassword(pwNew, pwCurrent, token);
      if (!res.success) throw new Error(res.error || 'Password update failed');

      showNotice('success', 'Admin password successfully changed');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setPwLoading(false);
    }
  };

  // Change Username
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsernameInput.trim() || !userPwVerify) {
      showNotice('error', 'New username and current password are required');
      return;
    }

    try {
      setUserLoading(true);
      const res = await changeUsername(newUsernameInput.trim(), userPwVerify, token);
      if (!res.success) throw new Error(res.error || 'Failed to update username');

      setCurrentAdminUsername(newUsernameInput.trim());
      if (onUpdateUsername) {
        onUpdateUsername(newUsernameInput.trim(), res.token);
      }
      setNewUsernameInput('');
      setUserPwVerify('');
      showNotice('success', 'Username changed successfully');
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setUserLoading(false);
    }
  };

  // JSON Export (works offline and online)
  const handleExportJson = () => {
    try {
      const backupData = {
        success: true,
        restaurant,
        categories,
        items,
        count: items.length,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sree_mk_menu_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('success', 'Menu JSON backup exported successfully');
    } catch (e: any) {
      window.location.href = `/api/admin/export?token=${token}`;
    }
  };

  // SQLite DB Backup Download
  const handleDownloadDb = () => {
    window.location.href = `/api/admin/backup-db?token=${token}`;
  };

  // JSON Import
  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!confirm(`Are you sure you want to import this JSON? It contains ${parsed.items?.length || 0} items and will update the menu database.`)) {
        return;
      }

      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: text
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (res.ok && data?.success) {
            showNotice('success', data.message || 'Menu imported successfully');
            loadData();
            return;
          }
        }
      }

      if (parsed.items && Array.isArray(parsed.items)) {
        localStorage.setItem(
          'sree_mk_cached_menu_data',
          JSON.stringify({
            success: true,
            restaurant: parsed.restaurant || restaurant,
            categories: parsed.categories || categories,
            items: parsed.items,
            count: parsed.items.length,
            lastUpdated: new Date().toISOString()
          })
        );
        showNotice('success', `Successfully imported ${parsed.items.length} items`);
        loadData();
      }
    } catch (err: any) {
      showNotice('error', `Import error: ${err.message}`);
    }
  };

  // Filtered Items for Admin with spelling tolerance
  const filteredItems = useMemo(() => {
    let candidates = items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      return true;
    });

    if (searchQuery.trim().length > 0) {
      let results = searchMenuItems(candidates, searchQuery);
      if (categoryFilter !== 'all') {
        results = results.filter((item) => item.categoryId === categoryFilter);
      }
      return results;
    }

    if (categoryFilter !== 'all') {
      candidates = candidates.filter((item) => item.categoryId === categoryFilter);
    }

    return candidates;
  }, [items, categoryFilter, typeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-forest-950 text-cream-50 flex flex-col">
      
      {/* Admin Navbar */}
      <header className="bg-forest-900 border-b border-gold-600/30 px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800 border border-gold-500/50 flex items-center justify-center text-gold-400 font-bold">
              MK
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-gold-400 leading-tight">
                Sree MK Food Court — Admin Portal
              </h1>
              <p className="text-[11px] text-cream-300">
                Logged in as <strong className="text-white">{currentAdminUsername}</strong> • Local SQLite Database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onPreviewMenu}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-forest-800 hover:bg-forest-700 text-gold-300 border border-forest-600 rounded-lg text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Menu</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-red-950 border-red-500 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-forest-900/60 border-b border-forest-800 px-4">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'items'
                ? 'bg-gold-500 text-forest-950 shadow'
                : 'text-cream-200 hover:bg-forest-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu Items ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'qr'
                ? 'bg-gold-500 text-forest-950 shadow'
                : 'text-cream-200 hover:bg-forest-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR & Local Wi-Fi</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'backup'
                ? 'bg-gold-500 text-forest-950 shadow'
                : 'text-cream-200 hover:bg-forest-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Export</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'settings'
                ? 'bg-gold-500 text-forest-950 shadow'
                : 'text-cream-200 hover:bg-forest-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Settings</span>
          </button>

        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        
        {/* ================= TAB 1: MENU ITEMS ================= */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            
            {/* Top Toolbar */}
            <div className="bg-forest-900 border border-forest-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow">
              
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                
                {/* Search Box with Mobile/Dropdown Recommendations */}
                <div ref={searchContainerRef} className="relative flex-1 min-w-[240px]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchSubmit();
                    }}
                    action="javascript:void(0);"
                    role="search"
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gold-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={searchQuery}
                        onFocus={() => setIsSearchOpen(true)}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search 240+ dishes, biryani, pizzas, mojitos..."
                        className="w-full bg-forest-950 border border-forest-700 rounded-xl pl-9 pr-8 py-2 text-xs text-cream-50 focus:outline-none focus:border-gold-500 shadow-inner"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                            setIsSearchOpen(true);
                          }}
                          className="absolute right-2.5 top-2.5 text-cream-300 hover:text-white"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      aria-label="Search"
                      className="bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-forest-950 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow transition flex-shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </form>

                  {/* Recommendations Dropdown (Directly Below Search Bar) */}
                  {isSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-forest-950 border border-gold-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[60vh] flex flex-col divide-y divide-forest-800/80">
                      
                      <div className="px-3.5 py-2 bg-forest-900/90 flex items-center justify-between text-xs">
                        <span className="font-bold text-gold-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                          {searchQuery.trim().length > 0
                            ? `Recommended Matches (${Math.min(filteredItems.length, 8)})`
                            : 'Popular Recommendations'}
                        </span>
                        <span className="text-[10px] text-cream-400">
                          {searchQuery.trim().length > 0 ? `${filteredItems.length} total found` : 'Tap to search'}
                        </span>
                      </div>

                      <div className="overflow-y-auto divide-y divide-forest-800/60 max-h-[45vh] overscroll-contain">
                        {searchQuery.trim().length > 0 ? (
                          filteredItems.length > 0 ? (
                            filteredItems.slice(0, 8).map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectRecommendation(item)}
                                className="px-3 py-2.5 hover:bg-forest-900/80 active:bg-forest-900 flex items-center justify-between gap-2.5 cursor-pointer transition text-xs"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                  <div className={`food-type-icon food-type-${item.type} !w-3.5 !h-3.5`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-cream-50 truncate block">
                                        {item.name}
                                      </span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                        item.availability 
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' 
                                          : 'bg-red-950 text-red-300 border border-red-800/60'
                                      }`}>
                                        {item.availability ? 'Available' : 'Unavailable'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[11px] text-cream-300">
                                      <span className="text-gold-400 font-medium">{item.category}</span>
                                      <span>•</span>
                                      <span className="font-bold text-gold-300">{formatPrice(item.price)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center space-x-1.5 flex-shrink-0 pl-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition ${
                                      item.availability
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                                        : 'bg-red-950/80 text-red-300 border-red-800/60 hover:bg-red-900'
                                    }`}
                                    title="Toggle availability"
                                  >
                                    {item.availability ? 'Avail' : 'Unavail'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsSearchOpen(false);
                                      handleOpenEdit(item);
                                    }}
                                    className="p-1 text-cream-300 hover:text-gold-400 bg-forest-900 rounded-lg border border-forest-700 transition"
                                    title="Edit item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 px-4 text-center space-y-1">
                              <p className="text-xs font-semibold text-cream-200">No dishes found matching "{searchQuery}"</p>
                              <p className="text-[11px] text-cream-400">Try checking spelling or search for biryani, noodles, starters</p>
                            </div>
                          )
                        ) : (
                          <div className="p-3">
                            <p className="text-[11px] text-cream-400 mb-2">Popular dish searches:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {POPULAR_ADMIN_SEARCHES.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    handleSearchChange(tag);
                                    if (searchInputRef.current) searchInputRef.current.focus();
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-forest-900 hover:bg-forest-800 border border-forest-700 text-gold-300 text-xs font-medium transition active:scale-95"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {searchQuery.trim().length > 0 && filteredItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="w-full py-2.5 px-3 bg-forest-900/90 hover:bg-forest-800 text-center text-xs font-bold text-gold-400 border-t border-forest-800 flex items-center justify-center gap-1.5 transition"
                        >
                          <span>View all {filteredItems.length} matching dishes in table</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-500"
                >
                  <option value="all">All Categories ({items.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Dietary Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-500"
                >
                  <option value="all">All Types</option>
                  <option value="veg">Veg Only</option>
                  <option value="non-veg">Non-Veg Only</option>
                  <option value="egg">Egg Only</option>
                </select>

                {/* Result count badge */}
                <span className="text-[11px] text-cream-300 whitespace-nowrap px-1">
                  <strong className="text-gold-400">{filteredItems.length}</strong> items
                </span>
              </div>

              {/* Add New Item Button */}
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormItem({
                    name: '',
                    categoryId: categories[0]?.id || '',
                    subcategory: '',
                    price: '',
                    type: 'veg',
                    availability: true,
                    description: ''
                  });
                  setIsNewItemModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl text-xs shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Menu Item</span>
              </button>

            </div>

            {/* Category Quick Actions Banner (Visible when a specific category is selected in the filter) */}
            {(() => {
              if (categoryFilter === 'all') return null;
              const cat = categories.find((c) => c.id === categoryFilter);
              if (!cat) return null;
              const catItems = items.filter((it) => it.categoryId === categoryFilter);
              const availCount = catItems.filter((it) => it.availability).length;
              const unavailCount = catItems.length - availCount;

              return (
                <div className="bg-forest-900 border border-gold-500/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-8 bg-gold-500 rounded-sm" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gold-300 text-sm sm:text-base">
                          {cat.name} ({catItems.length} Dishes)
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-forest-950 text-cream-300 border border-forest-800">
                          Category Controls
                        </span>
                      </div>
                      <p className="text-xs text-cream-300">
                        Current Status: <strong className="text-emerald-400">{availCount} Available</strong> • <strong className="text-red-400">{unavailCount} Unavailable</strong>
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Category Turn Off / Turn On Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryAvailability(cat.id, false)}
                      disabled={availCount === 0}
                      className="px-3.5 py-2 bg-red-950/90 hover:bg-red-900 disabled:opacity-30 disabled:pointer-events-none text-red-200 border border-red-700/70 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Turn OFF All {cat.name} ({catItems.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryAvailability(cat.id, true)}
                      disabled={unavailCount === 0}
                      className="px-3.5 py-2 bg-emerald-950/90 hover:bg-emerald-900 disabled:opacity-30 disabled:pointer-events-none text-emerald-200 border border-emerald-700/70 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Turn ON All {cat.name} ({catItems.length})</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Bulk Selection Action Bar (Appears when 1 or more items are selected) */}
            {selectedItemIds.size > 0 && (
              <div className="bg-forest-950 border border-gold-500/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl sticky top-20 z-20 animate-in fade-in">
                <div className="flex items-center space-x-2.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                  <span className="font-bold text-gold-300">
                    {selectedItemIds.size} of {filteredItems.length} dishes selected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSelectedAvailability(false)}
                    className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 rounded-xl text-xs font-bold transition shadow flex items-center space-x-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Turn OFF Selected ({selectedItemIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkSelectedAvailability(true)}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 rounded-xl text-xs font-bold transition shadow flex items-center space-x-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Turn ON Selected ({selectedItemIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItemIds(new Set())}
                    className="px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-300 rounded-xl text-xs font-semibold border border-forest-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div id="admin-items-table" className="bg-forest-900 border border-forest-800 rounded-2xl overflow-hidden shadow-lg scroll-mt-20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-forest-950 text-gold-400 border-b border-forest-800 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={filteredItems.length > 0 && selectedItemIds.size === filteredItems.length}
                          onChange={handleSelectAllFiltered}
                          className="rounded border-forest-700 bg-forest-950 text-gold-500 focus:ring-gold-500 cursor-pointer w-4 h-4"
                          title="Select All Filtered"
                        />
                      </th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-center">Availability</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-800">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        id={`admin-item-${item.id}`}
                        className={`hover:bg-forest-850/60 transition duration-300 ${
                          selectedItemIds.has(item.id) ? 'bg-gold-500/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => handleToggleSelectItem(item.id)}
                            className="rounded border-forest-700 bg-forest-950 text-gold-500 focus:ring-gold-500 cursor-pointer w-4 h-4"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className={`food-type-icon food-type-${item.type}`} />
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-cream-50">{item.name}</div>
                          {item.subcategory && (
                            <div className="text-[10px] text-gold-400/80">{item.subcategory}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-cream-200">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gold-400">
                          {formatPrice(item.price)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                              item.availability
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                                : 'bg-red-950 text-red-300 border border-red-800/60 hover:bg-red-900'
                            }`}
                          >
                            {item.availability ? 'Available' : 'Unavailable'}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-cream-300 hover:text-gold-400 bg-forest-950 rounded-lg border border-forest-700 transition"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 text-red-400 hover:text-red-300 bg-forest-950 rounded-lg border border-forest-700 transition"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-cream-300">
                          No menu items match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: QR CODE & WI-FI ================= */}
        {activeTab === 'qr' && networkInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left: Printable QR Table Stand */}
            <div className="bg-forest-900 border border-gold-600/40 rounded-3xl p-6 text-center shadow-xl space-y-4">
              <div className="border-2 border-gold-500/50 p-6 rounded-2xl bg-white text-forest-950 shadow-inner print-card">
                <h3 className="font-serif font-black text-2xl text-forest-950 tracking-tight">
                  SREE MK FOOD COURT
                </h3>
                <p className="text-xs italic text-gold-700 font-serif font-bold tracking-widest mb-4">
                  Good Food. Good Mood.
                </p>

                <div className="inline-block p-2 bg-white rounded-xl border border-gray-300 shadow">
                  <img src={networkInfo.qrDataUrl} alt="Table Menu QR Code" className="w-64 h-64 mx-auto" />
                </div>

                <p className="text-sm font-bold text-forest-900 mt-4">
                  SCAN FOR DIGITAL MENU
                </p>
                <p className="text-[11px] text-gray-700 font-medium">
                  Connect to Wi-Fi: <strong>Sree MK Food Court</strong>
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  {networkInfo.menuUrl}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl text-sm shadow flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Stand Card</span>
              </button>
            </div>

            {/* Right: Network Interface Details & Troubleshooting */}
            <div className="space-y-4">
              <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow">
                <div className="flex items-center space-x-2 text-gold-400 mb-2">
                  <Wifi className="w-5 h-5" />
                  <h3 className="text-base font-serif font-bold">Local Wi-Fi Network Setup</h3>
                </div>
                <p className="text-xs text-cream-200 leading-relaxed mb-4">
                  This server is actively listening on all local network adapters (`0.0.0.0`). Any phone connected to the same Wi-Fi router can view the menu without internet.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="bg-forest-950 p-3 rounded-xl border border-forest-800">
                    <span className="text-cream-400 block text-[10px]">Active Laptop IPv4 Address:</span>
                    <strong className="text-base font-mono text-gold-300">{networkInfo.currentIp}</strong>
                    <span className="text-cream-400 block text-[10px] mt-1">Listening Port: {networkInfo.port}</span>
                  </div>

                  <div className="bg-forest-950 p-3 rounded-xl border border-forest-800">
                    <span className="text-cream-400 block text-[10px]">Direct Mobile URL:</span>
                    <a
                      href={networkInfo.menuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-400 underline font-mono text-xs break-all"
                    >
                      {networkInfo.menuUrl}
                    </a>
                  </div>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="bg-forest-900/60 border border-forest-800 rounded-2xl p-5 text-xs text-cream-200 space-y-2">
                <h4 className="font-bold text-gold-400">Windows Offline Wi-Fi Guide:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-cream-300">
                  <li>Keep the restaurant Wi-Fi router powered on (it does not require internet cables).</li>
                  <li>Connect this laptop to the router Wi-Fi.</li>
                  <li>Allow Node.js through Windows Defender Firewall for Private Networks if prompted.</li>
                  <li>Customers connect to the same Wi-Fi and scan the table QR code.</li>
                </ol>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: BACKUP & RESTORE ================= */}
        {activeTab === 'backup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* JSON Export Card */}
            <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow space-y-3">
              <div className="flex items-center space-x-2 text-gold-400">
                <Download className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold">Export Menu Data (JSON)</h3>
              </div>
              <p className="text-xs text-cream-200">
                Download a complete, validated backup of all 240+ menu items, categories, and restaurant settings as a single portable JSON file.
              </p>
              <button
                onClick={handleExportJson}
                className="px-4 py-2.5 bg-forest-800 hover:bg-forest-700 text-gold-300 border border-gold-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Menu JSON</span>
              </button>
            </div>

            {/* JSON Import Card */}
            <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow space-y-3">
              <div className="flex items-center space-x-2 text-gold-400">
                <Upload className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold">Import Menu Data (JSON)</h3>
              </div>
              <p className="text-xs text-cream-200">
                Restore or replace the entire menu database from an existing exported JSON file.
              </p>
              <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl text-xs cursor-pointer shadow transition">
                <Upload className="w-4 h-4" />
                <span>Select & Import JSON File</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>

            {/* SQLite DB Raw Backup */}
            <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow space-y-3">
              <div className="flex items-center space-x-2 text-gold-400">
                <Database className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold">Raw SQLite Database File (.db)</h3>
              </div>
              <p className="text-xs text-cream-200">
                Download the actual SQLite binary database file stored on this laptop (`sree_mk_menu.db`).
              </p>
              <button
                onClick={handleDownloadDb}
                className="px-4 py-2.5 bg-forest-800 hover:bg-forest-700 text-cream-100 border border-forest-700 rounded-xl text-xs font-bold transition flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Download sree_mk_menu.db</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= TAB 5: SECURITY & SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Change Username Card */}
            <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow">
              <div className="flex items-center space-x-2 text-gold-400 mb-4">
                <User className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold">Change Admin Username</h3>
              </div>

              <div className="bg-forest-950/80 border border-forest-800 rounded-xl p-3 mb-4 text-xs">
                <p className="text-cream-300">
                  Current Username: <strong className="text-gold-300 font-mono text-sm">{currentAdminUsername}</strong>
                </p>
                <p className="text-[11px] text-cream-400 mt-0.5">
                  You will use this new username to log into the admin dashboard on this laptop or over Wi-Fi.
                </p>
              </div>

              <form onSubmit={handleChangeUsername} className="space-y-3 text-xs">
                <div>
                  <label className="block text-cream-200 mb-1">New Admin Username</label>
                  <input
                    type="text"
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value)}
                    className="w-full bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500 font-mono"
                    placeholder="Enter new username (e.g. manager, sreemk_admin)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cream-200 mb-1">Current Password (to verify identity)</label>
                  <input
                    type="password"
                    value={userPwVerify}
                    onChange={(e) => setUserPwVerify(e.target.value)}
                    className="w-full bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="Enter current admin password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="w-full py-2.5 mt-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{userLoading ? 'Updating Username...' : 'Save New Username'}</span>
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow">
              <div className="flex items-center space-x-2 text-gold-400 mb-4">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold">Change Admin Password</h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-cream-200 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    className="w-full bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cream-200 mb-1">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    className="w-full bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="Enter new strong password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cream-200 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="w-full bg-forest-950 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="Repeat new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2.5 mt-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {pwLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </div>

            {/* Restaurant Info Summary */}
            {restaurant && (
              <div className="bg-forest-900 border border-forest-800 rounded-2xl p-5 shadow text-xs space-y-2">
                <h4 className="font-bold text-gold-400 text-sm">Restaurant Info</h4>
                <p><strong>Name:</strong> {restaurant.name}</p>
                <p><strong>Tagline:</strong> {restaurant.tagline}</p>
                <p><strong>Phones:</strong> {restaurant.phones.join(', ')}</p>
                <p className="text-[11px] text-cream-400 italic">
                  Changes made here or via JSON import persist permanently in SQLite on this laptop.
                </p>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ================= MODAL: ADD / EDIT ITEM ================= */}
      {(isNewItemModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-forest-950 border border-gold-600/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <h3 className="text-lg font-serif font-bold text-gold-400">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-cream-200 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formItem.name}
                  onChange={(e) => setFormItem({ ...formItem, name: e.target.value })}
                  className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                  placeholder="e.g. Chicken Dum Biryani"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cream-200 mb-1">Category *</label>
                  <select
                    value={formItem.categoryId}
                    onChange={(e) => setFormItem({ ...formItem, categoryId: e.target.value })}
                    className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-cream-200 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formItem.subcategory}
                    onChange={(e) => setFormItem({ ...formItem, subcategory: e.target.value })}
                    className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="e.g. Non-Veg Biryani"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cream-200 mb-1">Price in INR (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formItem.price}
                    onChange={(e) => setFormItem({ ...formItem, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                    placeholder="149"
                    required
                  />
                </div>

                <div>
                  <label className="block text-cream-200 mb-1">Dietary Type *</label>
                  <select
                    value={formItem.type}
                    onChange={(e) => setFormItem({ ...formItem, type: e.target.value as FoodType })}
                    className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                  >
                    <option value="veg">🟢 Veg</option>
                    <option value="non-veg">🔴 Non-Veg</option>
                    <option value="egg">🟡 Egg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cream-200 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formItem.description}
                  onChange={(e) => setFormItem({ ...formItem, description: e.target.value })}
                  className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2 text-cream-50 focus:outline-none focus:border-gold-500"
                  placeholder="Appetizing description..."
                />
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formItem.availability}
                  onChange={(e) => setFormItem({ ...formItem, availability: e.target.checked })}
                  className="w-4 h-4 rounded text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor="availCheck" className="text-cream-200 font-semibold cursor-pointer">
                  Available for ordering today
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-forest-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsNewItemModalOpen(false);
                  }}
                  className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-300 rounded-xl border border-forest-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-bold rounded-xl shadow"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-forest-950 border border-red-500/50 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-red-950 border border-red-600 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-cream-50">Delete Menu Item?</h3>
            <p className="text-xs text-cream-200">
              Are you sure you want to permanently delete <strong className="text-white">"{deletingItem.name}"</strong>? This will remove it from the SQLite database.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-300 rounded-xl text-xs border border-forest-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
