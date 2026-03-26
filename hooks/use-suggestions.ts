import { useEffect, useState } from "react";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export type SuggestedSong = {
  title: string;
  artist: string;
  artwork: string | null;
};

export function useSuggestions(title: string, artist: string) {
  const [suggestions, setSuggestions] = useState<SuggestedSong[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title || !artist) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ title, artist });
        const res = await fetch(`${API_BASE}/suggestions?${params}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();
        if (data.ok) setSuggestions(data.suggestions);
      } catch {
        // suggestions are non-critical, fail silently
      } finally {
        setLoading(false);
      }
    };

    void fetchSuggestions();
  }, [title, artist]);

  return { suggestions, loading };
}
