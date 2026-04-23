import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface IdentityState {
  tempUserId: string | null;
  username: string | null;
  mcUsername: string | null;
  initialize: () => void;
  setUsername: (name: string) => void;
  setMcUsername: (name: string | null) => void;
}

const generateRandomUsername = () => {
    const prefixes = ['Creeper', 'Steve', 'Alex', 'Enderman', 'Hero', 'Miner', 'Crafter', 'Gamer', 'Zombie', 'Skeleton'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000);
    return `${prefix}_${number}`;
};

const generateUUID = () => {
    return crypto.randomUUID();
};

export const useIdentity = create<IdentityState>()(
  persist(
    (set, get) => ({
      tempUserId: null,
      username: null,
      mcUsername: null,
      
      initialize: () => {
        const state = get();
        if (!state.tempUserId || !state.username) {
            set({
                tempUserId: generateUUID(),
                username: generateRandomUsername()
            });
        }
      },

      setUsername: (name: string) => set({ username: name }),
      setMcUsername: (name: string | null) => set({ mcUsername: name }),
    }),
    {
      name: 'queuebuddy-identity', // name of the item in the storage (must be unique)
    }
  )
)
