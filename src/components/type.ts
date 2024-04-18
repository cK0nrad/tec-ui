// Here we are using a unique massive data store for all the components. Gotta track the types somehow.
// @ts-ignore
import FlyToInterpolator from "@deck.gl/core/transitions/viewport-fly-to-interpolator";

export const MAX_ZOOM: number = 8

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
    stop_lon: string,
    stop_lat: string,
}

type Bus = {
    next_stop: number;
    theorical_stop: number;

    id: string;
    line: string; //shortname
    line_id: string;
    last_update: number;
    latitude: number;
    longitude: number;
    average_speed: number;
    trip_id: string;

    remaining_distance: number;
    delay: number;

}

type UiData = {
    longName: string;
    id: string;
}

type ViewState = {
    latitude: number,
    longitude: number,
    zoom: number,
    bearing: number,
    pitch: number,
    transitionDuration: number,
    transitionInterpolator: FlyToInterpolator
}

type Viewport = {
    north: number,
    east: number,
    south: number,
    west: number,
    zoom: number
}

export type { Bus, UiData, Stop, StopMeta, MapStop, ViewState, Viewport };
