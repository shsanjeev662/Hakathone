export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredUser>;
    if (!parsed.id || !parsed.role || !parsed.name || !parsed.email) {
      return null;
    }
    return parsed as StoredUser;
  } catch {
    return null;
  }
};
