package com.famora.calendar.lunar;

import java.time.LocalDate;

/**
 * Sexagenary names (can chi): ten heavenly stems and twelve earthly branches, cycling every 60.
 * Checked against known anchors: 1 Jan 2000 is a Mậu Ngọ day; lunar year 2026 is Bính Ngọ.
 */
public final class CanChi {

    private static final String[] CAN = {"Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"};
    private static final String[] CHI = {"Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất",
        "Hợi"};
    private static final long EPOCH_JDN = 2440588;

    private CanChi() {
    }

    public static String ofDay(LocalDate solar) {
        long jdn = solar.toEpochDay() + EPOCH_JDN;
        return CAN[(int) ((jdn + 9) % 10)] + " " + CHI[(int) ((jdn + 1) % 12)];
    }

    /** A leap month shares the name of the month it repeats. */
    public static String ofMonth(int lunarMonth, int lunarYear) {
        return CAN[(lunarYear * 12 + lunarMonth + 3) % 10] + " " + CHI[(lunarMonth + 1) % 12];
    }

    public static String ofYear(int lunarYear) {
        return CAN[(lunarYear + 6) % 10] + " " + CHI[(lunarYear + 8) % 12];
    }

    /** "tháng Giêng" ... "tháng Chạp", the names families actually use. */
    public static String monthName(int lunarMonth) {
        return switch (lunarMonth) {
            case 1 -> "tháng Giêng";
            case 11 -> "tháng Một";
            case 12 -> "tháng Chạp";
            case 4 -> "tháng Tư";
            default -> "tháng " + new String[] {"", "", "Hai", "Ba", "", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười"}
                    [lunarMonth];
        };
    }
}
