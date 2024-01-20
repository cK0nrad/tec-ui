import styles from './info-bar.module.css'
import useStore from "@/components/store";
import { useMemo } from 'react';
type Props = {

}

const InfoBar = ({ }: Props) => {
	const {
		realPercentage,
		theoricalPercentage,
		currentBus,
		currentLineStops,
		uiData, setUiData,
		currentStop,
		currentTheoricalStop, setCurrentLineStops,
		currentLinePath, setCurrentLinePath,
		setShowUi
	} = useStore()

	const arrets = useMemo(() => {

		if (!currentBus) return
		if (currentStop === -1 || !currentLineStops[currentStop] || currentTheoricalStop === -1 || !currentLineStops[currentTheoricalStop]) return (
			<div style={{ display: "flex", flex: "1", width: "100%", alignItems: "center" }}>
				<div style={{ flex: '1', padding: "15px", display: "flex", justifyContent: "center" }}>
					No more stops
				</div>
			</div>
		)

		const get_time = (delay: number) => {
			const time = new Date(delay * 1000)
			return time.getUTCHours().toString().padStart(2, '0') + ":" + time.getUTCMinutes().toString().padStart(2, '0')
		}

		const eta = (currentBus.remaining_distance) / (Math.max(currentBus.average_speed, 1) * 1000) * 60
		const delay_min = Math.floor(currentBus.delay / 60)
		const delay = delay_min > 0 ? `+${delay_min}` : delay_min
		const html_delay = Math.abs(delay_min) >= 3 ? <span style={{ color: "red" }}>{delay}</span > : <span>{delay} </span>

		return (
			<div style={{ padding: "15px", display: "flex", flex: "1", width: "100%", alignItems: "center" }}>
				<div className={styles.bus_container_left} style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
					<span>{currentStop != 0 ? currentLineStops[currentStop - 1].stop.stop_name : "Départ"}</span>
					<span>{currentStop != 0 ? get_time(currentLineStops[currentStop - 1].arrival_time) : ""}</span>
				</div>

				<div className={styles.bus_container_mid} style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
					<span>{currentLineStops[currentStop].stop.stop_name} ({html_delay} minutes)</span>
					<span>
						{get_time(currentLineStops[currentStop].arrival_time)}  (<span style={{ color: "red" }}>&bull;</span>)
						&#8594;
						{get_time(currentLineStops[currentStop].arrival_time + delay_min * 60)}  (<span style={{ color: "#ffcd00" }}>&bull;</span>)
					</span>
					<span>{currentBus.remaining_distance.toFixed(2)}m</span>
					<span>ETA (based on current speed) : {Math.ceil(eta)} minutes </span>
				</div>

				<div className={styles.bus_container_right} style={{ flex: '1', padding: "15px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
					<span>{currentStop != currentLineStops.length - 1 ? currentLineStops[currentStop + 1].stop.stop_name : "Arrivée"}</span>
					<span>{currentStop != currentLineStops.length - 1 ? get_time(currentLineStops[currentStop + 1].arrival_time) : ""}</span>
				</div>
			</div>
		)
	}, [currentBus, currentStop, currentTheoricalStop, currentLineStops, currentLinePath]);


	return (
		<div
			className={styles.bus_container}
			style={{
				display: "flex",
				position: "fixed",
				width: "70vw",
				backgroundColor: "#fbf4e2",
				bottom: "10px",
				left: "50%",
				transform: "translate(-50%, 0)",
				zIndex: 10,
				border: "1px solid #110f0d",
				borderRadius: "5px",
				flexDirection: "column",
				alignItems: "center",
			}}>
			<div style={{ position: "relative", width: '100%' }}>
				<div
					onClick={() => {
						setCurrentLineStops([]);
						setCurrentLinePath([{ path: [] }]);
						setUiData({
							longName: '',
							id: ''
						});
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

			</div>
			<div style={{
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}>

				<div style={{ flex: '1', padding: "25px 0", marginTop: "5px" }} className={styles.busTitle}>
					{currentBus ? currentBus.line : "/"} : {uiData.longName}
				</div>
				<div style={{ width: "100%", flex: '1', display: "flex", flexDirection: "row", justifyContent: "space-between" }} className={styles.busEta}>
					<div style={{ padding: "15px", flex: 1, display: "flex", justifyContent: "center", textAlign: "center" }}>
						{currentLineStops.length > 0 ? currentLineStops[0].stop.stop_name : "/"}
					</div>
					<div style={{ padding: "15px", flex: 1, display: "flex", justifyContent: "center", textAlign: "center" }}>
						&#8594;
					</div>
					<div style={{ padding: "15px", flex: 1, display: "flex", justifyContent: "center", textAlign: "center" }}>
						{currentLineStops.length > 0 ? currentLineStops[currentLineStops.length - 1].stop.stop_name : "/"}
					</div>
				</div>
				<div style={{ width: "100%", position: "relative" }}>
					<input
						step={"0.01"}
						min={0}
						max={100}
						style={{ zIndex: 1, height: 0 }}
						className={`${styles.slider} ${styles.theorical}`}
						value={theoricalPercentage}
						type="range"
						readOnly
					/>

					<input
						step={"0.01"}
						min={0}
						max={100}
						style={{ transform: "translateY(-1px)" }}
						className={`${styles.slider} ${styles.real}`}
						value={realPercentage}
						type="range"
						readOnly
					/>
				</div>
				{arrets}
				<div style={{ padding: "15px", flex: '1', display: 'flex', alignItems: "center", flexDirection: "column" }}>
					<p><b style={{ color: "#ffcd00", backgroundColor: "black" }}>Yellow</b>: real time.</p>
					<p><b style={{ color: "red", backgroundColor: "black" }}>Red</b>: theorical time.</p>
					<p>BUS NUMBER : {currentBus ? currentBus.id : "/"}</p>
				</div>
			</div>
		</div>

	)
}

export default InfoBar;