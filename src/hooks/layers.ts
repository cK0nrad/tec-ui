// @ts-ignore
import { IconLayer, TileLayer, ScatterplotLayer, PathLayer, BitmapLayer } from "deck.gl";

import { useCallback, useMemo, useState } from "react";
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
    // const supercluster = useMemo(() => new Supercluster({
    //     maxZoom: 15,
    //     radius: 40,
    // }), [])

    const { theme } = useThemeStore()

    const {
        setUiData,
        currentLineStops, setCurrentLineStops,
        currentLinePath, setCurrentLinePath,
        nextStop,
        showStops,
    } = useDataStore()

    const { setBus, removeBus } = useCurrentBusStore()
    const viewport = useViewportStore();


    const onClickBus = useCallback(async (d: any) => {
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

            let path = [] as any[][2];
            for (let point of (json_data_shape as any[])) {
                path.push([point.shape_pt_lon, point.shape_pt_lat])
            }

            setCurrentLineStops(new_stops)
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
    }, [viewport, removeBus, setBus, setCurrentLinePath, setCurrentLineStops, setUiData])



    const map_layer = useMemo(() => new TileLayer({
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
    }), [theme])

    const bus_layer = useMemo(() => new IconLayer({
        id: "bus-layer",
        visible: !showStops,
        data: buses,
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
    }), [buses, showStops, onClickBus])

    const bus_path_layer = useMemo(() => new PathLayer({
        id: 'bus-path-layer',
        data: currentLinePath,
        pickable: false,
        widthScale: 20,
        widthMinPixels: 3,
        getPath: (d: any) => d.path,
        getColor: () => [237, 78, 187],
        getWidth: () => 0.5
    }), [currentLinePath])

    const stop_layer = useMemo(() => new ScatterplotLayer({
        id: 'stops-layer',
        data: [...currentLineStops],
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
    }), [currentLineStops, nextStop])

    return [
        // @ts-ignore
        map_layer,
        bus_layer,
        bus_path_layer,
        stop_layer
    ]

}


export default LayersHook;