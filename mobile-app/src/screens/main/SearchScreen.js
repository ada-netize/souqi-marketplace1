import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Card,
  AppButton,
  AppInput,
  SectionHeader,
  EmptyState,
  Badge,
} from "../../components/ui";
import ListingCard from "../../components/ListingCard";
import { spacing, colors, radius, shadow } from "../../theme";
import { useApp } from "../../auth-context";
import { request } from "../../api";
import { isCars, isRealEstate } from "../../helpers";

const CAR_FIELDS = [
  ["brand", "الماركة"],
  ["model", "الموديل"],
  ["year", "سنة الصنع"],
  ["transmission", "ناقل الحركة"],
  ["fuel", "الوقود"],
];
const PROPERTY_FIELDS = [
  ["propertyType", "نوع العقار"],
  ["rooms", "عدد الغرف"],
  ["area", "المساحة"],
  ["purpose", "بيع / إيجار"],
];
const sortOptions = [
  { id: "latest", name_ar: "الأحدث" },
  { id: "price_low", name_ar: "الأقل سعرًا" },
  { id: "price_high", name_ar: "الأعلى سعرًا" },
];
const conditionOptions = [
  { id: "", name_ar: "كل الحالات" },
  { id: "new", name_ar: "جديد" },
  { id: "like_new", name_ar: "شبه جديد" },
  { id: "used", name_ar: "مستعمل" },
];

