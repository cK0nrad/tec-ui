import { create } from 'zustand'
import { Bus, Store, ViewState } from '@/components/type';

//@ts-ignore
import { FlyToInterpolator } from 'deck.gl';


type CurrentBusStore = ViewState & {
    setViewstate: (bus: ViewState) => void,
}

const DEFAULT_VALUE = {
    latitude: 50.6330,
    longitude: 5.5697,
    zoom: 8,
    bearing: 0,
    pitch: 0,
    transitionDuration: 1000,
    transitionInterpolator: new FlyToInterpolator()
}

const useViewportStore = create<CurrentBusStore>((set) => ({
    ...DEFAULT_VALUE,
    setViewstate: (vp) => set({ ...vp }),
}))

export default useViewportStore;
