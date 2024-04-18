import { create } from 'zustand'
import { Bus, MapStop, Stop, UiData, Viewport } from '@/components/type';


type LinePath = [{ path: [number, number][] }]

type CurrentBusStore = {
    setUiData: (data: UiData) => void;
    setCurrentLineStops: (stops: Stop[]) => void;
    setCurrentLinePath: (path: LinePath) => void;
    currentLineStops: Stop[];
    currentLinePath: LinePath;
    uiData: UiData;
    nextStop: string;

    currentStop: number;
    setCurrentStop: (stop: number) => void;

    activeBuses: Bus[];
    showStops: boolean;

    stopsList: MapStop[];

    setShowStops: (show: boolean) => void;
    setActiveBuses: (buses: Bus[]) => void;
    setNextStop: (stop: string) => void;
    setStopsList: (stops: MapStop[]) => void;

    viewport: Viewport
    setViewport: (viewport: Viewport) => void;

    currentTheoricalStop: number,
    setCurrentTheoricalStop: (stop: number) => void,
    theoricalPercentage: number,
    setTheoricalPercentage: (percentage: number) => void,
    realPercentage: number,
    setRealPercentage: (percentage: number) => void,

    theme: 'light' | 'dark'
    setTheme: (theme: "light" | 'dark') => void;
}

const DEFAULT_VALUE = {
    uiData: {
        longName: '',
        id: '',
    },
    currentLinePath: [{ path: [] }] as LinePath,
    currentLineStops: [],
    nextStop: "",
    activeBuses: [],
    showStops: false,
    stopsList: [],
    viewport: {
        north: 0,
        east: 0,
        south: 0,
        west: 0,
        zoom: 0
    },
    currentStop: 0,

    currentTheoricalStop: 0,
    theoricalPercentage: 0,
    realPercentage: 0,
    theme: "light" as 'light' | 'dark'
}

const useDataStore = create<CurrentBusStore>((set) => ({
    ...DEFAULT_VALUE,
    setUiData: (data) => set({ uiData: data }),
    setCurrentLineStops: (stops) => set({ currentLineStops: stops }),
    setCurrentLinePath: (path) => set({ currentLinePath: path }),
    setNextStop: (stop) => set({ nextStop: stop }),
    setActiveBuses: (buses) => set({ activeBuses: buses }),
    setShowStops: (show) => set({ showStops: show }),
    setStopsList: (stops) => set({ stopsList: stops }),
    setViewport: (viewport) => set({ viewport: viewport }),
    setCurrentStop: (stop) => set({ currentStop: stop }),
    setCurrentTheoricalStop: (stop) => set({ currentTheoricalStop: stop }),
    setTheoricalPercentage: (percentage) => set({ theoricalPercentage: percentage }),
    setRealPercentage: (percentage) => set({ realPercentage: percentage }),
    setTheme: (theme) => set({ theme: theme })
}))

export default useDataStore;
