'use client';

import styles from './page.module.css'
import React, { useEffect, useMemo, useRef, useState } from "react"
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { BitmapLayer, FlyToInterpolator, IconLayer, PathLayer, TileLayer, WebMercatorViewport } from 'deck.gl';
// @ts-ignore
import { ScatterplotLayer } from 'deck.gl';
import Supercluster from 'supercluster';
import InfoBar from '@/components/info-bar/info-bar';
import { getBusIcon, getStopIcon, getStops, safeGet } from '@/utils/utils';
import useStore from '@/components/store';
import { logError, logInfo } from '@/utils/logger';
import { Bus } from '@/components/type';

const MAX_ZOOM = 8

export default function Home() {
	const [initialViewState, setInitialViewState] = useState({
		latitude: 50.6330,
		longitude: 5.5697,
		zoom: 8,
		bearing: 0,
		pitch: 0,
		transitionDuration: 1000,
		transitionInterpolator: new FlyToInterpolator()
	});

	const {
		currentStop, setCurrentStop,
		currentTheoricalStop, setCurrentTheoricalStop,
		uiData, setUiData,
		currentLineStops, setCurrentLineStops,
		currentLinePath, setCurrentLinePath,
		showUi, setShowUi,

		setTheoricalPercentage,
		setRealPercentage,
		setCurrentBus,
	} = useStore()

	const [initialized, setInitialized] = useState(false)
	const [bus_from_stop, setBusFromStop] = useState<any>([])
	const [interactiveStop, setInteractiveStop] = useState<any>([])
	const [activeStop, setActiveStop] = useState([{}] as any)
	const [activeBuses, setActiveBuses] = useState({} as any)
	const [buses, setBuses] = useState<Bus[]>([])
	const [popup, removePopup] = useState(false)
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
	const [canConnect, setCanConnect] = useState(true);
	const [refresh, setRefresh] = useState(false)
	const [refreshTO, setRefreshTO] = useState(setTimeout(() => { }, 0))
	const [viewport, setViewport] = useState({ north: 0, east: 0, south: 0, west: 0, zoom: 0 })
	const [showStop, setShowStop] = useState(false)
	const [isStopActive, setIsStopActive] = useState(false)

	const [nextStop, setNextStop] = useState<[number, number][]>([[0, 0]])
	const [hovering, setHovering] = useState<any>({})

	const supercluster = useMemo(() => new Supercluster({
		maxZoom: 15,
		radius: 40,
	}), [])


	useEffect(() => {
		setTheoricalPercentage(currentLineStops.length != 0 ? currentTheoricalStop / (currentLineStops.length - 1) * 100 : 0)
	}, [currentTheoricalStop])

	useEffect(() => {
		setRealPercentage(currentLineStops.length != 0 ? currentStop / (currentLineStops.length - 1) * 100 : 0)
	}, [currentStop])

	useEffect(() => {
		if (refreshTO) clearTimeout(refreshTO)
		const as = async (refresh: boolean) => {
			let to = setTimeout(() => {
				setRefresh(!refresh)
			}, 1000)
			setRefreshTO(to)
		}
		as(refresh)
		if (!uiData?.id) return

		//If no path, no stops or not enough stops, just return
		if (!currentLinePath.length || currentLineStops.length === 0 || currentLineStops.length < 3)
			return

		const bus = buses.find((e: any) => e.id === uiData.id)
		if (!bus) return

		setCurrentBus(bus)
		console.log(bus.delay)
		setCurrentTheoricalStop(bus.theorical_stop)
		setCurrentStop(bus.next_stop)
		if (bus.next_stop >= currentLinePath[0].path.length) {
			setNextStop([currentLinePath[0].path[currentLinePath[0].path.length - 1]])
		} else {
			const next_stop = currentLineStops[bus.next_stop]
			setNextStop([[parseFloat(next_stop.stop.stop_lon), parseFloat(next_stop.stop.stop_lat)]])
		}
	}, [refresh, uiData])


	const connectWebSocket = async () => {
		if (!canConnect) return;
		setCanConnect(false);

		const ws = new WebSocket(process.env.NEXT_PUBLIC_API || "ws://localhost:8080/ws");

		ws.onopen = () => {
			logInfo("WebSocket Connected");
			setCanConnect(false);
		};

		ws.onerror = (error) => {
			logError(`WebSocket Error: ${error}`);
			setCanConnect(true);
		};

		ws.onmessage = (message) => {
			try {
				let ds = new DecompressionStream("gzip");
				let decompressedStream = message.data.stream().pipeThrough(ds);
				new Response(decompressedStream).text().then(e => {
					const data = JSON.parse(atob(e)) as Bus[]
					setBuses(data)
				})
			} catch (e) {
				logError(`WebSocket Error: ${e}`)
			}
		}

		ws.onclose = () => {
			logError("WebSocket Disconnected");
			setTimeout(() => {
				setCanConnect(true);
				connectWebSocket();
			}, 2000);
		};

		setWebSocket(ws);
	};


	useEffect(() => {
		if (!initialized) {
			setInitialized(true);
			connectWebSocket();
		}

		return () => {
			if (webSocket) {
				webSocket.close();
			}
		};
	}, []);



	const onClickBus = async (d: any) => {
		setUiData({
			id: "",
			longName: "",
		})
		setCurrentLinePath([{ path: [] }])
		setCurrentBus({
			next_stop: 0,
			id: '',
			last_update: 0,
			latitude: 0,
			longitude: 0,
			line: '',
			line_id: '',
			average_speed: 0,
			trip_id: '',
			remaining_distance: 0,
			theorical_stop: 0,
			delay: 0
		})

		setInitialViewState(
			{
				...initialViewState, latitude: d.object.latitude, longitude: d.object.longitude, zoom: 14, bearing: 0,
			}
		)
		try {
			if (!d.object.trip_id || d.object.trip_id == "?") {
				setCurrentLineStops([]);
				setCurrentLinePath([{ path: [] }]);
				setUiData({
					longName: '',
					id: ''
				});
				setShowUi(false)
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
			setCurrentBus(d.object)
			setUiData({ longName: json_data_info.route_long_name, id: d.object.id })
			setShowUi(true)

		} catch (e) {
			setShowUi(false)
			setUiData({
				longName: '',
				id: ''
			})
			logError(`Error while fetching bus info: ${e}`)
		}

	}



	const layers = [
		// @ts-ignore
		new TileLayer({
			id: "map-layer",
			data: [
				'https://map.ckonrad.io/hot/{z}/{x}/{y}.png',
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
					}),
					true &&
					new PathLayer({
						id: `${props.id}-border`,
						data: [
							[
								[west, north],
								[west, south],
								[east, south],
								[east, north],
								[west, north]
							]
						],
						// @ts-ignore
						getColor: [255, 0, 0],
						widthMinPixels: 4
					})
				];
			}
		}),
		new IconLayer({
			id: "bus-layer",
			visible: !showStop,
			data: buses,
			getPosition: (d: any) => {
				return [d.longitude, d.latitude, 10]
			},
			// @ts-ignore
			getIcon: (d: any) => ({
				url: getBusIcon(d.line),
				width: 50,
				height: 62.5,
				anchorX: 25,
				anchorY: 62.5,
			}),
			getSize: (_: any) => 60,
			onClick: onClickBus,
			pickable: true,
		}),
		new IconLayer({
			id: "bus-stop-layer",
			visible: isStopActive,
			data: activeBuses,
			getPosition: (d: any) => {
				return [d.longitude, d.latitude, 10]
			},
			// @ts-ignore
			getIcon: (d: any) => ({
				url: getBusIcon(d.line),
				width: 50,
				height: 62.5,
				anchorX: 25,
				anchorY: 62.5,
			}),
			getSize: (_: any) => 60,
			onClick: onClickBus,
			pickable: true,
		}),
		new IconLayer({
			id: "current-stop-layer",
			visible: isStopActive,
			data: activeStop,
			onHover: (e: any) => setHovering(Boolean(e)),
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
		new IconLayer({
			id: "interactive-stop-layer",
			visible: showStop && viewport.zoom >= MAX_ZOOM && !isStopActive,
			data: (() => {
				//format data
				const data = interactiveStop.map((e: [string, { x: number, y: number }]) => {
					return {
						"type": "Feature",
						"properties": {
							"id": e[0]
						},
						"geometry": {
							"type": "Point",
							"coordinates": [e[1].x, e[1].y]
						}
					}
				});
				//cluster data
				supercluster.load(data);
				const clusters = supercluster.getClusters([viewport.west, viewport.south, viewport.east, viewport.north], viewport.zoom);

				//format stops
				const clusted = clusters.map(e => {
					const coord = e.geometry.coordinates;
					if (e.properties.cluster) {
						return {
							x: coord[0],
							y: coord[1],
							cluster: true,
							id: ""
						}
					}
					const id = e.properties.id;
					return {
						x: coord[0],
						y: coord[1],
						cluster: false,
						id
					}
				})

				return clusted
			})(),
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
			onClick: async (d: any) => {
				if (d.object.cluster) return
				try {
					const data = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/bus_from_stop?stop_id=${d.object.id}`);
					if (!data.ok) return
					const json_data = await data.json() as any[]
					const line_bus = buses.filter((e: any) => {
						return json_data.includes(e.line_id)
					})
					setBusFromStop(json_data)
					setIsStopActive(true)
					setActiveBuses(line_bus)
					setActiveStop([d.object])
				} catch (e) {
					logError(`Error while fetching bus from stop: ${e}`)
				}
			},
			pickable: true,
		}),
		new PathLayer({
			id: 'bus-path-layer',
			data: currentLinePath,
			pickable: false,
			widthScale: 20,
			widthMinPixels: 2,
			getPath: (d: any) => d.path,
			getColor: () => [228, 0, 43],
			getWidth: () => 0.1
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
			lineWidthMinPixels: 1,
			getLineWidth: () => .1,
			getPosition: (d: any) => d.coord,
			getRadius: () => .2,
			getFillColor: () => [237, 255, 0],
			getLineColor: () => [0, 0, 0]
		}),

		new ScatterplotLayer({
			visible: showUi,
			id: 'next-stop-layer',
			data: nextStop,
			pickable: false,
			opacity: 1,
			stroked: true,
			filled: true,
			radiusScale: 10,
			radiusMinPixels: 5,
			radiusMaxPixels: 100,
			lineWidthMinPixels: 1,
			getLineWidth: () => .1,
			getPosition: (d: any) => d,
			getRadius: () => .2,
			getFillColor: () => [255, 16, 240],
			getLineColor: () => [0, 0, 0]
		})
	];

	const reset_focus = () => {
		setIsStopActive(false);
		setActiveStop({});
		setActiveBuses({});
	}

	const GetViewportStops = async (north: number, south: number, east: number, west: number, zoom: number) => {
		if (zoom < MAX_ZOOM) return
		const stop = await getStops(north, south, east, west);
		setInteractiveStop(stop)
	}

	const deckRef = useRef<DeckGL>(null);
	return (
		<main className={styles.main}>
			<div style={{
				position: "fixed",
				top: 0,
				right: "50%",
				transform: "translate(50%, 0)",
				padding: '10px',
				zIndex: 12,
				display: popup ? "none" : "flex",
				flexDirection: "column",
				backgroundColor: "#fbf4e2",
				borderBottomLeftRadius: 15,
				borderBottomRightRadius: 15,
				borderLeft: "1px solid #110f0d",
				borderRight: "1px solid #110f0d",
				borderBottom: "1px solid #110f0d",
				textAlign: "center"
			}} className={styles.popup}>
				Click on a bus to see details!
				<button onClick={() => { removePopup(true) }}>close</button>
			</div>
			<div style={{
				position: "fixed",
				top: 0,
				right: 0,
				padding: '10px',
				zIndex: 10,
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#fbf4e2",
				borderBottomLeftRadius: 15,
				borderLeft: "1px solid #110f0d",
				borderBottom: "1px solid #110f0d"
			}} className={styles.selection}>
				<button onClick={() => { reset_focus(); setShowStop(false) }}>Live buses</button>
				<button onClick={() => { reset_focus(); GetViewportStops(viewport.north, viewport.south, viewport.east, viewport.west, viewport.zoom); setShowStop(true) }}>Stops</button>
				<button onClick={() => { GetViewportStops(viewport.north, viewport.south, viewport.east, viewport.west, viewport.zoom); reset_focus() }} style={{ display: isStopActive ? "inline" : "none" }}>Remove focus</button>
			</div>
			<div className={styles.map} style={{ height: '100%', width: '100%', position: 'relative' }}>
				<DeckGL
					onViewStateChange={(e: any) => {
						if (e.interactionState.isDragging) return;
						(async () => {
							const viewport = new WebMercatorViewport(e.viewState);
							const nw = viewport.unproject([0, 0]);
							// @ts-ignore
							const se = viewport.unproject([viewport.width, viewport.height]);
							setViewport({ north: nw[1], east: se[0], south: se[1], west: nw[0], zoom: e.viewState.zoom })

							if (!showStop || isStopActive) return
							GetViewportStops(nw[1], se[1], se[0], nw[0], e.viewState.zoom)
						})();
					}}
					ref={deckRef}
					style={{ display: "static" }}
					initialViewState={initialViewState}
					controller={{
						// @ts-ignore
						dragPan: true,
						dragRotate: false,
					}}
					// @ts-ignore
					layers={layers} />
			</div>
			{
				showUi ? <InfoBar /> : null
			}


			<div style={{
				position: "absolute",
				bottom: "0",
				right: "0",
				backgroundColor: "white",
				font: "12px Helvetica Neue, Arial, Helvetica, sans-serif",
				lineHeight: "12px",
				padding: "4px",
				zIndex: "9",
			}}>
				<a
					href="http://www.openstreetmap.org/about/"
					target="_blank"
					rel="noopener noreferrer"
				>
					© OpenStreetMap
				</a>
			</div>
		</main>
	)
}
