interface BookingConfirmationData {
  patientName: string;
  serviceName: string;
  doctorName: string;
  dateTime: string; // already formatted in clinic timezone
}

interface Reminder24hData {
  patientName: string;
  doctorName: string;
  dateTime: string;
}

interface Reminder2hData {
  patientName: string;
  time: string;
}

const SIGNATURE = "— Alliance Dental Clinic";

export const WA_MESSAGES = {
  bookingConfirmation: (data: BookingConfirmationData): string =>
    `Salam, ${data.patientName}! 👋

✅ Görüşünüz uğurla qeydə alındı.

📋 *Xidmət:* ${data.serviceName}
👨‍⚕️ *Həkim:* ${data.doctorName}
📅 *Tarix və saat:* ${data.dateTime}

Görüşü təsdiqləmək üçün aşağıdakı düyməni basın.

${SIGNATURE}`,

  reminder24h: (data: Reminder24hData): string =>
    `Salam, ${data.patientName}! 🔔

Sabah saat *${data.dateTime}* tarixinə *${data.doctorName}* ilə görüşünüz var.

Gələ bilməyəcəksinizsə, zəhmət olmasa ləğv edin ki, bu vaxtı başqası ala bilsin.

${SIGNATURE}`,

  reminder2h: (data: Reminder2hData): string =>
    `Salam, ${data.patientName}! ⏰

Bu gün saat *${data.time}* görüşünüzə 2 saat qaldı. Sizi gözləyirik!

${SIGNATURE}`,

  cancellation: (patientName: string): string => {
    const bookUrl = `${process.env.NEXTAUTH_URL ?? ""}/book`;
    return `Salam, ${patientName}. Görüşünüz ləğv edildi. Yenidən vaxt almaq üçün: ${bookUrl}

${SIGNATURE}`;
  },

  confirmedThanks: (patientName: string): string =>
    `Çox sağ olun, ${patientName}! Görüşünüz təsdiq edildi. Sizi gözləyirik. 🦷

${SIGNATURE}`,
};

export const WA_BUTTONS = {
  confirmCancel: [
    { buttonId: "confirm", buttonText: "✅ Təsdiqlə" },
    { buttonId: "cancel", buttonText: "❌ Ləğv et" },
  ],
};
