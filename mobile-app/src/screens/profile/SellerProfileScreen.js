import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Screen, Card, SectionHeader, EmptyState, Badge } from "../../components/ui";
import ListingCard from "../../components/ListingCard";
import { request } from "../../api";
import { useApp } from "../../auth-context";
import { colors, spacing } from "../../theme";

export default function SellerProfileScreen({ route, navigation }) {
  const { sellerId } = route.params;
  const { profile, favoriteToggle } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    request(`/api/public/sellers/${sellerId}`).then(setData).catch((error) => Alert.alert("خطأ", error?.message || "فشل تحميل صفحة البائع"));
  }, [sellerId]);

  if (!data) return <Screen><View style={styles.centered}><Text style={styles.meta}>جارٍ تحميل صفحة البائع...</Text></View></Screen>;
  const favoriteIds = new Set(profile?.favoriteIds || []);

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.name}>{data.seller.full_name}</Text>
        <Text style={styles.meta}>{data.seller.city?.name_ar || "منطقة المثلث"} • معدل الرد {data.seller.response_rate}%</Text>
        <Text style={styles.meta}>عدد الإعلانات: {data.seller.listings_count} • البيوع: {data.seller.sold_count}</Text>
        <View style={styles.badgesRow}><Badge title={data.seller.is_verified ? "موثق" : "غير موثق"} tone={data.seller.is_verified ? "success" : "default"} /></View>
      </Card>
      <SectionHeader title="إعلانات هذا البائع" subtitle="كل ما نشره هذا البائع داخل سوقي." />
      {(data.listings || []).length === 0 ? <EmptyState title="لا توجد إعلانات" text="لم يقم هذا البائع بنشر إعلانات حاليًا." /> : (data.listings || []).map((item) => <ListingCard key={item.id} item={item} favorite={favoriteIds.has(item.id)} onPress={() => navigation.navigate("ListingDetails", { id: item.id })} onFav={() => favoriteToggle(item.id)} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  heroCard: { backgroundColor: colors.primarySofter },
  badgesRow: { marginTop: spacing.sm, flexDirection: "row-reverse" },
  name: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "right" },
  meta: { marginTop: 8, color: colors.textSoft, textAlign: "right" },
});
