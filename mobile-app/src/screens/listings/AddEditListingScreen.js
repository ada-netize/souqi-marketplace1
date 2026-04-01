import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, AppButton, AppInput, ChipsRow, SectionHeader, Badge } from "../../components/ui";
import { useApp } from "../../auth-context";
import { isCars, isRealEstate, normalizePhone, isValidPhone, imageUri } from "../../helpers";
import { request } from "../../api";
import { spacing, colors, radius } from "../../theme";

const CAR_FIELDS = [["brand", "الماركة"], ["model", "الموديل"], ["year", "سنة الصنع"], ["transmission", "ناقل الحركة"], ["fuel", "الوقود"], ["kilometers", "الكيلومترات"]];
const PROPERTY_FIELDS = [["propertyType", "نوع العقار"], ["rooms", "عدد الغرف"], ["area", "المساحة"], ["purpose", "بيع / إيجار"]];

export default function AddEditListingScreen({ navigation, route }) {
  const { token, bootstrap, refreshProfile } = useApp();
  const editingId = route?.params?.id;
  const editing = !!editingId;
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successListing, setSuccessListing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", categoryId: "", cityId: "", condition: "used", whatsapp: "", phone: "", status: "available" });
  const [attributes, setAttributes] = useState({});

  useEffect(() => {
    if (!editingId) return;
    request(`/api/user/listings/${editingId}`, {}, token)
      .then((data) => {
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: String(data.price || ""),
          categoryId: String(data.category_id || ""),
          cityId: String(data.city_id || ""),
          condition: data.condition || "used",
          whatsapp: data.whatsapp || "",
          phone: data.phone || "",
          status: data.status || "available",
        });
        setExistingImages(data.images || []);
        setAttributes(data.attributes || {});
      })
      .catch((error) => Alert.alert("خطأ", error?.message || "فشل تحميل الإعلان"));
  }, [editingId, token]);

  const dynamicFields = isCars(form.categoryId) ? CAR_FIELDS : isRealEstate(form.categoryId) ? PROPERTY_FIELDS : [];
  const imageCountLabel = useMemo(() => editing ? existingImages.length : images.length, [editing, existingImages.length, images.length]);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.86,
      selectionLimit: 8,
    });
    if (!res.canceled) setImages(res.assets || []);
  };

  const submit = async () => {
    try {
      const payload = {
        ...form,
        title: String(form.title || "").trim(),
        description: String(form.description || "").trim(),
        price: Number(form.price || 0),
        whatsapp: normalizePhone(form.whatsapp),
        phone: normalizePhone(form.phone),
        attributes: JSON.stringify(attributes),
        allowDirectBuy: 0,
      };

      if (!payload.title || payload.title.length < 4) return Alert.alert("تنبيه", "اكتب عنوانًا أوضح للإعلان");
      if (!payload.description || payload.description.length < 10) return Alert.alert("تنبيه", "اكتب وصفًا واضحًا للإعلان");
      if (!payload.price || payload.price <= 0) return Alert.alert("تنبيه", "أدخل سعرًا صحيحًا");
      if (!payload.categoryId || !payload.cityId) return Alert.alert("تنبيه", "اختر القسم والمدينة");
      if (!editing && images.length < 1) return Alert.alert("تنبيه", "إضافة صورة واحدة على الأقل للإعلان إجبارية");
      if (payload.phone && !isValidPhone(payload.phone)) return Alert.alert("تنبيه", "رقم الهاتف يجب أن يكون أرقامًا فقط وبصيغة صحيحة");
      if (payload.whatsapp && !isValidPhone(payload.whatsapp)) return Alert.alert("تنبيه", "رقم واتساب يجب أن يكون أرقامًا فقط وبصيغة صحيحة");

      setLoading(true);
      if (editing) {
        await request(`/api/user/listings/${editingId}`, { method: "PUT", body: payload }, token);
        Alert.alert("تم", "تم حفظ التعديلات بنجاح");
        navigation.goBack();
      } else {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => fd.append(key, value));
        images.forEach((img, index) => fd.append("images", { uri: img.uri, name: `listing-${index}.jpg`, type: img.mimeType || "image/jpeg" }));
        const created = await request("/api/user/listings", { method: "POST", body: fd }, token);
        setSuccessListing(created);
      }
      await refreshProfile();
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل حفظ الإعلان");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={true} contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{editing ? "EDIT LISTING" : "CREATE LISTING"}</Text>
        <Text style={styles.heroTitle}>{editing ? "حدّث إعلانك بأناقة" : "أنشئ إعلانًا يلفت النظر"}</Text>
        <Text style={styles.heroText}>املأ البيانات الأساسية، أضف صورًا جميلة، وسيظهر إعلانك داخل سوقي بشكل مرتب وجاهز للتواصل المباشر.</Text>
      </Card>

      <Card>
        <SectionHeader title={editing ? "تفاصيل الإعلان" : "بيانات الإعلان"} subtitle="كل حقل هنا ينعكس مباشرة على الشكل النهائي داخل التطبيق." />
        <AppInput label="العنوان" placeholder="مثال: iPhone 15 Pro بحالة ممتازة" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <AppInput label="الوصف" placeholder="اكتب وصفًا واضحًا ومختصرًا" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline={true} />
        <AppInput label="السعر" placeholder="مثال: 3200" value={form.price} onChangeText={(v) => setForm({ ...form, price: String(v || "").replace(/[^\d.]/g, "") })} keyboardType="numeric" rightLabel="₪" />
        <SectionHeader title="القسم" subtitle="اختر القسم الأنسب ليظهر إعلانك للمستخدمين المناسبين." />
        <ChipsRow items={bootstrap?.categories || []} selected={form.categoryId} onSelect={(value) => setForm({ ...form, categoryId: value })} />
        <View style={styles.gap} />
        <SectionHeader title="المدينة" subtitle="حدد المدينة حتى يظهر الإعلان محليًا بشكل أدق." />
        <ChipsRow items={bootstrap?.cities || []} selected={form.cityId} onSelect={(value) => setForm({ ...form, cityId: value })} />
        <AppInput label="حالة المنتج" placeholder="used / new / like_new" value={form.condition} onChangeText={(v) => setForm({ ...form, condition: v })} />
        <AppInput label="واتساب" placeholder="05xxxxxxxx" value={form.whatsapp} onChangeText={(v) => setForm({ ...form, whatsapp: normalizePhone(v) })} keyboardType="phone-pad" maxLength={15} textContentType="telephoneNumber" />
        <AppInput label="الهاتف" placeholder="05xxxxxxxx" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: normalizePhone(v) })} keyboardType="phone-pad" maxLength={15} textContentType="telephoneNumber" />
        <Text style={styles.note}>في سوقي، التفاهم والاتفاق يتمان مباشرة بين الطرفين عبر الاتصال، واتساب، أو الرسائل داخل التطبيق.</Text>
        {dynamicFields.map(([key, label]) => (
          <AppInput key={key} label={label} placeholder={label} value={String(attributes[key] || "")} onChangeText={(v) => setAttributes({ ...attributes, [key]: v })} />
        ))}
      </Card>

      <Card>
        <SectionHeader title="صور الإعلان" subtitle="أضف صورًا واضحة حتى يظهر إعلانك بشكل احترافي وجذاب." />
        <View style={styles.rowWrap}>
          {!editing ? <AppButton title={`اختيار صور (${images.length})`} style={styles.flexOne} onPress={pickImages} /> : null}
          <Badge title={imageCountLabel > 0 ? `تم اختيار ${imageCountLabel}` : "صورة واحدة على الأقل"} tone={imageCountLabel > 0 ? "success" : "warning"} />
        </View>
        <View style={styles.gallery}>
          {(editing ? existingImages : images.map((item) => item.uri)).slice(0, 6).map((item, index) => (
            <Image key={`${item}-${index}`} source={{ uri: editing ? imageUri(item) : item }} style={styles.thumb} />
          ))}
        </View>
        {!editing ? <Text style={styles.requiredText}>إضافة صور للإعلان إجبارية قبل النشر.</Text> : null}
        <AppButton title={loading ? "جارٍ الحفظ..." : editing ? "حفظ التعديلات" : "نشر الإعلان الآن"} onPress={submit} loading={loading} />
      </Card>

      <Modal visible={!!successListing} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={colors.white} /></View>
            <Text style={styles.modalTitle}>تم النشر بنجاح</Text>
            <Text style={styles.modalText}>أصبح إعلانك الآن ظاهرًا داخل سوقي بشكل مرتب وجاهز لاستقبال الرسائل والعروض.</Text>
            <View style={styles.modalListingBox}>
              <Text style={styles.modalListingLabel}>اسم الإعلان</Text>
              <Text style={styles.modalListingName}>{successListing?.title}</Text>
            </View>
            <AppButton title="عرض الإعلان" onPress={() => {
              const created = successListing;
              setSuccessListing(null);
              navigation.navigate("ListingDetails", { id: created?.id });
            }} />
            <AppButton title="إضافة إعلان آخر" variant="secondary" style={{ marginTop: 12 }} onPress={() => {
              setSuccessListing(null);
              setImages([]);
              setForm({ title: "", description: "", price: "", categoryId: "", cityId: "", condition: "used", whatsapp: "", phone: "", status: "available" });
              setAttributes({});
            }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  heroCard: { backgroundColor: colors.primarySofter },
  heroEyebrow: { color: colors.primary, fontSize: 12, fontWeight: "900", textAlign: "right", letterSpacing: 0.9 },
  heroTitle: { marginTop: 10, color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "right" },
  heroText: { marginTop: 10, color: colors.textSoft, lineHeight: 22, textAlign: "right" },
  gap: { height: spacing.sm },
  rowWrap: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md, flexWrap: "wrap" },
  flexOne: { flex: 1 },
  note: { marginTop: spacing.md, marginBottom: spacing.md, color: colors.textSoft, lineHeight: 22, textAlign: "right" },
  requiredText: { marginTop: spacing.sm, marginBottom: spacing.md, color: colors.warning, fontWeight: "800", textAlign: "right" },
  gallery: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  thumb: { width: 86, height: 86, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, alignItems: "center" },
  successIcon: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  modalTitle: { marginTop: 18, fontSize: 28, fontWeight: "900", color: colors.text, textAlign: "center" },
  modalText: { marginTop: 10, color: colors.textSoft, textAlign: "center", lineHeight: 22 },
  modalListingBox: { width: "100%", marginTop: 18, marginBottom: 18, backgroundColor: colors.primarySofter, borderRadius: radius.lg, padding: 16 },
  modalListingLabel: { color: colors.textMuted, textAlign: "center", fontWeight: "700" },
  modalListingName: { marginTop: 6, color: colors.text, textAlign: "center", fontSize: 18, fontWeight: "900" },
});
