import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Image, Text, StyleSheet, TouchableOpacity, Linking, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, AppButton, AppInput, SectionHeader, EmptyState, Badge } from "../../components/ui";
import ListingCard from "../../components/ListingCard";
import { useApp } from "../../auth-context";
import { request } from "../../api";
import { colors, spacing, radius } from "../../theme";
import { imageUri, money, listingStatusLabel } from "../../helpers";

export default function ListingDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { token, profile, favoriteToggle, startConversation, sendOffer, activateCatalogProduct, refreshProfile, markSold } = useApp();
  const [data, setData] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [loadingPromo, setLoadingPromo] = useState("");
  const [soldPrice, setSoldPrice] = useState("");

  const load = async () => {
    try {
      const result = await request(`/api/public/listings/${id}`, {}, token);
      setData(result);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل تحميل الإعلان");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const favoriteIds = useMemo(() => new Set(profile?.favoriteIds || []), [profile]);

  if (!data) {
    return <Screen><View style={styles.centered}><Text style={styles.loadingText}>جارٍ تحميل الإعلان...</Text></View></Screen>;
  }

  const { listing, similar, meta } = data;
  const phone = listing.phone || listing.seller?.phone || "";
  const own = Number(profile?.user?.id) === Number(listing.user_id || listing.seller?.id);
  const isSold = String(listing.status) === "sold";

  const activatePromotion = async (productKey) => {
    try {
      setLoadingPromo(productKey);
      const result = await activateCatalogProduct({ productKey, listingId: listing.id });
      Alert.alert("تم", `تم تفعيل ${result.product.title} حتى ${result.activation.endDate}`);
      await load();
      await refreshProfile();
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل التفعيل");
    } finally {
      setLoadingPromo("");
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
        {(listing.images?.length ? listing.images : [listing.cover_image]).map((img, index) => (
          <Image key={index} source={{ uri: imageUri(img) }} style={styles.detailsImage} />
        ))}
      </ScrollView>

      <Card>
        <View style={styles.topRow}>
          <Text style={styles.price}>{money(listing.price)}</Text>
          <TouchableOpacity onPress={() => favoriteToggle(listing.id)} style={styles.favBubble}>
            <Text style={styles.favoriteText}>{favoriteIds.has(listing.id) ? "♥" : "♡"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.meta}>{listing.city?.name_ar || "—"} • {listing.category?.name_ar || "—"}</Text>

        <View style={styles.badgesLine}>
          <Badge title={listingStatusLabel(listing.status)} tone={isSold ? "warning" : "default"} />
          {listing.is_featured ? <Badge title="Featured" /> : null}
          {listing.boost_active ? <Badge title="Boost" tone="warning" /> : null}
          {listing.sponsor_home_active ? <Badge title="الرئيسية" tone="success" /> : null}
        </View>

        {isSold ? <Text style={styles.soldBanner}>تم بيع هذا الإعلان، وتم إغلاق التفاوض عليه داخل التطبيق.</Text> : null}

        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.attributesWrap}>
          {Object.entries(listing.attributes || {}).map(([key, value]) => (
            <View key={key} style={styles.attributeBox}>
              <Text style={styles.attributeKey}>{key}</Text>
              <Text style={styles.attributeValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <AppButton title="اتصال" style={styles.actionButton} onPress={() => phone && Linking.openURL(`tel:${phone}`)} />
          <AppButton title="واتساب" variant="secondary" style={styles.actionButton} onPress={() => phone ? Linking.openURL(`https://wa.me/${phone.replace(/^0/, "972")}`) : null} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("SellerProfile", { sellerId: listing.seller?.id })}>
          <Text style={styles.link}>عرض صفحة البائع</Text>
        </TouchableOpacity>
      </Card>

      {!own ? (
        isSold ? (
          <Card>
            <SectionHeader title="تم البيع" subtitle="لا يمكن بدء محادثة جديدة أو إرسال عرض على هذا الإعلان لأنه تم بيعه بالفعل." />
          </Card>
        ) : (
          <Card>
            <SectionHeader title="التواصل والتفاوض" subtitle="التفاهم يتم مباشرة بين الطرفين عبر الرسائل أو الاتصال أو واتساب." />
            <AppInput label="رسالة أولية" placeholder="اكتب رسالة للبائع" value={chatMessage} onChangeText={setChatMessage} multiline />
            <AppButton title="ابدأ محادثة" variant="secondary" onPress={async () => {
              try {
                const conv = await startConversation(listing.id, chatMessage || `مرحبًا، مهتم بإعلان: ${listing.title}`);
                navigation.navigate("Conversation", { id: conv.id });
              } catch (error) {
                Alert.alert("خطأ", error?.message || "فشل بدء المحادثة");
              }
            }} />

            <View style={styles.offerWrap}>
              <AppInput style={styles.flexOne} label="عرض السعر" placeholder="مثال: 12000" value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" />
            </View>
            <AppButton title="إرسال عرض السعر" onPress={async () => {
              try {
                if (!offerAmount || Number(offerAmount) <= 0) return Alert.alert("تنبيه", "أدخل قيمة صحيحة للعرض");
                await sendOffer(listing.id, offerAmount);
                setOfferAmount("");
                await refreshProfile();
                Alert.alert("تم", "تم إرسال العرض بنجاح");
              } catch (error) {
                Alert.alert("خطأ", error?.message || "فشل إرسال العرض");
              }
            }} />
          </Card>
        )
      ) : (
        <Card>
          <SectionHeader title="أدوات الربح والترويج" subtitle="المزايا الرقمية فقط: رفع الإعلان، Boost، Featured، والاشتراكات الشهرية." />
          <Text style={styles.infoText}>رفع يوم واحد: {meta?.raise1DayPrice} ₪ • رفع 3 أيام: {meta?.raise3DaysPrice} ₪</Text>
          <AppButton title={loadingPromo === "raise_1_day" ? "جارٍ التفعيل..." : "تفعيل رفع يوم واحد"} onPress={() => activatePromotion("raise_1_day")} loading={loadingPromo === "raise_1_day"} />
          <AppButton title={loadingPromo === "raise_3_days" ? "جارٍ التفعيل..." : "تفعيل رفع 3 أيام"} variant="secondary" onPress={() => activatePromotion("raise_3_days")} loading={loadingPromo === "raise_3_days"} style={styles.topGap} />

          <Text style={styles.infoText}>Boost 3 أيام: {meta?.boost3DaysPrice} ₪</Text>
          <AppButton title={loadingPromo === "boost_3_days" ? "جارٍ التفعيل..." : "تفعيل Boost"} onPress={() => activatePromotion("boost_3_days")} loading={loadingPromo === "boost_3_days"} />

          <Text style={styles.infoText}>Featured / الرئيسية 3 أيام: {meta?.featured3DaysPrice} ₪</Text>
          <AppButton title={loadingPromo === "featured_3_days" ? "جارٍ التفعيل..." : "تفعيل Featured"} variant="secondary" onPress={() => activatePromotion("featured_3_days")} loading={loadingPromo === "featured_3_days"} />

          {!isSold ? (
            <>
              <AppInput label="سعر البيع النهائي" placeholder="اختياري" value={soldPrice} onChangeText={setSoldPrice} keyboardType="numeric" />
              <AppButton title="تسجيل تم البيع" variant="secondary" onPress={async () => {
                try {
                  await markSold(listing.id, soldPrice || listing.price);
                  Alert.alert("تم", "تم تسجيل الإعلان كمباع");
                  await load();
                  await refreshProfile();
                } catch (error) {
                  Alert.alert("خطأ", error?.message || "فشل تحديث الحالة");
                }
              }} />
            </>
          ) : <Text style={styles.soldBanner}>الإعلان معلّم حاليًا على أنه تم البيع.</Text>}

          <AppButton title="تعديل الإعلان" style={styles.topGap} onPress={() => navigation.navigate("AddEditListing", { id: listing.id })} />
        </Card>
      )}

      <SectionHeader title="إعلانات مشابهة" subtitle="اقتراحات إضافية من نفس القسم أو النطاق." />
      {(similar || []).length === 0 ? <EmptyState title="لا توجد إعلانات مشابهة" text="سيظهر هنا المزيد من الإعلانات من نفس القسم." /> : (similar || []).map((item) => <ListingCard key={item.id} item={item} onPress={() => navigation.push("ListingDetails", { id: item.id })} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  centered: { minHeight: 300, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.textSoft },
  galleryRow: { gap: spacing.sm },
  detailsImage: { width: 320, height: 252, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt },
  topRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  price: { color: colors.primaryDark, fontSize: 28, fontWeight: "900", textAlign: "right" },
  favBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  favoriteText: { fontSize: 24, color: colors.primaryDark },
  title: { marginTop: 12, color: colors.text, fontSize: 24, fontWeight: "900", textAlign: "right" },
  meta: { marginTop: 8, color: colors.textSoft, textAlign: "right" },
  badgesLine: { marginTop: spacing.sm, flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.sm },
  soldBanner: { marginTop: spacing.md, backgroundColor: "#fff4d8", color: colors.warning, padding: spacing.sm, borderRadius: radius.md, textAlign: "right", fontWeight: "800", lineHeight: 22 },
  description: { marginTop: spacing.md, color: colors.text, lineHeight: 24, textAlign: "right" },
  attributesWrap: { marginTop: spacing.md, flexDirection: "row-reverse", flexWrap: "wrap", gap: spacing.sm },
  attributeBox: { minWidth: "46%", backgroundColor: colors.primarySofter, borderRadius: radius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  attributeKey: { color: colors.textSoft, fontSize: 12, textAlign: "right" },
  attributeValue: { color: colors.text, fontWeight: "800", marginTop: 6, textAlign: "right" },
  actionsRow: { flexDirection: "row-reverse", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { flex: 1 },
  link: { marginTop: spacing.md, color: colors.primaryDark, fontWeight: "900", textAlign: "right" },
  infoText: { marginBottom: spacing.sm, color: colors.textSoft, lineHeight: 22, textAlign: "right", marginTop: spacing.sm },
  offerWrap: { marginTop: spacing.sm },
  flexOne: { flex: 1 },
  topGap: { marginTop: spacing.sm },
});
