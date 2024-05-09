'use client';
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { WebMercatorViewport } from 'deck.gl';

import styles from './page.module.css'
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"

import InfoBar from '@/components/info-bar/info-bar';
import { getStops } from '@/utils/utils';
import WebSocketHook from '@/hooks/websocket';
import LayersHook from '@/hooks/layers';
import useCurrentViewportStore from '@/stores/currentViewport';
import useDataStore from '@/stores/data';
import useCurrentStopStore from '@/stores/currentStop';
import useCurrentBusStore from '@/stores/currentBus';
import Image from 'next/image';

import moon from "../../public/moon.svg"
import sun from "../../public/sun.svg"

import locate from "../../public/location.svg"
import locateDark from "../../public/locationDark.svg"

import useThemeStore, { getTheme } from '@/stores/theme';
import useViewportStore from '@/stores/currentViewport';
import { Bus, MAX_ZOOM } from '@/components/type';
import useFilterStore from '@/stores/filterStore';



export default function Home() {
	
	const deckRef = useRef<DeckGL>(null);

	const initialViewState = useCurrentViewportStore();
	const { buses } = WebSocketHook();
	const [popup, removePopup] = useState(false)
	const { theme, switchTheme } = useThemeStore()
	const colorScheme = useMemo(() => getTheme(theme), [theme])
	const { filter, setFilter } = useFilterStore()
	const { setBus, isBusActive } = useCurrentBusStore()
	const { removeStop, isStopActive } = useCurrentStopStore()
	const viewport_r = useViewportStore();

	const filteredBus = useMemo(() => buses.filter((bus: Bus) => bus.line.includes(filter)), [buses, filter]);
	const layers = LayersHook(filteredBus);

	const {
		uiData, currentLineStops, currentLinePath,
		setNextStop, setActiveBuses,
		showStops, setShowStops, setStopsList,
		viewport, setViewport,
		currentStop, setCurrentStop,
		currentTheoricalStop, setCurrentTheoricalStop,
		setTheoricalPercentage,
		setRealPercentage,
	} = useDataStore()

	const getLocation = () => {
		navigator.geolocation.getCurrentPosition((position) => {
			viewport_r.setViewstate({
				...viewport_r,
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				date: new Date().getTime(),
				zoom: 14
			})
		})
	}

	const searchBus = (e: ChangeEvent<HTMLInputElement>) => {
		setFilter(e.target.value)
	}
	const reset_focus = () => {
		removeStop();
		setActiveBuses([]);
	}

	const changeViewState = useCallback((e: any) => {
		if (e.interactionState.isDragging) return;
		const viewport = new WebMercatorViewport(e.viewState);
		const nw = viewport.unproject([0, 0]);
		// @ts-ignore
		const se = viewport.unproject([viewport.width, viewport.height]);
		const newViewport = { north: nw[1], east: se[0], south: se[1], west: nw[0], zoom: e.viewState.zoom };
		// if (!showStops || isStopActive) return
		// GetViewportStops(nw[1], se[1], se[0], nw[0], e.viewState.zoom)
	}, [])

	const GetViewportStops = async (north: number, south: number, east: number, west: number, zoom: number) => {
		if (zoom < MAX_ZOOM) return
		const stop = await getStops(north, south, east, west);
		setStopsList(stop)
	}

	useEffect(() => {
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');
		if (metaThemeColor) {
			metaThemeColor.setAttribute('content', colorScheme.bgColor);
		}
	}, [colorScheme.bgColor]);

	useEffect(() => {
		setTheoricalPercentage(currentLineStops.length != 0 ? currentTheoricalStop / (currentLineStops.length - 1) * 100 : 0)
	}, [currentTheoricalStop, currentLineStops.length, setTheoricalPercentage])

	useEffect(() => {
		setRealPercentage(currentLineStops.length != 0 ? currentStop / (currentLineStops.length - 1) * 100 : 0)
	}, [currentStop, currentLineStops.length, setRealPercentage])


	useEffect(() => {
		if (!uiData?.id) return
		//If no path, no stops or not enough stops, just return
		if (!currentLinePath.length || currentLineStops.length === 0 || currentLineStops.length < 3)
			return

		const bus = buses.find((e: any) => e.id === uiData.id)
		if (!bus) return

		setCurrentTheoricalStop(bus.theorical_stop)
		setCurrentStop(bus.next_stop)

		if (bus.next_stop >= currentLinePath[0].path.length) {
			setNextStop(currentLineStops[0].stop.stop_id)
		} else {
			setNextStop(currentLineStops[bus.next_stop].stop.stop_id)
		}
	}, [buses, uiData, currentLinePath, currentLineStops, setCurrentTheoricalStop, setCurrentStop, setNextStop])

	return (
		<body style={{ backgroundColor: colorScheme.bgColor }}>
			<main className={styles.main}>
				<div className={styles.topHolder}>
				<div className={styles.popupHolder}>
						<div style={{
							position: "fixed",
							right: "50%",
							transform: "translate(50%, 0)",
							padding: '10px',
							top: 20,
							boxShadow: "0px 0px 10px 0px #000000",
							zIndex: 12,
							display: popup ? "none" : "flex",
							flexDirection: "column",
							backgroundColor: colorScheme.bgColor,
							borderRadius: 10,
							textAlign: "center",
							color: colorScheme.textColor,
							flex: 1,
							gap: 5
						}} className={styles.popup}>
							Click on a bus to see details! <br />
							If you have any suggestion, you can click on the Suggestion button to send one!
							<button 
								onClick={() => document.location.href = "/feedback" }
								className={` ${styles.button}`}
								style={{backgroundColor: colorScheme.invertBgColor, color: colorScheme.bgColor}}
							>
								Send suggestions | Answer mini survey
							</button>

							<button 
								onClick={() => { removePopup(true) }}
								className={` ${styles.button}`}
								style={{backgroundColor: colorScheme.invertBgColor, color: colorScheme.bgColor}}
							>
								close
							</button>
						</div>
					</div>

					<div className={styles.menuHolder}>
						<div style={{
							position: "fixed",
							top: 20,
							left: 20,
							padding: '10px',
							zIndex: 12,
							display: "flex",
							flexDirection: "column",
							backgroundColor: colorScheme.bgColor,
							borderRadius: 10,
							textAlign: "center",
							boxShadow: "0px 0px 10px 0px #000000",
							flex: 1,
							color: colorScheme.textColor
						}} className={styles.selection}>
							Search a line
							<input type="text" value={filter} onChange={searchBus} />
							<div style={{ width: "100%", paddingTop: 5, display: "flex", flexDirection: "row" }}>
								<div onClick={() => switchTheme()} style={{ flex: 1 }}>
									<Image src={theme == "light" ? moon : sun} width={20} height={20} alt="" style={{ fill: colorScheme.textColor }} />
								</div>
								<div onClick={getLocation} style={{ flex: 1 }}>
									<Image src={theme == "light" ? locate : locateDark} width={20} height={20} alt="" style={{ fill: colorScheme.textColor }} />
								</div>
							</div>
						</div>

						<div style={{
							position: "fixed",
							top: 20,
							right: 20,
							padding: '10px',
							zIndex: 10,
							display: "flex",
							flexDirection: "column",
							backgroundColor: colorScheme.bgColor,
							borderRadius: 15,
							gap: 5,
							boxShadow: "0px 0px 10px 0px #000000",
							flex: 1,
						}} className={styles.selection}>
							<button onClick={() => { reset_focus(); setShowStops(false) }} className={`${styles.button}`} style={{backgroundColor: colorScheme.invertBgColor, color: colorScheme.bgColor}}>Live buses</button>
							<button onClick={() => { reset_focus(); GetViewportStops(viewport.north, viewport.south, viewport.east, viewport.west, viewport.zoom); setShowStops(true) }} disabled className={` ${styles.button}`}  style={{backgroundColor: colorScheme.invertBgColor  + '70', color: colorScheme.bgColor, cursor:'not-allowed'}}>Stops</button>
							<button onClick={() => { GetViewportStops(viewport.north, viewport.south, viewport.east, viewport.west, viewport.zoom); reset_focus() }} style={{ display: isStopActive ? "inline" : "none", backgroundColor: colorScheme.invertBgColor, color: colorScheme.bgColor }} className={` ${styles.button}`} >Remove focus</button>
						</div>
					</div>
				</div>

				<div className={styles.map} style={{ height: '100%', width: '100%', position: 'relative' }}>
					<DeckGL
						onViewStateChange={changeViewState}
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
					isBusActive ? <InfoBar /> : null
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
		</body>
	)
}
