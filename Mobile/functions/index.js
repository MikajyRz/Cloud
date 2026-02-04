const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyOnStatusChange = functions.firestore
  .document("signalements/{reportId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (newValue.status === previousValue.status) {
      return null;
    }

    const userId = newValue.uid;
    if (!userId) {
      console.log("No user ID found for this report.");
      return null;
    }

    const tokenRef = admin.firestore().collection("fcm_tokens").doc(userId);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      console.log(`No FCM token found for user ${userId}`);
      return null;
    }

    const fcmToken = tokenDoc.data().token;

    const payload = {
      notification: {
        title: "Mise à jour de votre signalement",
        body: `Le statut de votre signalement "${newValue.titre}" est passé à ${newValue.status}.`,
        sound: "default",
      },
    };

    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log("Notification sent successfully:", response);
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    return null;
  });
