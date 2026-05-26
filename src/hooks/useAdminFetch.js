import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useAdminFetch() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const request = useCallback(async (url, options = {}) => {
    const { headers: extraHeaders, ...rest } = options;
    const isFormData = rest.body instanceof FormData;

    const res = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...extraHeaders,
      },
    });

    if (res.status === 401) {
      logout();
      navigate('/admin/login');
      return null;
    }

    return res;
  }, [logout, navigate]);

  return { request };
}
