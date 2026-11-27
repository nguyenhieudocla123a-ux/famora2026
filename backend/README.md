# Famora backend

Spring Boot 4.1 · Java 17 · PostgreSQL 17 · Flyway · JWT (Spring Security resource server).

## Chạy trên máy

1. Bật Docker Desktop.
2. Ở thư mục gốc `E:\HubFamily`: copy `.env.example` thành `.env`, điền `POSTGRES_PASSWORD` và `JWT_SECRET`.
3. Bật database: `docker compose up -d` (PostgreSQL ở cổng **5434** trên máy).
4. Chạy backend trong thư mục `backend`: `mvn spring-boot:run`. API ở `http://localhost:8080`.
   Flyway tự tạo/cập nhật bảng khi khởi động.

## Test

`mvn test`: chạy trên một PostgreSQL tạm trong Docker (Testcontainers), không đụng database của bạn.

## API hiện có (Phase 3–5)

| Method | URL | Cần token | Ghi chú |
|---|---|---|---|
| POST | `/api/auth/register` | Không | 201; email trùng → 409 `EMAIL_TAKEN` |
| POST | `/api/auth/login` | Không | Trả `accessToken` (15 phút) + `refreshToken` (14 ngày); sai → 401 `INVALID_CREDENTIALS` |
| POST | `/api/auth/refresh` | Không | Đổi refresh token lấy cặp mới; token cũ hết dùng. Dùng lại token cũ → 401 `REFRESH_TOKEN_REUSED`, cả phiên đó bị thu hồi |
| POST | `/api/auth/logout` | Có | Body `{refreshToken}`; 204 |
| GET | `/api/users/me` | Có | Hồ sơ của mình |
| PUT | `/api/users/me` | Có | Sửa họ tên, ngày sinh |
| PUT | `/api/users/me/password` | Có | Cần mật khẩu hiện tại; xong thì mọi thiết bị phải đăng nhập lại |
| POST | `/api/families` | Có | Tạo gia đình; người tạo là OWNER |
| GET | `/api/families` | Có | Gia đình của tôi, kèm vai trò và số thành viên |
| GET / PUT / DELETE | `/api/families/{id}` | Thành viên / ADMIN / OWNER | DELETE = giải tán (xoá mềm) |
| GET | `/api/families/{id}/members` | Thành viên | |
| PATCH | `/api/families/{id}/members/{memberId}/role` | OWNER | Chỉ đổi giữa ADMIN và MEMBER |
| DELETE | `/api/families/{id}/members/{memberId}` | OWNER / ADMIN | ADMIN chỉ xoá được MEMBER |
| POST | `/api/families/{id}/leave` | Thành viên | OWNER phải chuyển quyền trước → 409 |
| POST | `/api/families/{id}/transfer-ownership` | OWNER | Body `{memberId}` |
| POST / GET | `/api/families/{id}/invitations` | ADMIN (mời ADMIN: OWNER) | Mã 8 ký tự, mặc định 5 lượt, 7 ngày |
| DELETE | `/api/families/{id}/invitations/{invId}` | ADMIN | Thu hồi mã |
| POST | `/api/families/join` | Có | Body `{code, nickname?}` |
| GET | `/api/calendar/convert?date=2026-11-27` | Có | Dương → âm, can chi ngày/tháng/năm, ngày lễ |
| GET | `/api/calendar/convert?lunarDay&lunarMonth&lunarYear&leap` | Có | Âm → dương; ngày âm không tồn tại → 400 `INVALID_LUNAR_DATE` |
| GET | `/api/calendar/month?year=2026&month=11` | Có | 42 ô (thứ Hai đầu tuần) kèm ngày âm và ngày lễ |
| POST | `/api/families/{id}/events` | Theo quyền | MEMBER chỉ tạo được khi gia đình cho phép |
| GET | `/api/families/{id}/events?from&to&type` | Thành viên | Trả **các lần xảy ra** trong khoảng (tối đa 400 ngày), kèm ngày âm và số năm |
| GET | `/api/families/{id}/events/upcoming?days=30` | Thành viên | Từ hôm nay (giờ Việt Nam) |
| GET / PUT / DELETE | `/api/families/{id}/events/{eventId}` | Thành viên / người tạo hoặc ADMIN | PUT cần `version`; version cũ → 409 `VERSION_CONFLICT` |
| GET / POST | `/api/families/{id}/persons` | Thành viên / ADMIN | Hồ sơ người thân; `createAnniversary: true` tự tạo giỗ âm lịch hằng năm |
| GET / PUT / DELETE | `/api/families/{id}/persons/{personId}` | Thành viên / ADMIN / ADMIN | Ngày mất dương tự đổi ra ngày âm; kèm `nextAnniversary` |
| GET | `/actuator/health` | Không | Kiểm tra app còn sống |

Người không phải thành viên luôn nhận **404** (không lộ gia đình có tồn tại); thành viên thiếu quyền nhận **403**.

Mọi lỗi trả về dạng RFC 7807 `ProblemDetail` kèm `code` và `timestamp`.

## Âm lịch

`com.famora.calendar.lunar` là Java thuần (không Spring): thuật toán thiên văn của Hồ Ngọc Đức tính theo
**UTC+7**, hỗ trợ 1900–2100. Kiểm chứng bằng: Tết các năm đã công bố (gồm 1968, 1985, 2007, những năm
Việt Nam khác Trung Quốc), các năm nhuận, và vòng dương → âm → dương cho từng ngày 1900–2100.

## Sự kiện lặp lại

Chỉ lưu **quy tắc** (`NONE` / `YEARLY`, âm hoặc dương), không lưu từng lần. `OccurrenceCalculator` (Java thuần)
mở rộng trong bộ nhớ: 29/02 → 28/02 năm thường; ngày 30 âm của tháng thiếu → ngày 29; gốc tháng nhuận →
các năm sau dùng tháng thường; tháng 11–12 âm có thể rơi sang năm dương sau.
