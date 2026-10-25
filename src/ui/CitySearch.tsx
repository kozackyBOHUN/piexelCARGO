import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { BoundaryFeature, MapCity } from "../world/geography";
import { searchCities } from "../world/search";
export function CitySearch({
  cities,
  voivodeships,
  onSelect,
}: {
  cities: readonly MapCity[];
  voivodeships: readonly BoundaryFeature[];
  onSelect: (city: MapCity) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  const results = useMemo(() => searchCities(cities, query), [cities, query]);
  const expanded = open && query.trim().length > 0;
  useEffect(() => {
    if (expanded)
      list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, results]);
  const choose = (city: MapCity) => {
    setQuery(city.name);
    setOpen(false);
    onSelect(city);
  };
  return (
    <div
      className="map-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={`${id}-input`}>Znajdź miasto</label>
      <div className="search-field">
        <input
          id={`${id}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          aria-activedescendant={
            expanded && results[active]
              ? `${id}-${results[active].id}`
              : undefined
          }
          aria-describedby={`${id}-hint`}
          autoComplete="off"
          placeholder="Np. Krakow lub Sącz…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                !expanded
                  ? 0
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      Math.max(1, results.length)) %
                    Math.max(1, results.length),
              );
            } else if (event.key === "Enter" && expanded && results[active]) {
              event.preventDefault();
              choose(results[active]);
            }
          }}
        />
        {expanded && (
          <div className="search-results">
            <ul
              role="listbox"
              id={`${id}-list`}
              aria-label="Pasujące miasta"
              ref={list}
            >
              {results.map((city, index) => (
                <li
                  role="option"
                  aria-selected={index === active}
                  id={`${id}-${city.id}`}
                  key={city.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(city)}
                >
                  {city.name}
                  <small>
                    {
                      voivodeships.find(
                        (region) => region.id === city.voivodeshipId,
                      )?.properties.name
                    }
                  </small>
                </li>
              ))}
            </ul>
            {results.length === 0 && (
              <p>Nie znaleziono miasta w zestawie demo.</p>
            )}
          </div>
        )}
      </div>
      <span id={`${id}-hint`}>
        Tylko {cities.length} miast demonstracyjnych
      </span>
    </div>
  );
}
