import { MapStop } from "@/components/type";
import { logError } from "./logger";

const earthMeasure = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6378.137;

    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

type GetStopsConstructor = {
    north: number,
    east: number,
    south: number,
    west: number,
    maxZoom: number,
    currentZoom: number,
}

const getStops = async (north: number, east: number, south: number, west: number): Promise<MapStop[]> => {
    try {
        const data = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/stops?north=${north}&east=${east}&south=${south}&west=${west}`);
        const json_data = await data.json()
        if (!json_data) return [];
        return json_data as MapStop[];
    } catch (e) {
        logError(`Error while fetching stops: ${e}`)
    }
    return []
}

const getBusIcon = (id: string) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createSVGIcon(id))}`

// const createSVGIcon = (id: string) =>
// `<svg viewBox="2 2 196 196" width="196" height="196" xmlns="http://www.w3.org/2000/svg">
// <ellipse style="fill: rgb(255, 255, 255); stroke: rgb(0, 0, 0); stroke-miterlimit: 1; stroke-width: 4px; paint-order: fill; fill-rule: nonzero;" cx="100" cy="100" rx="98" ry="98"/>

// <path d="M 99.5 59.445 C 127.637 59.445 150 67.381 150 77.481 L 150 153.232 C 150.005 157.219 146.771 160.451 142.786 160.447 L 142.786 167.662 C 142.788 171.647 139.557 174.877 135.573 174.875 L 128.357 174.875 C 124.371 174.88 121.139 171.647 121.144 167.662 L 121.144 160.447 L 77.858 160.447 L 77.858 167.662 C 77.86 171.647 74.627 174.88 70.642 174.875 L 63.428 174.875 C 59.441 174.877 56.21 171.647 56.216 167.662 L 56.216 160.447 C 52.228 160.451 48.995 157.219 48.999 153.232 L 48.999 77.481 C 48.999 67.381 71.365 59.445 99.5 59.445 Z M 63.428 88.305 L 63.428 117.161 C 63.428 121.151 66.651 124.375 70.642 124.375 L 128.357 124.375 C 132.344 124.379 135.575 121.148 135.573 117.161 L 135.573 88.305 C 135.576 84.317 132.344 81.084 128.357 81.089 L 70.642 81.089 C 66.654 81.084 63.422 84.317 63.428 88.305 Z M 67.034 149.624 C 72.59 149.624 76.062 143.614 73.283 138.804 C 71.993 136.573 69.611 135.196 67.034 135.196 C 61.482 135.196 58.012 141.209 60.787 146.018 C 62.075 148.249 64.458 149.624 67.034 149.624 Z M 131.964 149.624 C 137.518 149.624 140.989 143.614 138.213 138.804 C 136.925 136.573 134.543 135.196 131.964 135.196 C 126.412 135.196 122.94 141.209 125.716 146.018 C 127.006 148.249 129.387 149.624 131.964 149.624 Z" style="stroke: rgb(255, 255, 255); transform-origin: 99.5px 59.492px;"/>

// <text style="font-family: Arial, sans-serif; font-size: 55px; font-weight: 700; white-space: pre;" x="50%" text-anchor="middle" y="55" >${id}</text></svg>`;

const createSVGIcon = (id: string) =>
    `<svg viewBox="2 2 196 196" width="196" height="196" xmlns="http://www.w3.org/2000/svg">
    <ellipse style="fill: rgb(0,0,0); stroke: rgb(255, 255, 255); stroke-miterlimit: 1; stroke-width: 4px; paint-order: fill; fill-rule: nonzero;" cx="100" cy="100" rx="98" ry="98"/>
    
    <path d="M 99.5 59.445 C 127.637 59.445 150 67.381 150 77.481 L 150 153.232 C 150.005 157.219 146.771 160.451 142.786 160.447 L 142.786 167.662 C 142.788 171.647 139.557 174.877 135.573 174.875 L 128.357 174.875 C 124.371 174.88 121.139 171.647 121.144 167.662 L 121.144 160.447 L 77.858 160.447 L 77.858 167.662 C 77.86 171.647 74.627 174.88 70.642 174.875 L 63.428 174.875 C 59.441 174.877 56.21 171.647 56.216 167.662 L 56.216 160.447 C 52.228 160.451 48.995 157.219 48.999 153.232 L 48.999 77.481 C 48.999 67.381 71.365 59.445 99.5 59.445 Z M 63.428 88.305 L 63.428 117.161 C 63.428 121.151 66.651 124.375 70.642 124.375 L 128.357 124.375 C 132.344 124.379 135.575 121.148 135.573 117.161 L 135.573 88.305 C 135.576 84.317 132.344 81.084 128.357 81.089 L 70.642 81.089 C 66.654 81.084 63.422 84.317 63.428 88.305 Z M 67.034 149.624 C 72.59 149.624 76.062 143.614 73.283 138.804 C 71.993 136.573 69.611 135.196 67.034 135.196 C 61.482 135.196 58.012 141.209 60.787 146.018 C 62.075 148.249 64.458 149.624 67.034 149.624 Z M 131.964 149.624 C 137.518 149.624 140.989 143.614 138.213 138.804 C 136.925 136.573 134.543 135.196 131.964 135.196 C 126.412 135.196 122.94 141.209 125.716 146.018 C 127.006 148.249 129.387 149.624 131.964 149.624 Z" style="stroke: rgb(255, 255, 255); transform-origin: 99.5px 59.492px;" fill="rgb(255, 255, 255)"/>
    
    <text style="font-family: Arial, sans-serif; font-size: 55px; font-weight: 700; white-space: pre;" fill="rgb(255, 255, 255)" x="50%" text-anchor="middle" y="55" >${id}</text></svg>`;

const getStopIcon = (d: any) => {
    const svg = d.cluster ?
        `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200H95.85Zm28.788-113.883h51.451v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053h-17.278v7.053Zm0-13.531h39.882v-7.053h-39.882v7.053Z"/><path style="stroke:#000" d="M147.74 188v-36.05h5.249V188h-5.249ZM23.899 86.117H75.35v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053H29.723v7.053Zm0-13.531h39.882v-7.053H29.723v7.053Z"/><path style="stroke:#000" d="M47.001 188v-36.05h5.249V188h-5.249Z"/></svg>`
        : `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200z"/></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}


const safeGet = async (url: string): Promise<null | any> => {
    const data = await fetch(url);
    if (data.status !== 200) return null;

    const json_data = await data.json();
    if (!json_data) return null;

    return json_data;
}

export { earthMeasure, getStops, getBusIcon, getStopIcon, createSVGIcon, safeGet };