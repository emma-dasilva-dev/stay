import { useCallback, useEffect, useState } from "react";
import { destinationsApi, resolveAssetUrl } from "../services/api";


export function useDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");


  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");


    try {
      const data = await destinationsApi.list();


      const formattedDestinations = (data.destinations || []).map(
        (destination) => ({
          ...destination,
          image: resolveAssetUrl(destination.imagePath),
          description: destination.shortDescription || "",
        }),
      );


      setDestinations(formattedDestinations);
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


  return {
    destinations,
    isLoading,
    error,
    reload: load,
  };
}
