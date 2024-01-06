import { create } from 'zustand'
import { Store } from '@/components/type';

const useStore = create<Store>((set) => ({
    realPercentage: 0,
    theoricalPercentage: 0,
    currentBus: {
        current_stop: 0,
        id: '',
        last_update: 0,
        latitude: 0,
        longitude: 0,
        line: '',
        line_id: '',
        speed: 0,
        trip_id: '',
    },
    currentLineStops: [],
    uiData: {
        longName: '',
        id: '',
    },
    currentLinePath: [{path: []}],
    currentStop: 0,
    currentTheoricalStop: 0,
    setRealPercentage: (by) => set({ realPercentage: by }),
    setTheoricalPercentage: (by) => set({ theoricalPercentage: by }),
    setCurrentBus: (bus) => set({ currentBus: bus }),
    setCurrentLineStops: (stops) => set({ currentLineStops: stops }),
    setUiData: (data) => set({ uiData: data }),
    setCurrentStop: (stop) => set({ currentStop: stop }),
    setCurrentTheoricalStop: (stop) => set({ currentTheoricalStop: stop }),
    setCurrentLinePath: (path) => set({ currentLinePath: path }),
}))


export default useStore;