import { create } from 'zustand'
import { Store } from '@/components/type';

const useStore = create<Store>((set) => ({
    realPercentage: 0,
    theoricalPercentage: 0,
    currentBus: {
        next_stop: 0,
        theorical_stop: 0,
        id: '',
        last_update: 0,
        latitude: 0,
        longitude: 0,
        line: '',
        line_id: '',
        average_speed: 0,
        trip_id: '',
        remaining_distance: 0,
        delay: 0
    },
    currentLineStops: [],
    uiData: {
        longName: '',
        id: '',
    },
    currentLinePath: [{ path: [] }],
    currentStop: 0,
    currentTheoricalStop: 0,
    showUi: false,
    setRealPercentage: (by) => set({ realPercentage: by }),
    setTheoricalPercentage: (by) => set({ theoricalPercentage: by }),
    setCurrentBus: (bus) => set({ currentBus: bus }),
    setCurrentLineStops: (stops) => set({ currentLineStops: stops }),
    setUiData: (data) => set({ uiData: data }),
    setCurrentStop: (stop) => set({ currentStop: stop }),
    setCurrentTheoricalStop: (stop) => set({ currentTheoricalStop: stop }),
    setCurrentLinePath: (path) => set({ currentLinePath: path }),
    setShowUi: (show) => set({ showUi: show }),
}))


export default useStore;