function SelectSheet({ visible, title, items, selected, onClose, onPick, labelKey = "name_ar", valueKey = "id" }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {items.map((item) => {
              const value = String(item[valueKey] ?? "");
              const label = item[labelKey] || "بدون اسم";
              const active = String(selected ?? "") === value;
              return (
                <TouchableOpacity
                  key={`${title}-${value}`}
                  activeOpacity={0.9}
                  style={[styles.sheetOption, active && styles.sheetOptionActive]}
                  onPress={() => {
                    onPick(value);
                    onClose();
                  }}
                >
                  <View style={styles.sheetOptionTextWrap}>
                    <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>{label}</Text>
                  </View>
                  <Ionicons
                    name={active ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FilterTile({ label, value, placeholder, icon, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.filterTile}>
      <View style={styles.filterTileTop}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
        <Text style={styles.filterTileLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={[styles.filterTileValue, !value && styles.filterTilePlaceholder]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation, route }) {
  const { bootstrap, token, profile, favoriteToggle } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openSheet, setOpenSheet] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    q: route?.params?.initialQuery || "",
    cityId: route?.params?.cityId ? String(route.params.cityId) : "",
    categoryId: route?.params?.categoryId ? String(route.params.categoryId) : "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    featured: route?.params?.featured ? "1" : "",
    sort: "latest",
    brand: "",
    model: "",
    year: "",
    transmission: "",
    fuel: "",
    propertyType: "",
    rooms: "",
    area: "",
    purpose: "",
  });

  const favoriteIds = useMemo(() => new Set(profile?.favoriteIds || []), [profile]);
  const categories = bootstrap?.categories || [];
  const cities = bootstrap?.cities || [];
  const activeCategory = categories.find((item) => String(item.id) === String(filters.categoryId));
  const activeCity = cities.find((item) => String(item.id) === String(filters.cityId));
  const activeSort = sortOptions.find((item) => String(item.id) === String(filters.sort));
  const activeCondition = conditionOptions.find((item) => String(item.id) === String(filters.condition));

  const showCars = isCars(filters.categoryId);
  const showRealEstate = isRealEstate(filters.categoryId);

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.append(key, String(value));
      }
    });
    return params.toString();
  };

  const load = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const query = buildQuery();
      const data = await request(`/api/public/listings${query ? `?${query}` : ""}`, {}, token);
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      setRows([]);
      setErrorMessage(error?.message || "فشل تحميل النتائج");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bootstrap) return;
    load();
  }, [bootstrap]);

  useEffect(() => {
    if (!bootstrap) return;
    load();
  }, [filters.categoryId, filters.cityId, filters.condition, filters.sort, filters.featured]);

  const resetFilters = () => {
    setFilters({
      q: "",
      cityId: "",
      categoryId: "",
      minPrice: "",
      maxPrice: "",
      condition: "",
      featured: "",
      sort: "latest",
      brand: "",
      model: "",
      year: "",
      transmission: "",
      fuel: "",
      propertyType: "",
      rooms: "",
      area: "",
      purpose: "",
    });
  };

  return (
    <>
      <SelectSheet
        visible={openSheet === "category"}
        title="اختر القسم"
        items={categories}
        selected={filters.categoryId}
        onClose={() => setOpenSheet("")}
        onPick={(value) => setFilters((prev) => ({ ...prev, categoryId: value }))}
      />
      <SelectSheet
        visible={openSheet === "city"}
        title="اختر المدينة"
        items={cities}
        selected={filters.cityId}
        onClose={() => setOpenSheet("")}
        onPick={(value) => setFilters((prev) => ({ ...prev, cityId: value }))}
      />
      <SelectSheet
        visible={openSheet === "sort"}
        title="الترتيب"
        items={sortOptions}
        selected={filters.sort}
        onClose={() => setOpenSheet("")}
        onPick={(value) => setFilters((prev) => ({ ...prev, sort: value }))}
      />
      <SelectSheet
        visible={openSheet === "condition"}
        title="حالة المنتج"
        items={conditionOptions}
        selected={filters.condition}
        onClose={() => setOpenSheet("")}
        onPick={(value) => setFilters((prev) => ({ ...prev, condition: value }))}
      />

      <Screen scroll contentStyle={styles.container}>
        <Card style={styles.heroCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity activeOpacity={0.9} style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-forward" size={22} color={colors.primaryDark} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.heroTitle}>البحث المتقدم</Text>
              <Text style={styles.heroText}>اختر القسم والمدينة من قوائم واضحة، وأول ما يكون في منتجات حقيقية ضمن هذا القسم ستظهر مباشرة تحت.</Text>
            </View>
          </View>

          <AppInput
            label="ابحث باسم المنتج"
            placeholder="مثال: آيفون، لابتوب، كنبة، شقة"
            value={filters.q}
            onChangeText={(v) => setFilters((prev) => ({ ...prev, q: v }))}
            returnKeyType="search"
            onSubmitEditing={load}
          />

          <View style={styles.tilesGrid}>
            <FilterTile
              label="القسم"
              value={activeCategory?.name_ar || ""}
              placeholder="اختر القسم"
              icon="grid-outline"
              onPress={() => setOpenSheet("category")}
            />
            <FilterTile
              label="المدينة"
              value={activeCity?.name_ar || ""}
              placeholder="كل المدن"
              icon="location-outline"
              onPress={() => setOpenSheet("city")}
            />
            <FilterTile
              label="الترتيب"
              value={activeSort?.name_ar || ""}
              placeholder="الأحدث"
              icon="swap-vertical-outline"
              onPress={() => setOpenSheet("sort")}
            />
            <FilterTile
              label="الحالة"
              value={activeCondition?.name_ar || ""}
              placeholder="كل الحالات"
              icon="sparkles-outline"
              onPress={() => setOpenSheet("condition")}
            />
          </View>

          <View style={styles.inlineInfoRow}>
            <TouchableOpacity
              style={[styles.featuredToggle, filters.featured ? styles.featuredToggleActive : null]}
              activeOpacity={0.9}
              onPress={() => setFilters((prev) => ({ ...prev, featured: prev.featured ? "" : "1" }))}
            >
              <Ionicons name="sparkles" size={16} color={filters.featured ? colors.white : colors.primaryDark} />
              <Text style={[styles.featuredToggleText, filters.featured ? styles.featuredToggleTextActive : null]}>
                {filters.featured ? "المميزة فقط" : "إظهار المميزة فقط"}
              </Text>
            </TouchableOpacity>
            <Badge title={`${rows.length} نتيجة`} tone="success" />
          </View>
        </Card>

        <Card style={styles.advancedCard}>
          <TouchableOpacity activeOpacity={0.9} style={styles.advancedHeader} onPress={() => setShowAdvanced((v) => !v)}>
            <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color={colors.primaryDark} />
            <View style={styles.advancedHeaderTextWrap}>
              <Text style={styles.advancedTitle}>فلاتر إضافية</Text>
              <Text style={styles.advancedSubtitle}>سعر، مواصفات، وحالة المنتج بشكل مرتب وواسع.</Text>
            </View>
          </TouchableOpacity>

          {showAdvanced ? (
            <>
              <View style={styles.priceRow}>
                <AppInput
                  style={styles.half}
                  label="من سعر"
                  placeholder="0"
                  value={filters.minPrice}
                  onChangeText={(v) => setFilters((prev) => ({ ...prev, minPrice: v.replace(/[^\d.]/g, "") }))}
                  keyboardType="numeric"
                />
                <AppInput
                  style={styles.half}
                  label="إلى سعر"
                  placeholder="999999"
                  value={filters.maxPrice}
                  onChangeText={(v) => setFilters((prev) => ({ ...prev, maxPrice: v.replace(/[^\d.]/g, "") }))}
                  keyboardType="numeric"
                />
              </View>

              {showCars
                ? CAR_FIELDS.map(([key, label]) => (
                    <AppInput
                      key={key}
                      label={label}
                      placeholder={label}
                      value={filters[key]}
                      onChangeText={(v) => setFilters((prev) => ({ ...prev, [key]: v }))}
                    />
                  ))
                : null}

              {showRealEstate
                ? PROPERTY_FIELDS.map(([key, label]) => (
                    <AppInput
                      key={key}
                      label={label}
                      placeholder={label}
                      value={filters[key]}
                      onChangeText={(v) => setFilters((prev) => ({ ...prev, [key]: v }))}
                    />
                  ))
                : null}
            </>
          ) : null}

          <View style={styles.actionsRow}>
            <AppButton title={loading ? "جارٍ التحديث..." : "عرض النتائج"} onPress={load} loading={loading} style={styles.flexOne} />
            <AppButton title="تصفير" variant="secondary" style={styles.resetButton} onPress={resetFilters} />
          </View>
        </Card>

        <SectionHeader
          title={activeCategory ? `نتائج ${activeCategory.name_ar}` : "كل الإعلانات"}
          subtitle={activeCity ? `المدينة: ${activeCity.name_ar}` : "إذا كان القسم يحتوي منتجات فعلية فستراها هنا مباشرة."}
        />

        {loading ? (
          <Card style={styles.loaderCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>جاري تحميل النتائج...</Text>
          </Card>
        ) : null}

        {!loading && errorMessage ? <EmptyState title="تعذر تحميل النتائج" text={errorMessage} /> : null}
        {!loading && !errorMessage && rows.length === 0 ? (
          <EmptyState title="لا توجد نتائج الآن" text="جرّب تغيير القسم أو إزالة بعض الفلاتر، وإذا كان في منتجات حقيقية ضمن هذا القسم فستظهر هنا مباشرة." />
        ) : null}

        {!loading && rows.length > 0 ? (
          <View style={styles.resultsWrap}>
            {rows.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                favorite={favoriteIds.has(item.id)}
                onPress={() => navigation.navigate("ListingDetails", { id: item.id })}
                onFav={() => favoriteToggle(item.id)}
              />
            ))}
          </View>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 150,
  },
  heroCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySofter,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: { flex: 1 },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "right",
  },
  heroText: {
    marginTop: 8,
    color: colors.textSoft,
    textAlign: "right",
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  tilesGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  filterTile: {
    width: "48.5%",
    minHeight: 96,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  filterTileTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  filterTileLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  filterTileValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  filterTilePlaceholder: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  inlineInfoRow: {
    marginTop: spacing.md,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  featuredToggle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.primarySofter,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  featuredToggleText: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  featuredToggleTextActive: {
    color: colors.white,
  },
  advancedCard: {
    borderRadius: radius.xxl,
  },
  advancedHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  advancedHeaderTextWrap: { flex: 1 },
  advancedTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
  },
  advancedSubtitle: {
    marginTop: 6,
    color: colors.textSoft,
    textAlign: "right",
    lineHeight: 22,
  },
  priceRow: {
    marginTop: spacing.md,
    flexDirection: "row-reverse",
    gap: spacing.sm,
  },
  half: { flex: 1 },
  actionsRow: {
    marginTop: spacing.md,
    flexDirection: "row-reverse",
    gap: spacing.sm,
  },
  flexOne: { flex: 1 },
  resetButton: { minWidth: 110 },
  loaderCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loaderText: {
    marginTop: 10,
    color: colors.textSoft,
    fontWeight: "800",
  },
  resultsWrap: {
    gap: spacing.md,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: "78%",
    ...shadow,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: spacing.md,
  },
  sheetContent: { gap: 10, paddingBottom: 20 },
  sheetOption: {
    minHeight: 56,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySofter,
  },
  sheetOptionTextWrap: { flex: 1 },
  sheetOptionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  sheetOptionTextActive: {
    color: colors.primaryDark,
  },
});
