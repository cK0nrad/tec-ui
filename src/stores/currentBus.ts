import { create } from 'zustand'
import { Bus } from '@/components/type';


type CurrentBusStore = Bus & {
    isBusActive: boolean,
    setBus: (bus: Bus) => void,
    removeBus: () => void,
}


const DEFAULT_VALUE = {
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
    delay: 0,

    isBusActive: false
}

const useCurrentBusStore = create<CurrentBusStore>((set) => ({
    ...DEFAULT_VALUE,
    isBusActive: false,
    setBus: (bus) => set({ ...bus, isBusActive: true }),
    removeBus: () => set({ ...DEFAULT_VALUE }),
}))

export default useCurrentBusStore;
