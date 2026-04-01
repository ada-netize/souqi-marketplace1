import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { request } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    ""
  );
}

function isExpoGoRemotePushUnsupported() {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

export async function registerPushToken(token) {
  if (!token) return null;
  if (isExpoGoRemotePushUnsupported()) return { ok: false, reason: "expo_go_android" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "الرسائل",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 200, 120, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") return { ok: false, reason: "permission_denied" };

  const projectId = getProjectId();
  if (!projectId) return { ok: false, reason: "missing_project_id" };

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await request(
    "/api/user/push/register",
    {
      method: "POST",
      body: {
        token: expoPushToken,
        platform: Platform.OS,
        projectId,
        appOwnership: Constants.appOwnership || "standalone",
        deviceName: Constants.deviceName || "device",
      },
    },
    token
  );

  return { ok: true, expoPushToken };
}
