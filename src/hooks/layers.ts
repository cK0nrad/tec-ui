// @ts-ignore
import { IconLayer, TileLayer, ScatterplotLayer, PathLayer, BitmapLayer } from "deck.gl";

import { useMemo, useState } from "react";
import Supercluster, { AnyProps, PointFeature } from "supercluster";
import { getBusIcon, getStopIcon, getStops, safeGet } from '@/utils/utils';

import { logError } from "@/utils/logger";
import { Bus, MAX_ZOOM } from "@/components/type";
import useCurrentBusStore from "@/stores/currentBus";
import useViewportStore from "@/stores/currentViewport";
import useDataStore from "@/stores/data";
import useCurrentStopStore from "@/stores/currentStop";
import useThemeStore from "@/stores/theme";
import useFilterStore from "@/stores/filterStore";


const LayersHook = (buses: Bus[]) => {
    const supercluster = useMemo(() => new Supercluster({
        maxZoom: 15,
        radius: 40,
    }), [])

    const { theme } = useThemeStore()

    const [activeBuses, setActiveBuses] = useState([] as any)
    const activeStop = useCurrentStopStore()

    const { filter } = useFilterStore()

    const {
        setUiData,
        currentLineStops, setCurrentLineStops,
        currentLinePath, setCurrentLinePath,
        nextStop,
        showStops,
        stopsList, viewport: viewport_cam
    } = useDataStore()

    const { setBus, removeBus } = useCurrentBusStore()
    const viewport = useViewportStore();

    const onClickBus = async (d: any) => {
        setUiData({
            id: "",
            longName: "",
        })

        setCurrentLinePath([{ path: [] }])
        removeBus()
        viewport.setViewstate({
            ...viewport,
            latitude: d.object.latitude,
            longitude: d.object.longitude,
            zoom: 14,
            bearing: 0,
        })

        try {
            if (!d.object.trip_id || d.object.trip_id == "?") {
                setCurrentLineStops([]);
                setCurrentLinePath([{ path: [] }]);
                setUiData({
                    longName: '',
                    id: ''
                });
                removeBus()
                return
            }

            const json_data_info = await safeGet(`${process.env.NEXT_PUBLIC_GTFS_API}/info?trip_id=${d.object.trip_id}`)
            const json_data_theorical = await safeGet(`${process.env.NEXT_PUBLIC_GTFS_API}/theorical?trip_id=${d.object.trip_id}`)
            const json_data_shape = await safeGet(`${process.env.NEXT_PUBLIC_GTFS_API}/shape?trip_id=${d.object.trip_id}`)

            if (
                !json_data_info ||
                !json_data_theorical ||
                !json_data_shape
            ) {
                return;
            }


            const new_stops = []
            for (let stop of json_data_theorical.stop_times) {
                const physical_stop = stop.stop
                new_stops.push({
                    coord: [
                        parseFloat(physical_stop.stop_lon),
                        parseFloat(physical_stop.stop_lat)
                    ],
                    ...stop,
                })
            }
            setCurrentLineStops(new_stops)

            let path = [] as any[][2];
            for (let point of (json_data_shape as any[])) {
                path.push([point.shape_pt_lon, point.shape_pt_lat])
            }
            setCurrentLinePath([{ path }])

            setBus(d.object)
            setUiData({ longName: json_data_info.route_long_name, id: d.object.id })
        } catch (e) {
            removeBus()
            setUiData({
                longName: '',
                id: ''
            })
            logError(`Error while fetching bus info: ${e}`)
        }

    }



    return useMemo(() => [
        // @ts-ignore
        new TileLayer({
            id: "map-layer",
            data: [
                `https://map.ckonrad.io/${theme}/{z}/{x}/{y}.png`,
            ],
            pickable: true,
            minZoom: 0,
            maxZoom: 20,
            // @ts-ignore
            tileSize: 512,
            zoomOffset: 0,
            extent: [-0.791, 48.093, 11.404, 53.410],
            renderSubLayers: (props: any) => {
                const {
                    bbox: { west, south, east, north }
                } = props.tile;
                return [
                    // @ts-ignore
                    new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north]
                    })
                ];
            }
        }),

        new IconLayer({
            id: "bus-layer",
            visible: !showStops,
            data: buses.filter(e => e.line.startsWith(filter)),
            getPosition: (d: any) => {
                return [d.longitude, d.latitude, 10]
            },
            // @ts-ignore
            getIcon: (d: any) => ({
                url: getBusIcon(d.line),
                width: 50,
                height: 50,
            }),
            getSize: (_: any) => 50,
            onClick: onClickBus,
            pickable: true,
        }),

        // new IconLayer({
        //     id: "bus-stop-layer",
        //     visible: activeStop.isStopActive,
        //     data: activeBuses,
        //     getPosition: (d: any) => {
        //         return [d.longitude, d.latitude, 10]
        //     },
        //     // @ts-ignore
        //     getIcon: (d: any) => ({
        //         url: getBusIcon(d.line),
        //         width: 50,
        //         height: 50,
        //     }),
        //     getSize: (_: any) => 50,
        //     onClick: onClickBus,
        //     pickable: true,
        // }),

        new IconLayer({
            id: "current-stop-layer",
            visible: activeStop.isStopActive,
            data: [activeStop],
            getPosition: (d: any) => {
                return [d.x, d.y, 10]
            },
            // @ts-ignore
            getIcon: (d: any) => ({
                url: getStopIcon(d),
                width: 50,
                height: 62.5,
                anchorX: 25,
                anchorY: 62.5,
            }),
            getSize: (_: any) => 60,
            pickable: true,
        }),

        // new IconLayer({
        //     id: "interactive-stop-layer",
        //     visible: showStops && viewport.zoom >= MAX_ZOOM && !activeStop.isStopActive,
        //     data: (() => {
        //         //format data
        //         const data: PointFeature<AnyProps>[] = stopsList.map((e: [string, { x: number, y: number }]) => {
        //             return {
        //                 "type": "Feature",
        //                 "properties": {
        //                     "id": e[0]
        //                 },
        //                 "geometry": {
        //                     "type": "Point",
        //                     "coordinates": [e[1].x, e[1].y]
        //                 }
        //             }
        //         });
        //         //cluster data
        //         supercluster.load(data);
        //         const clusters = supercluster.getClusters([viewport_cam.west, viewport_cam.south, viewport_cam.east, viewport_cam.north], viewport_cam.zoom);

        //         //format stops
        //         const clusted = clusters.map(e => {
        //             const coord = e.geometry.coordinates;
        //             if (e.properties.cluster) {
        //                 return {
        //                     x: coord[0],
        //                     y: coord[1],
        //                     cluster: true,
        //                     id: ""
        //                 }
        //             }
        //             const id = e.properties.id;
        //             return {
        //                 x: coord[0],
        //                 y: coord[1],
        //                 cluster: false,
        //                 id
        //             }
        //         })

        //         return clusted
        //     })(),
        //     getPosition: (d: any) => {
        //         return [d.x, d.y, 10]
        //     },
        //     // @ts-ignore
        //     getIcon: (d: any) => ({
        //         url: getStopIcon(d),
        //         width: 50,
        //         height: 62.5,
        //         anchorX: 25,
        //         anchorY: 62.5,
        //     }),
        //     getSize: (_: any) => 60,
        //     onClick: async (d: any) => {
        //         if (d.object.cluster) return
        //         try {
        //             const data = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/bus_from_stop?stop_id=${d.object.id}`);
        //             if (!data.ok) return
        //             const json_data = await data.json() as any[]
        //             const line_bus = buses.filter((e: any) => {
        //                 return json_data.includes(e.line_id)
        //             })
        //             setActiveBuses(line_bus)
        //             activeStop.setStop(d.object)
        //         } catch (e) {
        //             logError(`Error while fetching bus from stop: ${e}`)
        //         }
        //     },
        //     pickable: true,
        // }),
        new PathLayer({
            id: 'bus-path-layer',
            data: currentLinePath,
            pickable: false,
            widthScale: 20,
            widthMinPixels: 3,
            getPath: (d: any) => d.path,
            // getColor: () => ,
            getColor: () => [237, 78, 187],
            getWidth: () => 0.5
        }),

        new ScatterplotLayer({
            id: 'stops-layer',
            data: currentLineStops,
            pickable: false,
            opacity: 1,
            stroked: true,
            filled: true,
            radiusScale: 10,
            radiusMinPixels: 5,
            radiusMaxPixels: 100,
            lineWidthMinPixels: 3,
            getLineWidth: () => 3,
            getPosition: (d: any) => d.coord,
            getRadius: () => 1,
            getFillColor: (d: any) => d.stop.stop_id == nextStop ? [255, 16, 240] : [255, 255, 255],
            getLineColor: () => [0, 0, 0]
        })
    ], [currentLineStops, buses, currentLinePath, showStops])

}


export default LayersHook;