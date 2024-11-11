"use client";
// @ts-ignore
import DeckGL from "@deck.gl/react";

import styles from "./page.module.css";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import InfoBar from "@/components/info-bar/info-bar";
import WebSocketHook from "@/hooks/websocket";
import LayersHook from "@/hooks/layers";
import useViewportStore from "@/stores/currentViewport";
import useDataStore from "@/stores/data";
import useCurrentBusStore from "@/stores/currentBus";
import Image from "next/image";

import moon from "../../public/moon.svg";
import sun from "../../public/sun.svg";

import locate from "../../public/location.svg";
import locateDark from "../../public/locationDark.svg";

import useThemeStore, { getTheme } from "@/stores/theme";
import { Bus } from "@/components/type";
import useFilterStore from "@/stores/filterStore";

export default function Home() {
    const deckRef = useRef<DeckGL>(null);

    const initialViewState = useViewportStore();
    const { buses } = WebSocketHook();
    const [popup, setPopup] = useState(false);
    const { theme, switchTheme } = useThemeStore();
    const colorScheme = useMemo(() => getTheme(theme), [theme]);
    const { filter, setFilter } = useFilterStore();
    const { isBusActive } = useCurrentBusStore();

    const filteredBus = useMemo(() => {
        if (!filter) return buses;

        const filters = filter
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0);

		return buses.filter((bus: Bus) => filters.includes(bus.line));
	}, [buses, filter]);
    const layers = LayersHook(filteredBus);

    const {
        uiData,
        currentLineStops,
        currentLinePath,
        setNextStop,
        setActiveBuses,
        currentStop,
        setCurrentStop,
        currentTheoricalStop,
        setCurrentTheoricalStop,
        setTheoricalPercentage,
        setRealPercentage,
    } = useDataStore();

    const getLocation = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            initialViewState.setViewstate({
                ...initialViewState,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                date: new Date().getTime(),
                zoom: 14,
            });
        });
    };

    const searchBus = (e: ChangeEvent<HTMLInputElement>) => {
        setFilter(e.target.value);
    };
    const reset_focus = () => {
        setActiveBuses([]);
    };

    useEffect(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", colorScheme.bgColor);
        }
    }, [colorScheme.bgColor]);

    useEffect(() => {
        setTheoricalPercentage(
            currentLineStops.length != 0
                ? (currentTheoricalStop / (currentLineStops.length - 1)) * 100
                : 0,
        );
    }, [currentTheoricalStop, currentLineStops.length, setTheoricalPercentage]);

    useEffect(() => {
        setRealPercentage(
            currentLineStops.length != 0 ? (currentStop / (currentLineStops.length - 1)) * 100 : 0,
        );
    }, [currentStop, currentLineStops.length, setRealPercentage]);

    useEffect(() => {
        if (!uiData?.id) return;
        //If no path, no stops or not enough stops, just return
        if (!currentLinePath.length || currentLineStops.length === 0 || currentLineStops.length < 3)
            return;

        const bus = buses.find((e: any) => e.id === uiData.id);
        if (!bus) return;

        setCurrentTheoricalStop(bus.theorical_stop);
        setCurrentStop(bus.next_stop);

        if (bus.next_stop >= currentLinePath[0].path.length) {
            setNextStop(currentLineStops[0].stop.stop_id);
        } else {
            setNextStop(currentLineStops[bus.next_stop].stop.stop_id);
        }
    }, [
        buses,
        uiData,
        currentLinePath,
        currentLineStops,
        setCurrentTheoricalStop,
        setCurrentStop,
        setNextStop,
    ]);

    return (
        <body style={{ backgroundColor: colorScheme.bgColor }}>
            <main className={styles.main}>
                <div className={styles.topHolder}>
                    <div className={styles.popupHolder}>
                        <div
                            style={{
                                position: "fixed",
                                right: "50%",
                                transform: "translate(50%, 0)",
                                padding: "10px",
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
                                gap: 5,
                            }}
                            className={styles.popup}
                        >
                            Click on a bus to see details! <br />
                            <button
                                onClick={() => {
                                    setPopup(true);
                                }}
                                className={` ${styles.button}`}
                                style={{
                                    backgroundColor: colorScheme.invertBgColor,
                                    color: colorScheme.bgColor,
                                }}
                            >
                                close
                            </button>
                        </div>
                    </div>

                    <div className={styles.menuHolder}>
                        <div
                            style={{
                                position: "fixed",
                                top: 20,
                                left: 20,
                                padding: "10px",
                                zIndex: 12,
                                display: "flex",
                                flexDirection: "column",
                                backgroundColor: colorScheme.bgColor,
                                borderRadius: 10,
                                textAlign: "center",
                                boxShadow: "0px 0px 10px 0px #000000",
                                flex: 1,
                                color: colorScheme.textColor,
                            }}
                            className={styles.selection}
                        >
                            Search a line
                            <input
                                type="text"
                                value={filter}
                                onChange={searchBus}
                                placeholder="48, 58 (separate by ',')"
                            />
                            <div
                                style={{
                                    width: "100%",
                                    paddingTop: 5,
                                    display: "flex",
                                    flexDirection: "row",
                                }}
                            >
                                <div onClick={() => switchTheme()} style={{ flex: 1 }}>
                                    <Image
                                        src={theme == "light" ? moon : sun}
                                        width={20}
                                        height={20}
                                        alt=""
                                        style={{ fill: colorScheme.textColor }}
                                    />
                                </div>
                                <div onClick={getLocation} style={{ flex: 1 }}>
                                    <Image
                                        src={theme == "light" ? locate : locateDark}
                                        width={20}
                                        height={20}
                                        alt=""
                                        style={{ fill: colorScheme.textColor }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={styles.map}
                    style={{ height: "100%", width: "100%", position: "relative" }}
                >
                    <DeckGL
                        ref={deckRef}
                        style={{ display: "static" }}
                        initialViewState={initialViewState}
                        controller={{
                            // @ts-ignore
                            dragPan: true,
                            dragRotate: false,
                        }}
                        // @ts-ignore
                        layers={layers}
                    />
                </div>
                {isBusActive ? <InfoBar /> : null}
                <div
                    style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        backgroundColor: "white",
                        font: "12px Helvetica Neue, Arial, Helvetica, sans-serif",
                        lineHeight: "12px",
                        padding: "4px",
                        zIndex: "9",
                    }}
                >
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
    );
}
