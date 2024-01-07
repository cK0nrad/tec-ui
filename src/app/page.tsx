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
import { getBusIcon, getStopIcon, getStops } from '@/utils/utils';
import useStore from '@/components/store';
import { logError, logInfo } from '@/utils/logger';

const MAX_ZOOM = 12

export default function Home() {
	const [initialViewState, setInitialViewState] = useState({
		latitude: 50.6330,
		longitude: 5.5697,
		zoom: 12,
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
	const [bus_from_stop, setBusFromStop] = useState([] as any)
	const [interactiveStop, setInteractiveStop] = useState([] as any)
	const [activeStop, setActiveStop] = useState([{}] as any)
	const [activeBuses, setActiveBuses] = useState({} as any)
	const [buses, setBuses] = useState([])
	const [popup, removePopup] = useState(false)
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
	const [canConnect, setCanConnect] = useState(true);
	const [refresh, setRefresh] = useState(false)
	const [refreshTO, setRefreshTO] = useState(setTimeout(() => { }, 0))
	const [viewport, setViewport] = useState({ north: 0, east: 0, south: 0, west: 0, zoom: 0 })
	const [showStop, setShowStop] = useState(false)
	const [isStopActive, setIsStopActive] = useState(false)

	const supercluster = useMemo(() => new Supercluster({
		maxZoom: 15,
		radius: 40,
	}), [])

	const nearest_point_to_line = (pt1: [number, number], pt2: [number, number], pt: [number, number]) => {
		const x1 = pt1[0]
		const y1 = pt1[1]

		const x2 = pt2[0]
		const y2 = pt2[1]

		const x3 = pt[0]
		const y3 = pt[1]

		const px = x2 - x1
		const py = y2 - y1
		const dAB = px * px + py * py

		const u = ((x3 - x1) * px + (y3 - y1) * py) / dAB

		const x = x1 + u * px
		const y = y1 + u * py

		//check if x,y is out of the line
		let outbound = false;
		if (x < Math.min(x1, x2) || x > Math.max(x1, x2) || y < Math.min(y1, y2) || y > Math.max(y1, y2)) {
			const d1 = (x - x1) * (x - x1) + (y - y1) * (y - y1)
			const d2 = (x - x2) * (x - x2) + (y - y2) * (y - y2)
			outbound = d1 > dAB || d2 > dAB
		}
		if (outbound) return Infinity

		const squared_distance = (x - x3) * (x - x3) + (y - y3) * (y - y3)

		return squared_distance
	}

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

		const bus = buses.find((e: any) => e.id === uiData.id) as any
		setCurrentBus(bus)
		if (!bus) return

		const currentTime = new Date()
		const hours = currentTime.getHours()
		const minutes = currentTime.getMinutes()
		let secondes = hours * 3600 + minutes * 60

		//If format 24:01:01 due to same day buses, just align
		if (currentLineStops[currentLineStops.length - 1].arrival_time > 86400)
			secondes += 86400

		//get the stop where the bus should be heading
		let nearest_th = 0;
		for (let i = 0; i < currentLineStops.length - 1; i++) {
			if (currentLineStops[i].arrival_time > secondes) break
			else nearest_th = i + 1;
		}
		setCurrentTheoricalStop(nearest_th)

		const stop_dist = currentLineStops.map((e: any) => {
			return ((e.coord[0] - bus.longitude) ** 2 + (e.coord[1] - bus.latitude) ** 2)
		})

		let nearest = 0;
		for (let i = 1; i < stop_dist.length; i++)
			nearest = stop_dist[i] < stop_dist[nearest] ? i : nearest;

		if (nearest === 0 || nearest == 1) {
			setCurrentStop(nearest)
			return
		} else if (nearest === currentLineStops.length - 1) {
			setCurrentStop(nearest)
			return
		}

		//around current nearest, check nearest line => determine direction
		const pt_nearest_prev = currentLineStops[nearest - 1].coord
		const pt_nearest = currentLineStops[nearest].coord
		const pt_nearest_next = currentLineStops[nearest + 1].coord
		const pt_bus = [bus.longitude, bus.latitude] as [number, number]
		const dist_n1_np1 = nearest_point_to_line(pt_nearest_prev, pt_nearest, pt_bus)
		const dist_n1_nm1 = nearest_point_to_line(pt_nearest, pt_nearest_next, pt_bus)

		//either the previous point is neared but heading to next
		//or the next point is neared and also heading to next
		if (dist_n1_np1 > dist_n1_nm1) {
			nearest += 1
		}
		setCurrentStop(nearest)
	}, [refresh, uiData])

	const update_buses = useMemo(() => {
		if (isStopActive && bus_from_stop.length > 0) {
			const line_bus = buses.filter((e: any) => {
				return bus_from_stop.includes(e.line_id)
			})
			setActiveBuses(line_bus)
		}
	}, [buses, bus_from_stop, isStopActive])

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
					const data = JSON.parse(atob(e))
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
			current_stop: 0,
			id: '',
			last_update: 0,
			latitude: 0,
			longitude: 0,
			line: '',
			line_id: '',
			speed: 0,
			trip_id: ''
		})

		setInitialViewState(
			{
				...initialViewState, latitude: d.object.latitude, longitude: d.object.longitude, zoom: 14, bearing: 0,
			}
		)
		try {
			const data_info = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/info?trip_id=${d.object.trip_id}`);
			const data_shape = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/shape?trip_id=${d.object.trip_id}`);
			const data_theorical = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/theorical?trip_id=${d.object.trip_id}`);

			if (
				data_shape.status !== 200 ||
				data_theorical.status !== 200 ||
				data_info.status !== 200
			)
				return;

			const json_data_info = await data_info.json()
			const json_data_shape = await data_shape.json()
			const json_data_theorical = await data_theorical.json()

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
			pickable: true,
			widthScale: 20,
			widthMinPixels: 2,
			getPath: (d: any) => d.path,
			getColor: () => [228, 0, 43],
			getWidth: () => 0.1
		}),

		new ScatterplotLayer({
			id: 'scatterplot-layer',
			data: currentLineStops,
			pickable: true,
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
			getFillColor: () => [255, 237, 0],
			getLineColor: () => [0, 0, 0]
		}),
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
