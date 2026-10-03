import { MenuItem, Category } from '../types/menu';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthResult {
  success: boolean;
  token: string;
  username: string;
  error?: string;
}

export async function loginAdmin(identifier: string, password: string): Promise<AuthResult> {
  // 1. Try Supabase Auth if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const email = identifier.includes('@')
        ? identifier.trim()
        : `${identifier.trim().toLowerCase()}@sreemkfoodcourt.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        const username = data.user?.email?.split('@')[0] || identifier;
        localStorage.setItem('sree_mk_admin_token', data.session.access_token);
        localStorage.setItem('sree_mk_admin_user', username);
        return {
          success: true,
          token: data.session.access_token,
          username
        };
      }
    } catch (err: any) {
      console.warn('Supabase auth failed, checking local API fallback:', err);
      // If Supabase returned an explicit auth error, return it unless we can try local
      if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return {
          success: false,
          token: '',
          username: '',
          error: err.message || 'Invalid email or password'
        };
      }
    }
  }

  // 2. Try Local Express Server API fallback
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }

    localStorage.setItem('sree_mk_admin_token', data.token);
    localStorage.setItem('sree_mk_admin_user', data.user.username);
    return {
      success: true,
      token: data.token,
      username: data.user.username
    };
  } catch (err: any) {
    return {
      success: false,
      token: '',
      username: '',
      error: err.message || 'Authentication failed. Please check credentials.'
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('sree_mk_admin_token');
  localStorage.removeItem('sree_mk_admin_user');
}

export async function updateItemAvailability(
  item: MenuItem,
  newAvail: boolean,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('menu_items')
      .update({ availability: newAvail })
      .eq('id', item.id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const res = await fetch(`/api/admin/items/${item.id}/availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ availability: newAvail })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || 'Failed to update availability' };
  }
  return { success: true };
}

export async function updateCategoryAvailability(
  categoryId: string,
  newAvail: boolean,
  token: string
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ availability: newAvail })
      .eq('category_id', categoryId)
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, updatedCount: data?.length || 0 };
  }

  const res = await fetch(`/api/admin/categories/${categoryId}/availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ availability: newAvail })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to update category' };
  }
  return { success: true, updatedCount: data.updatedCount || 0 };
}

export async function updateBulkAvailability(
  itemIds: string[],
  newAvail: boolean,
  token: string
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ availability: newAvail })
      .in('id', itemIds)
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, updatedCount: data?.length || 0 };
  }

  const res = await fetch('/api/admin/items/bulk/availability', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ itemIds, availability: newAvail })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to update bulk items' };
  }
  return { success: true, updatedCount: data.updatedCount || 0 };
}

export async function deleteItem(
  itemId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const res = await fetch(`/api/admin/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || 'Failed to delete item' };
  }
  return { success: true };
}

export async function saveItem(
  itemData: any,
  isEdit: boolean,
  categories: Category[],
  token: string
): Promise<{ success: boolean; item?: MenuItem; error?: string }> {
  const cat = categories.find((c) => c.id === itemData.categoryId);
  const categoryName = cat?.name || itemData.categoryId;

  if (isSupabaseConfigured && supabase) {
    const payload = {
      name: itemData.name.trim(),
      category_id: itemData.categoryId,
      category_name: categoryName,
      subcategory: itemData.subcategory || '',
      price: Number(itemData.price),
      type: itemData.type,
      availability: itemData.availability !== false,
      description: itemData.description || ''
    };

    if (isEdit) {
      const { data, error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', itemData.id)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, item: data };
    } else {
      const newId = itemData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `item-${Date.now()}`;

      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          id: newId,
          ...payload,
          original_name: itemData.name.trim(),
          display_order: 999
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, item: data };
    }
  }

  const url = isEdit ? `/api/admin/items/${itemData.id}` : '/api/admin/items';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...itemData,
      price: Number(itemData.price)
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to save item' };
  }
  return { success: true, item: data.item };
}

export async function changePassword(
  newPw: string,
  currentPw: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: currentPw,
      newPassword: newPw
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Password update failed' };
  }
  return { success: true };
}

export async function changeUsername(
  newUsername: string,
  passwordVerify: string,
  token: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const email = newUsername.includes('@')
      ? newUsername.trim()
      : `${newUsername.trim().toLowerCase()}@sreemkfoodcourt.com`;

    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const res = await fetch('/api/admin/change-username', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      newUsername,
      password: passwordVerify
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to change username' };
  }
  return { success: true, token: data.token };
}
