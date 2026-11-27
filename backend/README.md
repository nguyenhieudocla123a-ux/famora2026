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

## API hiện có (Phase 3)

| Method | URL | Cần token | Ghi chú |
|---|---|---|---|
| POST | `/api/auth/register` | Không | 201; email trùng → 409 `EMAIL_TAKEN` |
| POST | `/api/auth/login` | Không | Trả `accessToken` (15 phút); sai → 401 `INVALID_CREDENTIALS` |
| GET | `/api/users/me` | Có | Hồ sơ của mình |
| GET | `/actuator/health` | Không | Kiểm tra app còn sống |

Mọi lỗi trả về dạng RFC 7807 `ProblemDetail` kèm `code` và `timestamp`.
