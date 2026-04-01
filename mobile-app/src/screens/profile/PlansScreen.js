import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Screen, Card, SectionHeader, Badge, AppButton } from "../../components/ui";
import { useApp } from "../../auth-context";
import { colors, spacing } from "../../theme";

function Row({ title, price, subtitle, badge, actionTitle, onAction, loading }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowMeta}>{subtitle}</Text></View>
      <View style={styles.rowRight}>
        {badge ? <Badge title={badge} tone={badge === "مفعلة" ? "success" : "warning"} /> : null}
        <Text style={styles.rowPrice}>{price}</Text>
        {actionTitle ? <AppButton title={actionTitle} onPress={onAction} loading={loading} style={styles.miniButton} /> : null}
      </View>
    </View>
  );
}

export default function PlansScreen() {
  const { bootstrap, activateCatalogProduct, profile } = useApp();
  const [loadingKey, setLoadingKey] = useState("");
  const catalog = bootstrap?.catalog || { listingPromotions: [], subscriptions: [] };
  const activePlan = profile?.user?.subscription_plan || "free";
  const subscriptions = useMemo(() => catalog.subscriptions || [], [catalog]);
  const promotions = useMemo(() => catalog.listingPromotions || [], [catalog]);

  const activate = async (key) => {
    try {
      setLoadingKey(key);
      const result = await activateCatalogProduct({ productKey: key });
      Alert.alert("تم", `تم تفعيل ${result.product.title} بنجاح`);
    } catch (error) { Alert.alert("خطأ", error?.message || "فشل التفعيل"); }
    finally { setLoadingKey(""); }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.heroBadge}>SOUQI PREMIUM</Text>
        <Text style={styles.heroTitle}>الباقات والترقيات</Text>
        <Text style={styles.heroText}>المنتجات الرقمية فقط: رفع الإعلان و Boost و Featured والاشتراكات الشهرية القابلة للربط مع المتاجر.</Text>
      </Card>
      <Card>
        <SectionHeader title="ترقيات الإعلان" subtitle="منتجات رقمية جاهزة للربط مع App Store وGoogle Play." />
        {promotions.map((item) => <Row key={item.key} title={item.title} price={`${item.price} ₪`} subtitle={`${item.subtitle}
iOS: ${item.iosProductId} • Android: ${item.androidProductId}`} badge="Consumable" />)}
      </Card>
      <Card>
        <SectionHeader title="اشتراكات المتجر" subtitle={`الخطة الحالية: ${activePlan === "free" ? "مجانية" : activePlan}`} />
        {subscriptions.map((item) => <Row key={item.key} title={item.title} price={`${item.price} ₪ / شهر`} subtitle={`${item.subtitle}
iOS: ${item.iosProductId} • Android: ${item.androidProductId}`} badge={item.planKey === activePlan ? "مفعلة" : "Subscription"} actionTitle={item.planKey === activePlan ? "مفعلة" : "تفعيل الآن"} onAction={() => (item.planKey === activePlan ? null : activate(item.key))} loading={loadingKey === item.key} />)}
        <Text style={styles.info}>يبقى فقط ربط الحسابات والمنتجات النهائية في App Store Connect وGoogle Play Console قبل الإطلاق على المتاجر.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  heroCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  heroBadge: { alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.16)", color: colors.white, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "900" },
  heroTitle: { marginTop: 14, color: colors.white, fontSize: 30, fontWeight: "900", textAlign: "right" },
  heroText: { marginTop: 10, color: "#EBFFF0", textAlign: "right", lineHeight: 23 },
  info: { color: colors.textSoft, textAlign: "right", lineHeight: 23, marginTop: spacing.sm },
  row: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: "900", textAlign: "right", fontSize: 16 },
  rowMeta: { marginTop: 6, color: colors.textSoft, textAlign: "right", lineHeight: 21 },
  rowRight: { alignItems: "flex-end", gap: 8, width: 156 },
  rowPrice: { color: colors.primaryDark, fontWeight: "900", fontSize: 20 },
  miniButton: { minHeight: 46, width: "100%" },
});
