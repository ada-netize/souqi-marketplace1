import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { imageUri, listingStatusLabel, money } from "../helpers";
import { colors, radius, shadow, spacing } from "../theme";

export default function ListingCard({ item, onPress, onFav, favorite = false, compact = false }) {
  return (
    <TouchableOpacity activeOpacity={0.94} onPress={onPress} style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.imageWrap, compact && styles.compactImageWrap]}>
        <Image source={{ uri: imageUri(item.cover_image || item.images?.[0]) }} style={[styles.image, compact && styles.compactImage]} />
        <View style={[styles.statusPill, item.status === "sold" && styles.statusSoldPill]}>
          <Text style={styles.statusPillText}>{listingStatusLabel(item.status)}</Text>
        </View>
        {onFav ? (
          <TouchableOpacity onPress={onFav} style={styles.favoriteBtn}>
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={16} color={favorite ? colors.danger : colors.primaryDark} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{item.city?.name_ar || item.city_name || "—"} • {item.category?.name_ar || item.category_name || "—"}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.badgesWrap}>
            {item.pinned_active ? <Text style={styles.badge}>📌 مثبت</Text> : null}
            {item.boost_active ? <Text style={styles.badge}>⬆️ رفع</Text> : null}
            {item.sponsor_home_active ? <Text style={styles.badge}>💚 رئيسية</Text> : null}
            {item.is_featured ? <Text style={styles.badge}>⭐ مميز</Text> : null}
          </View>
          <Text style={styles.price}>{money(item.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow,
  },
  compactCard: { flexDirection: "row-reverse", alignItems: "stretch" },
  imageWrap: { position: "relative", backgroundColor: colors.surfaceAlt },
  compactImageWrap: { width: 132 },
  image: { width: "100%", height: 190, backgroundColor: colors.surfaceAlt },
  compactImage: { width: 132, height: "100%" },
  favoriteBtn: {
    position: "absolute",
    left: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusSoldPill: { backgroundColor: colors.danger },
  statusPillText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  content: { padding: spacing.md },
  title: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: "900", textAlign: "right" },
  meta: { marginTop: 6, color: colors.textSoft, textAlign: "right" },
  bottomRow: { marginTop: spacing.md, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.sm },
  badgesWrap: { flex: 1, flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  badge: { backgroundColor: colors.primarySofter, color: colors.primaryDark, fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, overflow: "hidden" },
  price: { color: colors.primaryDark, fontSize: 20, fontWeight: "900", textAlign: "right" },
});
