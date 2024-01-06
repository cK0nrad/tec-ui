// Here we are using a unique massive data store for all the components. Gotta track the types somehow.

type MapStop = [
    string,
    {
        x: number,
        y: number,
    }
]

type Stop = {
    stop: StopMeta;
    coord: [number, number];
    arrival_time: number;
    stop_sequence: number,
}

type StopMeta = {
    stop_id: string,
    stop_name: string,
    stop_lon: number,
    stop_lat: number,
}

type Bus = {
    current_stop: number;
    id: string;
    last_update: number;
    latitude: number;
    longitude: number;
    line: string; //shortname
    line_id: string;
    speed: number;
    trip_id: string;
}

type UiData = {
    longName: string;
    id: string;
}

interface Store {
    realPercentage: number;
    theoricalPercentage: number;
    currentBus: Bus;
    currentLineStops: Stop[];
    uiData: UiData;
    currentStop: number;
    currentTheoricalStop: number;
    currentLinePath: [{ path: [number, number][] }];
    setRealPercentage: (by: number) => void
    setTheoricalPercentage: (by: number) => void
    setCurrentBus: (bus: Bus) => void
    setCurrentLineStops: (stops: Stop[]) => void
    setUiData: (data: UiData) => void
    setCurrentStop: (stop: number) => void
    setCurrentTheoricalStop: (stop: number) => void
    setCurrentLinePath: (path: [{ path: [number, number][] }]) => void
}


export type { Store, Bus, UiData, Stop, StopMeta, MapStop };
