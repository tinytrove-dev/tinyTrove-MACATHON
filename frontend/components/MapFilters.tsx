import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FILTER_OPTIONS, MapFilterValues, NO_FILTERS, hasActiveFilters } from "../lib/mapFilters";

type FilterKey = keyof MapFilterValues;

const CHIPS: { key: FilterKey; title: string; note?: string }[] = [
  { key: "distanceKm", title: "Distance", note: "Uses your current location." },
  { key: "maxPrice", title: "Price", note: "Places nobody has posted a price for are faded." },
  { key: "stock", title: "Stock", note: "Based on other people's in-stock and sold-out checks." },
  { key: "withinDays", title: "Last seen", note: "When it was last posted or confirmed in stock." },
];

interface MapFiltersProps {
  values: MapFilterValues;
  onChange: (values: MapFilterValues) => void;
  matchCount: number;
  totalCount: number;
  // True while waiting for the user's location after picking a distance
  locating?: boolean;
}

export default function MapFilters({ values, onChange, matchCount, totalCount, locating }: MapFiltersProps) {
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const active = hasActiveFilters(values);

  const labelFor = (key: FilterKey) => {
    const option = (FILTER_OPTIONS[key] as { label: string; value: unknown }[]).find(
      (o) => o.value === values[key]
    );
    return option && option.value !== NO_FILTERS[key] ? option.label : null;
  };

  const openChip = CHIPS.find((chip) => chip.key === openKey);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {CHIPS.map((chip) => {
          const selectedLabel = labelFor(chip.key);
          const isOpen = openKey === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => setOpenKey(isOpen ? null : chip.key)}
              style={[styles.chip, selectedLabel && styles.chipActive, isOpen && styles.chipOpen]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <Text style={[styles.chipText, selectedLabel && styles.chipTextActive]}>
                {selectedLabel ?? chip.title} {isOpen ? "▴" : "▾"}
              </Text>
            </Pressable>
          );
        })}
        {active && (
          <Pressable
            onPress={() => {
              onChange(NO_FILTERS);
              setOpenKey(null);
            }}
            style={styles.clearChip}
            accessibilityRole="button"
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </ScrollView>

      {openChip && (
        <View style={styles.optionsCard}>
          <View style={styles.optionRow}>
            {(FILTER_OPTIONS[openChip.key] as { label: string; value: unknown }[]).map((option) => {
              const selected = values[openChip.key] === option.value;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    onChange({ ...values, [openChip.key]: option.value });
                    setOpenKey(null);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {openChip.note && <Text style={styles.note}>{openChip.note}</Text>}
        </View>
      )}

      {active && (
        <View style={styles.summary}>
          {locating ? (
            <ActivityIndicator size="small" color="#8C5A3C" />
          ) : (
            <Text style={styles.summaryText}>
              {matchCount === 0
                ? "No places match. Try loosening a filter."
                : `${matchCount} of ${totalCount} ${totalCount === 1 ? "place matches" : "places match"}`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#FFF8F0",
    borderColor: "#8C5A3C",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: "#8C5A3C",
  },
  chipOpen: {
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3A291F",
  },
  chipTextActive: {
    color: "#FFF8F0",
  },
  clearChip: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  clearText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8C5A3C",
    textDecorationLine: "underline",
  },
  optionsCard: {
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: "#FFE6C9",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  optionSelected: {
    backgroundColor: "#FF4F8B",
  },
  optionText: {
    fontSize: 14,
    color: "#3A291F",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B5342",
  },
  summary: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: "rgba(255, 248, 240, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A291F",
  },
});
