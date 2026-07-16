import { useCallback, useEffect, useState } from "react";
import { destinationsApi, resolveAssetUrl } from "../services/api";
import { getDestinationDescription } from "../data/destinationCopy";

export function useDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await destinationsApi.list();

      setDestinations(
        (data.destinations || []).map((destination) => ({
          ...destination,
          image: resolveAssetUrl(destination.imagePath),
          description: getDestinationDescription(destination.slug),
        })),
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Impossible de charger les destinations.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { destinations, isLoading, error, reload: load };
}
