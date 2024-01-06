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

const createSVGIcon = (id: string) =>
    `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M 0 0 L 0 200 L 100 250 L 200 200 L 200 0 L 0 0 Z"/><path fill="#1E3050" d="M 100.007 73.679 C 126.196 73.679 147.014 81.065 147.014 90.467 L 147.014 160.977 C 147.018 164.688 144.008 167.697 140.298 167.693 L 140.298 174.409 C 140.301 178.118 137.293 181.126 133.584 181.123 L 126.868 181.123 C 123.158 181.127 120.149 178.119 120.153 174.409 L 120.153 167.693 L 79.861 167.693 L 79.861 174.409 C 79.864 178.119 76.855 181.127 73.145 181.123 L 66.43 181.123 C 62.72 181.126 59.712 178.118 59.716 174.409 L 59.716 167.693 C 56.005 167.697 52.996 164.688 53 160.977 L 53 90.467 C 53 81.065 73.818 73.679 100.007 73.679 Z M 66.43 100.541 L 66.43 127.402 C 66.43 131.115 69.43 134.116 73.145 134.116 L 126.868 134.116 C 130.578 134.12 133.587 131.112 133.584 127.402 L 133.584 100.541 C 133.588 96.83 130.578 93.821 126.868 93.825 L 73.145 93.825 C 69.434 93.821 66.425 96.83 66.43 100.541 Z M 69.787 157.619 C 74.958 157.619 78.189 152.025 75.603 147.548 C 74.404 145.47 72.186 144.189 69.787 144.19 C 64.619 144.19 61.388 149.786 63.972 154.262 C 65.171 156.339 67.388 157.619 69.787 157.619 Z M 130.226 157.619 C 135.395 157.619 138.625 152.025 136.042 147.548 C 134.842 145.47 132.625 144.19 130.226 144.19 C 125.056 144.19 121.825 149.786 124.41 154.262 C 125.61 156.339 127.827 157.619 130.226 157.619 Z"/><text style="fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 59px; font-weight:700; white-space: pre;" x="50%" text-anchor="middle" y="55">${id}</text></svg>`;


const getStopIcon = (d: any) => {
    const svg = d.cluster ?
        `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200H95.85Zm28.788-113.883h51.451v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053h-17.278v7.053Zm0-13.531h39.882v-7.053h-39.882v7.053Z"/><path style="stroke:#000" d="M147.74 188v-36.05h5.249V188h-5.249ZM23.899 86.117H75.35v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053H29.723v7.053Zm0-13.531h39.882v-7.053H29.723v7.053Z"/><path style="stroke:#000" d="M47.001 188v-36.05h5.249V188h-5.249Z"/></svg>`
        : `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200z"/></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export { earthMeasure, getStops, getBusIcon, getStopIcon, createSVGIcon };