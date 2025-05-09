import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { userApi } from '../services/api';

interface UserContextType {
  users: Record<string, User>;
  loadingUsers: boolean;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const allUsers = await userApi.getAll();
      
      // Convert array to record for faster lookups
      const usersRecord: Record<string, User> = {};
      allUsers.forEach(user => {
        usersRecord[user.id] = user;
      });
      
      setUsers(usersRecord);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    await fetchUsers();
  };

  return (
    <UserContext.Provider value={{ users, loadingUsers, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
};
