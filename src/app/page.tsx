'use client';
import styles from './page.module.css'
import React, { useCallback, useEffect, useRef, useState } from "react"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBusSimple } from '@fortawesome/free-solid-svg-icons';

import DeckGL from '@deck.gl/react';
import { LineLayer } from '@deck.gl/layers';
import { ArcLayer, BitmapLayer, GeoJsonLayer, IconLayer, PathLayer, ScatterplotLayer, TextLayer, TileLayer } from 'deck.gl';


const AIR_PORTS =
	'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const INITIAL_VIEW_STATE = {
	latitude: 50.6330,
	longitude: 5.5697,
	zoom: 12,
	bearing: 0,
};

const lineMap = new Map()

export default function Home() {
	const [buses, setBuses] = useState([])
	const [busesn1, setBusesn1] = useState([])

	const [showUi, setShowUi] = useState(false)
	const [uiData, setUiData] = useState({} as any)

	const [isRender, setRender] = useState(false)
	const [currentBuses, setCurrentBuses] = useState<any[]>([])



	useEffect(() => make_ws(), [])


	const make_ws = () => {
		const ws = new WebSocket("ws://localhost:3000/ws")
		ws.onopen = () => {
			console.log("connected")
		}
		ws.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data)
				setBuses(data.slice(0, 1000))
				setRender(false)
			} catch (e) {
				console.log(e)
			}
		}
		ws.onclose = () => {
			ws.close()
			setTimeout(() => make_ws(), 1000)
			console.log("disconnected")
		}
		ws.onerror = (e) => {
			ws.close()
			setTimeout(() => make_ws(), 1000)
			console.log(e)
		}
	}



	function createSVGIcon(id: string) {
		return `<svg viewBox="0 0 200 250" width="200" height="250" xmlns="http://www.w3.org/2000/svg">
			<linearGradient id="a" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color="#ffed00"/>
				<stop offset="1" stop-color="#d6ac00"/>
			</linearGradient>
			<path style="fill:url(#a)" d="M 0 0 L 0 200 L 100 250 L 200 200 L 200 0 L 0 0 Z"/>
			<path fill="#1E3050" d="M 100.007 73.679 C 126.196 73.679 147.014 81.065 147.014 90.467 L 147.014 160.977 C 147.018 164.688 144.008 167.697 140.298 167.693 L 140.298 174.409 C 140.301 178.118 137.293 181.126 133.584 181.123 L 126.868 181.123 C 123.158 181.127 120.149 178.119 120.153 174.409 L 120.153 167.693 L 79.861 167.693 L 79.861 174.409 C 79.864 178.119 76.855 181.127 73.145 181.123 L 66.43 181.123 C 62.72 181.126 59.712 178.118 59.716 174.409 L 59.716 167.693 C 56.005 167.697 52.996 164.688 53 160.977 L 53 90.467 C 53 81.065 73.818 73.679 100.007 73.679 Z M 66.43 100.541 L 66.43 127.402 C 66.43 131.115 69.43 134.116 73.145 134.116 L 126.868 134.116 C 130.578 134.12 133.587 131.112 133.584 127.402 L 133.584 100.541 C 133.588 96.83 130.578 93.821 126.868 93.825 L 73.145 93.825 C 69.434 93.821 66.425 96.83 66.43 100.541 Z M 69.787 157.619 C 74.958 157.619 78.189 152.025 75.603 147.548 C 74.404 145.47 72.186 144.189 69.787 144.19 C 64.619 144.19 61.388 149.786 63.972 154.262 C 65.171 156.339 67.388 157.619 69.787 157.619 Z M 130.226 157.619 C 135.395 157.619 138.625 152.025 136.042 147.548 C 134.842 145.47 132.625 144.19 130.226 144.19 C 125.056 144.19 121.825 149.786 124.41 154.262 C 125.61 156.339 127.827 157.619 130.226 157.619 Z"/>
			<text style="fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 59px; font-weight:700; white-space: pre;" x="50%" text-anchor="middle" y="55">${id}</text>
			</svg>`;
	}

	function svgToDataURL(id: string) {
		if (lineMap.has(id)) {
			return lineMap.get(id)
		}
		const test = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createSVGIcon(id))}`
		lineMap.set(id, test)
		return test
	}

	const layers = [
		new TileLayer({
			data: [
				'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
				'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
				'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
			],
			maxRequests: 20,
			pickable: true,
			highlightColor: [60, 60, 60, 40],
			// https://wiki.openstreetmap.org/wiki/Zoom_levels
			minZoom: 0,
			maxZoom: 20,
			tileSize: 512,
			zoomOffset: 1,
			renderSubLayers: (props: any) => {
				const {
					bbox: { west, south, east, north }
				} = props.tile;

				return [
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
						getColor: [255, 0, 0],
						widthMinPixels: 4
					})
				];
			}
		}),
		new IconLayer({
			data: buses,
			getPosition: (d: any) => {
				return [d.longitude, d.latitude, 10]
			},
			getIcon: (d: any) => ({
				url: svgToDataURL(d.line),
				width: 50,
				height: 62.5,
			}),
			getSize: d => 60,
			onClick: (d: any) => {
				setShowUi(true)
				setUiData(d.object)
			},
			pickable: true,
		})
	];

	const deckRef = useRef(null);
	return (
		<main className={styles.main}>
			<DeckGL
				ref={deckRef}
				initialViewState={INITIAL_VIEW_STATE}
				controller={{
					dragPan: true,
					dragRotate: false,
				}}
				layers={layers} />;

			<div
				style={{
					display: showUi ? "inline" : "none",
					position: "fixed", width: "70vw",
					height: "300px", backgroundColor: "#fbf4e2",
					bottom: "10px", left: "50%",
					transform: "translate(-50%, 0)",
				}}>
				<div onClick={() => setShowUi(false)} style={{ cursor: "pointer", position: "absolute", right: "0", top: "0", padding: "5px" }}>
					x
				</div>

				<div style={{
					display: showUi ? "flex" : "none",
					height: "100%",
					flexDirection: "column",
					alignItems: "center",
					width: "100%"
				}}>
					<div style={{ flex: '1', paddingTop: "25px" }}>
						Charl (Palais) - Roselies - Farciennes - Châtelet
					</div>
					<input style={{ flex: '1', width: "100%" }} type="range" disabled />

					<div style={{ display: "flex", flex: "1", width: "100%", alignItems: "center" }}>
						<div style={{ flex: '1', padding: "15px", display: "flex", justifyContent: "center" }}>
							Arret avant
						</div>

						<div style={{ flex: '1', padding: "15px", display: "flex", justifyContent: "center" }}>
							Arret actuel/arrive
						</div>

						<div style={{ flex: '1', padding: "15px", display: "flex", justifyContent: "center" }}>
							Arret suivant
						</div>
					</div>
					<div style={{ flex: '1' }}>
						<p>BUS NUMBER : {uiData.id}</p>
					</div>
				</div>
			</div>
		</main>
	)
}
