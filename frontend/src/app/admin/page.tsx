'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push('/login');
      return;
    }

    const user = session.user as any;
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [session, isPending, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        // Optimistically update
        setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user', error);
    }
  };

  if (isPending || loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, approvals, and roles.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map(u => (
            <div key={u.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* User Info */}
              <div className="flex flex-col flex-1">
                <div className="font-medium text-gray-900 dark:text-white text-lg">{u.name}</div>
                <div className="text-sm text-gray-500 mb-2">{u.email}</div>
                
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                    u.accountStatus === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    u.accountStatus === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {u.accountStatus.toUpperCase()}
                  </span>
                  
                  <span className={`px-2 py-1 text-xs font-semibold rounded w-fit ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row md:flex-col lg:flex-row gap-2 shrink-0 border-t border-gray-100 dark:border-gray-700 md:border-0 pt-4 md:pt-0">
                {u.accountStatus === 'pending' || u.accountStatus === 'suspended' ? (
                  <button 
                    onClick={() => updateUser(u.id, { accountStatus: 'active' })}
                    className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Activate
                  </button>
                ) : (
                  <button 
                    onClick={() => updateUser(u.id, { accountStatus: 'suspended' })}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Suspend
                  </button>
                )}

                {u.role !== 'admin' && (
                  <button 
                    onClick={() => updateUser(u.id, { role: 'admin' })}
                    className="flex-1 md:flex-none px-4 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-sm font-medium rounded-lg transition-colors bg-white dark:bg-transparent shadow-sm"
                  >
                    Make Admin
                  </button>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
