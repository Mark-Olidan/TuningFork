import {
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioRecorder,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useRef, useState } from "react";

const IDENTIFY_RECORDING_MS = 8000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_SECRET = process.env.EXPO_PUBLIC_API_SECRET;

export type IdentifyStatus =
	| "idle"
	| "recording"
	| "uploading"
	| "matched"
	| "no_match"
	| "error";

export type SongMatch = {
	title: string;
	artist: string;
	album?: string;
	artwork?: string;
	acrid?: string;
};

type IdentifyResponse = {
	ok: boolean;
	matched: boolean;
	match?: SongMatch;
	error?: string;
	acrRaw?: unknown;
};

export function useIdentifySong() {
	const [status, setStatus] = useState<IdentifyStatus>("idle");
	const [result, setResult] = useState<SongMatch | null>(null);
	const [error, setError] = useState<string | null>(null);
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearIdentifyTimeout = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const stopAndIdentify = useCallback(async () => {
		if (!recorder.isRecording) {
			return;
		}

		try {
			setStatus("uploading");
			clearIdentifyTimeout();

			await recorder.stop();
			const uri = recorder.uri;

			if (!uri) {
				throw new Error("No recording file was produced.");
			}

			if (!API_BASE_URL) {
				throw new Error(
					"Missing EXPO_PUBLIC_API_BASE_URL. Add it to TuningFork/.env.local.",
				);
			}

			const audioBase64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const response = await fetch(`${API_BASE_URL}/identify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"ngrok-skip-browser-warning": "true",
					...(API_SECRET ? { "x-api-secret": API_SECRET } : {}),
				},
				body: JSON.stringify({
					audioBase64,
					mimeType: "audio/m4a",
					debugRaw: false,
				}),
			});

			const text = await response.text();
		let payload: IdentifyResponse;
		try {
			payload = JSON.parse(text) as IdentifyResponse;
		} catch {
			throw new Error("Cannot reach the identify server. Make sure the backend is running.");
		}
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error || "Identification request failed.");
			}

			if (!payload.matched || !payload.match) {
				setResult(null);
				setError(payload.error || "No song match found.");
				setStatus("no_match");
			} else {
				setResult(payload.match);
				setError(null);
				setStatus("matched");
			}

			await FileSystem.deleteAsync(uri, { idempotent: true });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Could not identify this audio.";
			setResult(null);
			setError(message);
			setStatus("error");
		}
	}, [clearIdentifyTimeout, recorder]);

	const startListening = useCallback(async () => {
		if (status === "recording" || status === "uploading") {
			return;
		}

		try {
			setError(null);
			setResult(null);

			const permission = await requestRecordingPermissionsAsync();
			if (!permission.granted) {
				throw new Error("Microphone permission is required to identify songs.");
			}

			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});

			await recorder.prepareToRecordAsync();
			recorder.record();
			setStatus("recording");

			timeoutRef.current = setTimeout(() => {
				void stopAndIdentify();
			}, IDENTIFY_RECORDING_MS);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Could not start listening.";
			setError(message);
			setStatus("error");
		}
	}, [recorder, status, stopAndIdentify]);

	const cancelListening = useCallback(async () => {
		clearIdentifyTimeout();

		try {
			if (recorder.isRecording) {
				await recorder.stop();
				const uri = recorder.uri;
				if (uri) {
					await FileSystem.deleteAsync(uri, { idempotent: true });
				}
			}
		} catch {
			// No-op: cancellation should still reset state even if stopping fails.
		}

		setStatus("idle");
	}, [clearIdentifyTimeout, recorder]);

	return {
		status,
		result,
		error,
		startListening,
		cancelListening,
	};
}

