'use client';
import styles from './page.module.css'
import React, { useEffect, useMemo, useRef, useState } from "react"
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { BitmapLayer, IconLayer, PathLayer, TileLayer, WebMercatorViewport } from 'deck.gl';
// @ts-ignore
import { ScatterplotLayer } from 'deck.gl';
import Supercluster from 'supercluster';
const INITIAL_VIEW_STATE = {
	latitude: 50.6330,
	longitude: 5.5697,
	zoom: 12,
	bearing: 0,
};

const MAX_ZOOM = 12


const measure = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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


const createSVGIcon = (id: string) =>
	`<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M 0 0 L 0 200 L 100 250 L 200 200 L 200 0 L 0 0 Z"/><path fill="#1E3050" d="M 100.007 73.679 C 126.196 73.679 147.014 81.065 147.014 90.467 L 147.014 160.977 C 147.018 164.688 144.008 167.697 140.298 167.693 L 140.298 174.409 C 140.301 178.118 137.293 181.126 133.584 181.123 L 126.868 181.123 C 123.158 181.127 120.149 178.119 120.153 174.409 L 120.153 167.693 L 79.861 167.693 L 79.861 174.409 C 79.864 178.119 76.855 181.127 73.145 181.123 L 66.43 181.123 C 62.72 181.126 59.712 178.118 59.716 174.409 L 59.716 167.693 C 56.005 167.697 52.996 164.688 53 160.977 L 53 90.467 C 53 81.065 73.818 73.679 100.007 73.679 Z M 66.43 100.541 L 66.43 127.402 C 66.43 131.115 69.43 134.116 73.145 134.116 L 126.868 134.116 C 130.578 134.12 133.587 131.112 133.584 127.402 L 133.584 100.541 C 133.588 96.83 130.578 93.821 126.868 93.825 L 73.145 93.825 C 69.434 93.821 66.425 96.83 66.43 100.541 Z M 69.787 157.619 C 74.958 157.619 78.189 152.025 75.603 147.548 C 74.404 145.47 72.186 144.189 69.787 144.19 C 64.619 144.19 61.388 149.786 63.972 154.262 C 65.171 156.339 67.388 157.619 69.787 157.619 Z M 130.226 157.619 C 135.395 157.619 138.625 152.025 136.042 147.548 C 134.842 145.47 132.625 144.19 130.226 144.19 C 125.056 144.19 121.825 149.786 124.41 154.262 C 125.61 156.339 127.827 157.619 130.226 157.619 Z"/><text style="fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 59px; font-weight:700; white-space: pre;" x="50%" text-anchor="middle" y="55">${id}</text></svg>`;


