import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { timeAgo } from "../lib/timeAgo";
import type { CheckSummary } from "./PostChecks";

// Prominent warning shown above a post while its checks add up to sold out (or
// people say it was never there), so nobody makes a wasted trip. Disappears once
// enough people validate it again.
export default function StockBanner({ summary, compact = false }: { summary: CheckSummary; compact?: boolean }) {
  if (summary.stock_status !== "sold_out" || !summary.stock_updated_at) return null;

  const recent = summary.recent_sold_out_count;
  const notReal = summary.not_real_count;
  const ago = timeAgo(summary.stock_updated_at);
  const when = /\d[mhd]$/.test(ago) ? `${ago} ago` : `on ${ago}`; // timeAgo gives a date past 30 days
  const title =
    notReal >= 2
      ? `${notReal} people say this was never there`
      : recent >= 2
      ? `${recent} people have recently marked this as out of stock`
      : recent === 1
        ? "Recently marked as out of stock"
        : "Marked as out of stock";

  return (
    <View style={[styles.banner, compact && styles.compact]} accessibilityRole="alert">
      <Text style={styles.icon}>⚠</Text>
      <View style={styles.textWrap}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
        <Text style={styles.subtitle}>
          Last reported {when}
          {compact ? "" : " · Seen it back in stock? Validate it below."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8D9C4",
    borderColor: "#C9784A",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  compact: { paddingVertical: 7, marginBottom: 8 },
  icon: { fontSize: 20, color: "#9A3D12", marginRight: 10 },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#9A3D12" },
  compactTitle: { fontSize: 14 },
  subtitle: { fontSize: 12, color: "#7A4A2C", marginTop: 2 },
});
