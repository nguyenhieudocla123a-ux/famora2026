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

## API hiện có (Phase 3–4a)

| Method | URL | Cần token | Ghi chú |
|---|---|---|---|
| POST | `/api/auth/register` | Không | 201; email trùng → 409 `EMAIL_TAKEN` |
| POST | `/api/auth/login` | Không | Trả `accessToken` (15 phút) + `refreshToken` (14 ngày); sai → 401 `INVALID_CREDENTIALS` |
| POST | `/api/auth/refresh` | Không | Đổi refresh token lấy cặp mới; token cũ hết dùng. Dùng lại token cũ → 401 `REFRESH_TOKEN_REUSED`, cả phiên đó bị thu hồi |
| POST | `/api/auth/logout` | Có | Body `{refreshToken}`; 204 |
| GET | `/api/users/me` | Có | Hồ sơ của mình |
| PUT | `/api/users/me` | Có | Sửa họ tên, ngày sinh |
| PUT | `/api/users/me/password` | Có | Cần mật khẩu hiện tại; xong thì mọi thiết bị phải đăng nhập lại |
| GET | `/actuator/health` | Không | Kiểm tra app còn sống |

Mọi lỗi trả về dạng RFC 7807 `ProblemDetail` kèm `code` và `timestamp`.
