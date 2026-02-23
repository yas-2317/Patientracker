'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hashPin, verifyPin, savePin, loadPinHash } from '@/lib/security';

type AuthContextValue = {
  isAuthenticated: boolean;
  hasPin: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  setPin: (pin: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    const stored = loadPinHash();
    if (stored) {
      setHasPin(true);
    } else {
      // PIN 未設定時はロックなし
      setIsAuthenticated(true);
    }
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const stored = loadPinHash();
    if (!stored) return false;
    const ok = await verifyPin(pin, stored);
    if (ok) setIsAuthenticated(true);
    return ok;
  }, []);

  const lock = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const setPin = useCallback(async (pin: string): Promise<void> => {
    const hash = await hashPin(pin);
    savePin(hash);
    setHasPin(true);
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, hasPin, unlock, lock, setPin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
