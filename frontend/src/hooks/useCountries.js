import { useEffect, useState } from "react";
import { CountriesAPI } from "../api/endpoints";
import { COUNTRY_FLAG as STATIC_FLAGS } from "../constants";

// Fetches the live country list once and caches it for the session (countries change rarely;
// the Admin Tools "Countries" tab triggers a full page reload-free experience anyway since
// each page that needs the list calls this hook independently and Vite/React handle the
// small duplicate fetch cost fine at this scale).
export function useCountries() {
  const [countries, setCountries] = useState([]); // [{_id, name, flagEmoji, active}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CountriesAPI.list()
      .then(({ countries }) => setCountries(countries))
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  const activeNames = countries.filter((c) => c.active).map((c) => c.name);
  const allNames = countries.map((c) => c.name);

  function flagFor(name) {
    const found = countries.find((c) => c.name === name);
    return found?.flagEmoji || STATIC_FLAGS[name] || "🌐";
  }

  return { countries, activeNames, allNames, flagFor, loading };
}
