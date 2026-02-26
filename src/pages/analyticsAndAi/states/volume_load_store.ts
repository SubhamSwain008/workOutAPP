import { create } from "zustand";

type VolumeLoadPoint = {
  date: string;
  volume_load: number;
  exerciseName: string;
};

type VolumeLoadState = {
  volumeLoadData: VolumeLoadPoint[];
  exerciseName: string;
  setExerciseName: (name: string) => void;
  setVolumeLoadData: (data: VolumeLoadPoint[]) => void;
};

export const useVolumeLoadStore = create<VolumeLoadState>((set) => ({
  exerciseName: "",
  volumeLoadData: [],

  setExerciseName: (name) => set({ exerciseName: name }),
  setVolumeLoadData: (data) => set({ volumeLoadData: data }),
}));
