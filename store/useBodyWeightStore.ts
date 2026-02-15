import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BodyWeightEntry {
  id: string;
  weight: number; // in kg
  date: Date;
  note?: string;
}

export interface BodyWeightGoal {
  targetWeight: number;
  targetDate?: Date;
  startWeight: number;
  startDate: Date;
}

interface BodyWeightState {
  entries: BodyWeightEntry[];
  goal: BodyWeightGoal | null;

  addEntry: (entry: Omit<BodyWeightEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<BodyWeightEntry>) => void;
  deleteEntry: (id: string) => void;
  setGoal: (goal: BodyWeightGoal | null) => void;
  getLatestWeight: () => number | null;
  getWeightChange: (days: number) => number | null;
}

export const useBodyWeightStore = create<BodyWeightState>()(
  persist(
    (set, get) => ({
      entries: [],
      goal: null,

      addEntry: (entry) => {
        const newEntry: BodyWeightEntry = {
          ...entry,
          id: `bw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: entry.date instanceof Date ? entry.date : new Date(entry.date),
        };

        set((state) => ({
          entries: [...state.entries, newEntry].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      setGoal: (goal) => {
        set({ goal });
      },

      getLatestWeight: () => {
        const { entries } = get();
        if (entries.length === 0) return null;
        return entries[0].weight;
      },

      getWeightChange: (days: number) => {
        const { entries } = get();
        if (entries.length < 2) return null;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentEntry = entries[0];
        const oldEntry = entries
          .filter((e) => new Date(e.date) <= cutoffDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!oldEntry) return null;

        return recentEntry.weight - oldEntry.weight;
      },
    }),
    {
      name: 'body-weight-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);

          // Convert date strings back to Date objects
          if (parsed.state.entries) {
            parsed.state.entries = parsed.state.entries.map((entry: any) => ({
              ...entry,
              date: new Date(entry.date),
            }));
          }

          if (parsed.state.goal) {
            parsed.state.goal = {
              ...parsed.state.goal,
              startDate: new Date(parsed.state.goal.startDate),
              targetDate: parsed.state.goal.targetDate
                ? new Date(parsed.state.goal.targetDate)
                : undefined,
            };
          }

          return parsed;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);
