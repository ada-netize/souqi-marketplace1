import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
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
  white: "#ffffff",
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

        <View style={styles.badgesRow}>
          {item?.pinned_active ? <Text style={styles.badge}>مثبت</Text> : null}
          {item?.boost_active ? <Text style={styles.badge}>مرفوع</Text> : null}
          {item?.sponsor_home_active ? <Text style={styles.badge}>ممول</Text> : null}
        </View>
      </View>
    </View>
  );
}

function Section({ title, rows = [] }) {
  if (!rows?.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </View>
  );
}

export default function HomeScreen({ bootstrap }) {
  const platformName = bootstrap?.settings?.platformName || "سوقي";
  const tagline =
    bootstrap?.settings?.primaryTagline || "منصة إعلانات عربية أنيقة";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroMini}>TRIANGLE MARKETPLACE</Text>
        <Text style={styles.heroTitle}>{platformName}</Text>
        <Text style={styles.heroText}>{tagline}</Text>
      </View>

      <View style={styles.categoriesWrap}>
        <Text style={styles.sectionTitle}>الأقسام</Text>

        <View style={styles.categoriesRow}>
          {(bootstrap?.categories || []).map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryChip} activeOpacity={0.9}>
              <Text style={styles.categoryText}>
                {cat.icon ? `${cat.icon} ` : ""}
                {cat.name_ar}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Section title="إعلانات ممولة" rows={bootstrap?.sponsoredHome || []} />
      <Section title="مميزة" rows={bootstrap?.featured || []} />
      <Section title="قريبة منك" rows={bootstrap?.nearby || []} />
      <Section title="أحدث الإعلانات" rows={bootstrap?.latest || []} />
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
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroMini: {
    color: "#dff7e8",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "right",
  },
  heroText: {
    color: "#ecfff4",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "right",
  },
  categoriesWrap: {
    marginBottom: 18,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  categoryText: {
    color: colors.text,
    fontWeight: "700",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
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
    height: 180,
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
  badgesRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "800",
  },
});
