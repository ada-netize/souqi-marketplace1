import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../../components/ui";
import { useApp } from "../../auth-context";
import { colors, radius, shadow, spacing } from "../../theme";
import { imageUri, listingStatusLabel, money } from "../../helpers";

function pickIcon(slug = "") {
  const value = String(slug || "").toLowerCase();
  if (value.includes("mobile") || value.includes("phone") || value.includes("elect")) return "phone-portrait-outline";
  if (value.includes("fashion") || value.includes("cloth") || value.includes("wear")) return "shirt-outline";
  if (value.includes("home") || value.includes("furn") || value.includes("house")) return "bed-outline";
  if (value.includes("car") || value.includes("auto")) return "car-outline";
  return "grid-outline";
}

export default function HomeScreen({ navigation }) {
  const { bootstrap, profile, favoriteToggle } = useApp();

  const listings = useMemo(() => {
    const source = [ ...(bootstrap?.featured || []), ...(bootstrap?.latest || []), ...(bootstrap?.sponsoredHome || []) ];
    const map = new Map();
    source.forEach((item) => { if (item?.id && !map.has(item.id)) map.set(item.id, item); });
    return Array.from(map.values()).slice(0, 12);
  }, [bootstrap]);

  const shortcuts = useMemo(() => {
    const categories = bootstrap?.categories || [];
    return categories.slice(0, 4).map((item) => ({ id: item.id, title: item.name_ar, icon: pickIcon(item.slug) }));
  }, [bootstrap]);

  const favoriteIds = new Set(profile?.favoriteIds || []);

  if (!bootstrap) return <EmptyState title="جاري التحميل" text="يتم تجهيز الصفحة الرئيسية الآن." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.heroArea}>
              <View style={styles.topRow}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("ProfileHub")}>
                  <Ionicons name="notifications-outline" size={21} color={colors.white} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.logoTitle}>{bootstrap?.settings?.platformName || "سوقي"}</Text>
                  <Text style={styles.logoSubtitle}>أعلن وتصفح وتواصل بشكل مباشر</Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.94} style={styles.searchCard} onPress={() => navigation.navigate("Search")}>
                <Ionicons name="search-outline" size={22} color={colors.textMuted} />
                <Text style={styles.searchPlaceholder}>ابحث عن جوال، سيارة، شقة أو أي منتج</Text>
              </TouchableOpacity>

              <View style={styles.shortcutsRow}>
                {shortcuts.map((item) => (
                  <TouchableOpacity key={String(item.id)} style={styles.shortcutCard} onPress={() => navigation.navigate("Search", { categoryId: item.id })}>
                    <View style={styles.shortcutIconWrap}><Ionicons name={item.icon} size={25} color={colors.primaryDark} /></View>
                    <Text numberOfLines={2} style={styles.shortcutTitle}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sectionHead}>
              <TouchableOpacity onPress={() => navigation.navigate("Search")}><Text style={styles.sectionAction}>عرض الكل</Text></TouchableOpacity>
              <Text style={styles.sectionTitle}>إعلانات مختارة لك</Text>
            </View>
          </>
        }
        ListEmptyComponent={<EmptyState title="لا توجد إعلانات" text="ابدأ بإضافة إعلانك الأول داخل سوقي." />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.94} onPress={() => navigation.navigate("ListingDetails", { id: item.id })} style={styles.productCard}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri(item.cover_image || item.images?.[0]) }} style={styles.productImage} />
              <View style={[styles.statusPill, item.status === "sold" ? styles.statusSold : null]}>
                <Text style={styles.statusText}>{listingStatusLabel(item.status)}</Text>
              </View>
              <TouchableOpacity style={styles.favoritePill} onPress={() => favoriteToggle(item.id)}>
                <Ionicons name={favoriteIds.has(item.id) ? "heart" : "heart-outline"} size={16} color={favoriteIds.has(item.id) ? colors.danger : colors.primaryDark} />
              </TouchableOpacity>
            </View>
            <Text numberOfLines={1} style={styles.productTitle}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.productMeta}>{item.city?.name_ar || item.city_name || "—"}</Text>
            <View style={styles.priceRow}>
              <Ionicons name="chevron-back" size={16} color={colors.primaryDark} />
              <Text style={styles.productPrice}>{money(item.price)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1, backgroundColor: colors.bg },
  contentContainer: { paddingBottom: 130 },
  heroArea: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  topRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  logoTitle: { color: colors.white, fontSize: 36, fontWeight: "900", textAlign: "right" },
  logoSubtitle: { color: "#DEF5E7", textAlign: "right", marginTop: 4 },
  searchCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    ...shadow,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: 15, flex: 1, textAlign: "right" },
  shortcutsRow: { marginTop: 18, flexDirection: "row-reverse", gap: 10, justifyContent: "space-between" },
  shortcutCard: { flex: 1, backgroundColor: colors.white, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", ...shadow },
  shortcutIconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySofter, alignItems: "center", justifyContent: "center" },
  shortcutTitle: { marginTop: 10, color: colors.text, fontWeight: "900", textAlign: "center", lineHeight: 20 },
  sectionHead: { marginTop: 22, marginBottom: 10, paddingHorizontal: 18, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900" },
  sectionAction: { color: colors.primaryDark, fontWeight: "800", fontSize: 14 },
  columnWrapper: { paddingHorizontal: 14, gap: 12 },
  productCard: { flex: 1, backgroundColor: colors.white, borderRadius: 24, marginTop: 12, padding: 10, borderWidth: 1, borderColor: colors.border, ...shadow },
  imageWrap: { backgroundColor: colors.surfaceAlt, borderRadius: 20, overflow: "hidden", position: "relative" },
  productImage: { width: "100%", aspectRatio: 1, resizeMode: "cover", backgroundColor: colors.surfaceAlt },
  statusPill: { position: "absolute", right: 8, bottom: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusSold: { backgroundColor: colors.danger },
  statusText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  favoritePill: { position: "absolute", left: 8, top: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.96)", alignItems: "center", justifyContent: "center" },
  productTitle: { marginTop: 12, color: colors.text, fontSize: 16, fontWeight: "900", textAlign: "right" },
  productMeta: { marginTop: 6, color: colors.textSoft, textAlign: "right" },
  priceRow: { marginTop: 10, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  productPrice: { color: colors.primaryDark, fontSize: 20, fontWeight: "900" },
});