const get_bus_icon = (d: any) => {
	const svg = d.cluster ?
		`<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200H95.85Zm28.788-113.883h51.451v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053h-17.278v7.053Zm0-13.531h39.882v-7.053h-39.882v7.053Z"/><path style="stroke:#000" d="M147.74 188v-36.05h5.249V188h-5.249ZM23.899 86.117H75.35v56.031l-25.726 14.204-25.725-14.204V86.117Zm5.824 29.696h17.278v-7.053H29.723v7.053Zm0-13.531h39.882v-7.053H29.723v7.053Z"/><path style="stroke:#000" d="M47.001 188v-36.05h5.249V188h-5.249Z"/></svg>`
		: `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg"><linearGradient id="a" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffed00"/><stop offset="1" stop-color="#d6ac00"/></linearGradient><path style="fill:url(#a)" d="M0 0v200l100 50 100-50V0H0Z"/><path d="M59.35 39.035h81.288v88.524L99.993 150 59.35 127.559V39.035Zm9.202 46.917H95.85V74.809H68.552v11.143Zm0-21.378h63.01V53.431h-63.01v11.143Z" style="stroke:#000"/><path style="stroke:#000" d="M95.85 200v-56.956h8.292V200z"/></svg>`
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const svgToDataURL = (id: string) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(createSVGIcon(id))}`


export default function Home() {
	const initialized = useRef(false)
	const [buses, setBuses] = useState([])

	const [test, setTest] = useState([] as any)

	const [path, setPath] = useState([] as any)
	const [stops, setStops] = useState([] as any)
	const [currentBus, setCurrentBus] = useState({} as any)


	const [showUi, setShowUi] = useState(false)
	const [uiData, setUiData] = useState({} as any)
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
	const [canConnect, setCanConnect] = useState(true);

	const [refresh, setRefresh] = useState(false)
	const [refreshTO, setRefreshTO] = useState(setTimeout(() => { }, 0))

	const [current_stop_th, setCurrentStopTh] = useState(0)
	const [current_stop, setCurrentStop] = useState(0)

	const supercluster = useMemo(() => new Supercluster({
		maxZoom: 15,
		radius: 40,
	}), [])

	const [viewport, setViewport] = useState({ north: 0, east: 0, south: 0, west: 0, zoom: 0 })
	const [showStop, setShowStop] = useState(false)
	const [interactiveStop, setInteractiveStop] = useState([] as any)

	const [isStopActive, setIsStopActive] = useState(false)
	const [activeStop, setActiveStop] = useState([{}] as any)
	const [activeBuses, setActiveBuses] = useState({} as any)


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
		if (!path.length || stops.length === 0 || stops.length < 3)
			return

		const bus = buses.find((e: any) => e.id === uiData.id) as any
		setCurrentBus(bus)
		if (!bus) return

		const currentTime = new Date()
		const hours = currentTime.getHours()
		const minutes = currentTime.getMinutes()
		let secondes = hours * 3600 + minutes * 60

		//If format 24:01:01 due to same day buses, just align
		if (stops[stops.length - 1].arrival_time > 86400)
			secondes += 86400

		//get the stop where the bus should be heading
		let nearest_th = 0;
		for (let i = 0; i < stops.length - 1; i++) {
			if (stops[i].arrival_time > secondes) break
			else nearest_th = i + 1;
		}
		setCurrentStopTh(nearest_th)

		const stop_dist = stops.map((e: any) => {
			return ((e.coord[0] - bus.longitude) ** 2 + (e.coord[1] - bus.latitude) ** 2)
		})

		let nearest = 0;
		for (let i = 1; i < stop_dist.length; i++)
			nearest = stop_dist[i] < stop_dist[nearest] ? i : nearest;

		if (nearest === 0 || nearest == 1) {
			setCurrentStop(nearest)
			return
		} else if (nearest === stops.length - 1) {
			setCurrentStop(nearest)
			return
		}

		//around current nearest, check nearest line => determine direction
		const pt_nearest_prev = stops[nearest - 1].coord
		const pt_nearest = stops[nearest].coord
		const pt_nearest_next = stops[nearest + 1].coord
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

	const connectWebSocket = async () => {
		if (!canConnect) return;
		setCanConnect(false);

		const ws = new WebSocket(process.env.NEXT_PUBLIC_API || "ws://localhost:8080/ws");

		ws.onopen = () => {
			console.log("WebSocket Connected");
			setCanConnect(false);
		};

		ws.onerror = (error) => {
			console.log("WebSocket Error: ", error);
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
				console.log(e)
			}
		}

		ws.onclose = () => {
			console.log("WebSocket Disconnected. Attempting to reconnect...");
			setTimeout(() => {
				setCanConnect(true);
				connectWebSocket();
			}, 2000);
		};

		setWebSocket(ws);
	};


	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true
			connectWebSocket();
		}

		return () => {
			if (webSocket) {
				webSocket.close();
			}
		};
	}, []);



	const onClickBus = async (d: any) => {
		setUiData({})
		setPath([])
		setCurrentBus({})

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
			setStops(new_stops)

			let path = [];
			for (let point of (json_data_shape as any[])) {
				path.push([point.shape_pt_lon, point.shape_pt_lat])
			}
			setPath([{ path }])
			setCurrentBus(d.object)
			setUiData({ ln: json_data_info.route_long_name, id: d.object.id })
			setShowUi(true)
		} catch (e) {
			setShowUi(false)
			setUiData({})
			console.log(e)
		}

	}



	const layers = [
		// @ts-ignore
		new TileLayer({
			id: "map-layer",
			data: [
				'http://map.ckonrad.io/hot/{z}/{x}/{y}.png',
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
				url: svgToDataURL(d.line),
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
				url: svgToDataURL(d.line),
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
				url: get_bus_icon(d),
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
				url: get_bus_icon(d),
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
					setIsStopActive(true)
					setActiveBuses(line_bus)
					setActiveStop([d.object])
				} catch (e) {
					console.log()
				}
			},
			pickable: true,
		}),
		new PathLayer({
			id: 'bus-path-layer',
			data: path,
			pickable: true,
			widthScale: 20,
			widthMinPixels: 2,
			getPath: (d: any) => d.path,
			getColor: (_: any) => [228, 0, 43],
			getWidth: (_: any) => 0.1
		}),

		new ScatterplotLayer({
			id: 'scatterplot-layer',
			data: stops,
			pickable: true,
			opacity: 1,
			stroked: true,
			filled: true,
			radiusScale: 10,
			radiusMinPixels: 5,
			radiusMaxPixels: 100,
			lineWidthMinPixels: 1,
			// @ts-ignore
			strokeWidth: .1,
			getPosition: (d: any) => d.coord,
			getRadius: (d: any) => .2,
			getFillColor: (d: any) => [255, 237, 0],
			getLineColor: (d: any) => [0, 0, 0]
		}),
		// new ScatterplotLayer({
		// 	id: 'scatterplot-layer2',
		// 	data: test,
		// 	pickable: true,
		// 	opacity: 1,
		// 	stroked: true,
		// 	filled: true,
		// 	radiusScale: 10,
		// 	radiusMinPixels: 5,
		// 	radiusMaxPixels: 100,
		// 	lineWidthMinPixels: 1,
		// 	// @ts-ignore
		// 	strokeWidth: .1,
		// 	getPosition: (d: any) => d.coord,
		// 	getRadius: (d: any) => .2,
		// 	getFillColor: (d: any) => [12, 237, 0],
		// 	getLineColor: (d: any) => [0, 0, 0]
		// })
	];

	const reset_focus = () => {
		setIsStopActive(false);
		setActiveStop({});
		setActiveBuses({});
	}

	const arrets = useMemo(() => {
		if (!currentBus) return
		if (current_stop === -1 || !stops[current_stop] || current_stop_th === -1 || !stops[current_stop_th]) return (
			<div style={{ display: "flex", flex: "1", width: "100%", alignItems: "center" }}>
				<div style={{ flex: '1', padding: "15px", display: "flex", justifyContent: "center" }}>
					No more stops
				</div>
			</div>
		)

		const time = new Date()
		const hours = time.getHours()
		const minutes = time.getMinutes()
		let secondes = hours * 3600 + minutes * 60
		const arrival = stops[current_stop].arrival_time
		if (arrival > 86400)
			secondes += 86400


		if (!path.length || !stops.length) return

		//nearest point on path
		const bus_pos = [currentBus.longitude, currentBus.latitude]
		let bus_to_path = path[0].path.map((e: [number, number]) => {
			return ((e[0] - bus_pos[0]) ** 2 + (e[1] - bus_pos[1]) ** 2)
		})
		let nearest_idx_bus = 0;
		for (let i = 1; i < bus_to_path.length; i++)
			nearest_idx_bus = bus_to_path[i] < bus_to_path[nearest_idx_bus] ? i : nearest_idx_bus;

		const nearest_path_bus = path[0].path[nearest_idx_bus]

		let stop_to_path = path[0].path.map((e: [number, number]) => {
			return ((e[0] - stops[current_stop].coord[0]) ** 2 + (e[1] - stops[current_stop].coord[1]) ** 2)
		})
		let nearest_idx_path = 0;
		for (let i = 1; i < stop_to_path.length; i++)
			nearest_idx_path = stop_to_path[i] < stop_to_path[nearest_idx_path] ? i : nearest_idx_path;


		let point = path[0].path[nearest_idx_bus]
		let real_dist = measure(point[1], point[0], bus_pos[1], bus_pos[0])
		for (let i = nearest_idx_bus + 1; i < nearest_idx_path; i++) {
			const sec_pt = path[0].path[i]
			real_dist += measure(point[1], point[0], sec_pt[1], sec_pt[0])
			point = sec_pt
		}

		// const nearest_path_stop = path[0].path[nearest_idx_path]
		// setTest([
		// 	{
		// 		"coord": nearest_path_stop,
		// 		"arrival_time": 61440,
		// 		"stop": {
		// 			"stop_id": "Lemlacr1",
		// 			"stop_code": null,
		// 			"stop_name": "EMBOURG Café Lacroix",
		// 			"stop_desc": "",
		// 			"location_type": "0",
		// 			"parent_station": null,
		// 			"zone_id": "5820",
		// 			"stop_url": null,
		// 			"stop_lon": "5.60538",
		// 			"stop_lat": "50.592919",
		// 			"stop_timezone": null,
		// 			"wheelchair_boarding": "0",
		// 			"level_id": null,
		// 			"platform_code": null
		// 		},
		// 		"departure_time": 61440,
		// 		"pickup_type": "0",
		// 		"drop_off_type": "0",
		// 		"stop_sequence": 1,
		// 		"stop_headsign": null,
		// 		"continuous_pickup": "1",
		// 		"continuous_drop_off": "1",
		// 		"shape_dist_traveled": null,
		// 		"timepoint": "1"
		// 	},
		// 	{
		// 		"coord": nearest_path_bus,
		// 		"arrival_time": 61440,
		// 		"stop": {
		// 			"stop_id": "Lemlacr1",
		// 			"stop_code": null,
		// 			"stop_name": "EMBOURG Café Lacroix",
		// 			"stop_desc": "",
		// 			"location_type": "0",
		// 			"parent_station": null,
		// 			"zone_id": "5820",
		// 			"stop_url": null,
		// 			"stop_lon": "5.60538",
		// 			"stop_lat": "50.592919",
		// 			"stop_timezone": null,
		// 			"wheelchair_boarding": "0",
		// 			"level_id": null,
		// 			"platform_code": null
		// 		},
		// 		"departure_time": 61440,
		// 		"pickup_type": "0",
		// 		"drop_off_type": "0",
		// 		"stop_sequence": 1,
		// 		"stop_headsign": null,
		// 		"continuous_pickup": "1",
		// 		"continuous_drop_off": "1",
		// 		"shape_dist_traveled": null,
		// 		"timepoint": "1"
		// 	}
		// ])


		const get_time = (delay: number) => {
			const time = new Date(delay * 1000)
			return time.getUTCHours().toString().padStart(2, '0') + ":" + time.getUTCMinutes().toString().padStart(2, '0')
		}

		const eta = (real_dist) / Math.max(currentBus.speed, 15) * 60
		const delay_s = secondes - arrival
		const delay_min = Math.floor(delay_s / 60) + Math.ceil(eta)
		const delay = delay_min > 0 ? `+${delay_min}` : delay_min + Math.ceil(eta)
		const html_delay = Math.abs(delay_min) >= 3 ? <span style={{ color: "red" }}>{delay}</span > : <span>{delay} </span>

		return (
			<div style={{ display: "flex", flex: "1", width: "100%", alignItems: "center", marginBottom: "10px" }}>
				<div style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
					<span>{current_stop != 0 ? stops[current_stop - 1].stop.stop_name : "Départ"}</span>
					<span>{current_stop != 0 ? get_time(stops[current_stop - 1].arrival_time) : ""}</span>
				</div>

				<div style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
					<span>{stops[current_stop].stop.stop_name} ({html_delay} minutes)</span>

					<span>{get_time(stops[current_stop].arrival_time)} &#8594; {get_time(stops[current_stop].arrival_time + delay_min * 60)}</span>
					<span>{(real_dist * 1000).toFixed(2)}m</span>
					<span>ETA (based on current speed) : {Math.ceil(eta)} minutes </span>
				</div>

				<div style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
					<span>{current_stop != stops.length - 1 ? stops[current_stop + 1].stop.stop_name : "Arrivée"}</span>
					<span>{current_stop != stops.length - 1 ? get_time(stops[current_stop + 1].arrival_time) : ""}</span>
				</div>
			</div>
		)
	}, [refresh, currentBus, current_stop])

	const get_stops = async ({ north, east, south, west }: any) => {
		try {
			const data = await fetch(`${process.env.NEXT_PUBLIC_GTFS_API}/stops?north=${north}&east=${east}&south=${south}&west=${west}`);
			const json_data = await data.json()
			if (!json_data || viewport.zoom < MAX_ZOOM) return;
			setInteractiveStop(json_data)
		} catch (e) {
			console.log(e)
		}
	}

	const deckRef = useRef<DeckGL>(null);
	return (
		<main className={styles.main}>
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
			}}>
				<button onClick={() => { reset_focus(); setShowStop(false) }}>Live buses</button>
				<button onClick={() => { reset_focus(); get_stops(viewport); setShowStop(true) }}>Stops</button>
				<button onClick={() => { get_stops(viewport); reset_focus() }} style={{ display: isStopActive ? "inline" : "none" }}>Remove focus</button>
			</div>
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
						get_stops({ north: nw[1], east: se[0], south: se[1], west: nw[0] })
					})();

				}}
				ref={deckRef}
				initialViewState={INITIAL_VIEW_STATE}
				controller={{
					// @ts-ignore
					dragPan: true,
					dragRotate: false,
				}}
				// @ts-ignore
				layers={layers} />
			<div
				style={{
					display: showUi ? "inline" : "none",
					position: "fixed", width: "70vw",
					height: "300px", backgroundColor: "#fbf4e2",
					bottom: "10px", left: "50%",
					transform: "translate(-50%, 0)",
				}}>
				<div
					onClick={() => {
						setStops([]);
						setPath([]);
						setUiData({});
						setShowUi(false)
					}}
					style={{ cursor: "pointer", position: "absolute", right: "0", top: "0", padding: "5px" }}>
					x
				</div>
				<div
					style={{ position: "absolute", left: "0", top: "0", padding: "5px" }}>
					{(() => {
						const now = new Date()
						return <div>{`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`}</div>
					})()
					}
				</div>
				<div style={{
					display: showUi ? "flex" : "none",
					height: "100%",
					flexDirection: "column",
					alignItems: "center",
					width: "100%",
					border: "1px solid #110f0d",
					borderRadius: "5px"
				}}>

					<div style={{ flex: '1', paddingTop: "25px" }}>
						{currentBus ? currentBus.line : "/"} : {uiData.ln}
					</div>
					<div style={{ width: "100%", flex: '1', display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
						<div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
							{stops.length > 0 ? stops[0].stop.stop_name : "/"}
						</div>
						<div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
							&#8594;
						</div>
						<div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
							{stops.length > 0 ? stops[stops.length - 1].stop.stop_name : "/"}
						</div>
					</div>
					<div style={{ width: "100%" }}>
						<input
							style={{ zIndex: 1, height: 0 }}
							className={`${styles.slider} ${styles.theorical}`}
							defaultValue={stops.length != 0 ? current_stop_th / (stops.length - 1) * 100 : 0}
							type="range" />

						<input
							style={{ transform: "translateY(-1px)", color: 'red' }}
							className={styles.slider}
							defaultValue={stops.length != 0 ? current_stop / (stops.length - 1) * 100 : 0}
							type="range" />
					</div>
					{arrets}
					<div style={{ flex: '1' }}>
						<p>BUS NUMBER : {currentBus ? currentBus.id : "/"}</p>
					</div>
				</div>
			</div>

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
