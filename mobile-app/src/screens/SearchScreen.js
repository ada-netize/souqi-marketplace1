import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";

const colors = {
  bg: "#f6fbf8",
  surface: "#ffffff",
  text: "#0f1728",
  textSoft: "#5b677a",
  border: "#d8e7dc",
  primary: "#1f8f5f",
  primarySoft: "#e1f5eb",
};

function imageUri(item) {
  const cover = item?.cover_image || item?.images?.[0];
  if (!cover) return null;
  if (cover.startsWith("http")) return cover;
  return `http://10.0.0.12:5000${cover}`;
}

function ListingCard({ item }) {
  const uri = imageUri(item);

  return (
    <View style={styles.listingCard}>
      {uri ? <Image source={{ uri }} style={styles.listingImage} /> : null}

      <View style={styles.listingBody}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {item?.title || "إعلان"}
        </Text>

        <Text style={styles.listingPrice}>
          {Number(item?.price || 0).toLocaleString()} ₪
        </Text>

        <Text style={styles.listingMeta} numberOfLines={1}>
          {item?.city?.name_ar || "مدينة"} • {item?.category?.name_ar || "قسم"}
        </Text>
      </View>
    </View>
  );
}

export default function SearchScreen({ bootstrap }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const allRows = useMemo(() => {
    const merged = [
      ...(bootstrap?.featured || []),
      ...(bootstrap?.latest || []),
      ...(bootstrap?.nearby || []),
      ...(bootstrap?.sponsoredHome || []),
    ];

    const map = new Map();
    merged.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });

    return Array.from(map.values());
  }, [bootstrap]);

  const filtered = useMemo(() => {
    return allRows.filter((item) => {
      const matchQuery = query.trim()
        ? String(item?.title || "")
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        : true;

      const matchCategory = categoryId
        ? String(item?.category_id || item?.category?.id) === String(categoryId)
        : true;

      return matchQuery && matchCategory;
    });
  }, [allRows, query, categoryId]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>البحث</Text>

      <View style={styles.filterBox}>
        <TextInput
          style={styles.input}
          placeholder="ابحث بعنوان الإعلان"
          placeholderTextColor={colors.textSoft}
          value={query}
          onChangeText={setQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !categoryId && styles.chipActive]}
            onPress={() => setCategoryId("")}
            activeOpacity={0.9}
          >
            <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>الكل</Text>
          </TouchableOpacity>

          {(bootstrap?.categories || []).map((cat) => {
            const active = String(categoryId) === String(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryId(String(cat.id))}
                activeOpacity={0.9}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name_ar}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.resultsText}>النتائج: {filtered.length}</Text>

      {filtered.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 14,
  },
  filterBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#f2f8f4",
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    textAlign: "right",
  },
  chipsRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 12,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  resultsText: {
    color: colors.textSoft,
    fontSize: 14,
    textAlign: "right",
    marginBottom: 12,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  listingImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#e8efe9",
  },
  listingBody: {
    padding: 14,
  },
  listingTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
  },
  listingPrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "right",
  },
  listingMeta: {
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 6,
    textAlign: "right",
  },
});
