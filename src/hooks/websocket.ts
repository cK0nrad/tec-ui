import { Bus } from "@/components/type";
import { logError, logInfo } from "@/utils/logger";
import { useCallback, useEffect, useState } from "react";


const WebSocketHook = () => {
	const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
	const [canConnect, setCanConnect] = useState(true);


    const [buses, setBuses] = useState<Bus[]>([])
	const [initialized, setInitialized] = useState(false)


    const connectWebSocket = useCallback( async () => {
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
	}, [canConnect]);


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
	}, [connectWebSocket, initialized, webSocket]);


    return { buses };
}

export default WebSocketHook;