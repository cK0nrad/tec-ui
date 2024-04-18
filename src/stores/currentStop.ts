import { create } from 'zustand'
import { Stop } from '@/components/type';


type CurrentStopStore = Stop & {
    isStopActive: boolean,
    setStop: (stop: Stop) => void,
    removeStop: () => void,
}


const DEFAULT_VALUE = {
    stop: {
        stop_id: '',
        stop_name: '',
        stop_lon: '',
        stop_lat: '',
    },
    coord: [0, 0] as [number, number],
    arrival_time: 0,
    stop_sequence: 0,
    isStopActive: false,
}

const useCurrentStopStore = create<CurrentStopStore>((set) => ({
    ...DEFAULT_VALUE,
    setStop: (stop) => set({ ...stop, isStopActive: true }),
    removeStop: () => set({ ...DEFAULT_VALUE }),
}))

export default useCurrentStopStore;
