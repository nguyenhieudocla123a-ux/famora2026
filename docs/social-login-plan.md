# Đăng nhập bằng Google và Facebook — đề xuất (chưa làm)

Trạng thái: **đề xuất, chờ duyệt**. Dự kiến làm thành Phase 7e (sau khi 7b–7d xong), vì cần bạn tạo ứng dụng
trên Google Cloud và Meta for Developers trước.

## 1. Cách hoạt động

```
App (Google/Facebook SDK)          Backend Famora                       Google / Facebook
  bấm "Tiếp tục với Google"
  -> SDK trả ID token (Google)
     hoặc access token (Facebook)
  POST /api/auth/google {idToken} ->  kiểm tra token với nhà cung cấp  -> chữ ký, aud, hạn, email_verified
  POST /api/auth/facebook {token} ->  (Facebook: /debug_token + /me)
                                      tìm/tạo tài khoản Famora
                                   <- trả cặp token Famora như đăng nhập thường
```

- App **không bao giờ** thấy mật khẩu Google/Facebook; backend **không tin** email do app gửi lên, chỉ tin
  thông tin đọc từ token đã kiểm chữ ký.
- Sau bước này mọi thứ giống đăng nhập thường: access 15 phút + refresh 14 ngày, cùng cơ chế xoay vòng.

## 2. Thay đổi dự kiến

**Backend**
- Flyway V7: bảng `user_identities (provider, provider_user_id UNIQUE, user_id, email, created_at)`;
  `users.password_hash` cho phép NULL (tài khoản chỉ đăng nhập bằng Google/Facebook).
- `POST /api/auth/google`: kiểm ID token bằng khóa công khai của Google (JWKS), `aud` = Web client ID,
  `iss` = accounts.google.com, `email_verified = true`.
- `POST /api/auth/facebook`: gọi `graph.facebook.com/debug_token` bằng app token (App ID | App Secret, chỉ ở
  backend), kiểm `is_valid` và `app_id`; rồi lấy `id, name, email` từ `/me`.
- Test với nhà cung cấp giả (không gọi Google/Facebook thật trong test).

**Mobile**
- `@react-native-google-signin/google-signin`, `react-native-fbsdk-next` (module native: phải build lại app).
- Nút "Tiếp tục với Google" / "Tiếp tục với Facebook" trên màn Đăng nhập và Đăng ký.

## 3. Bạn cần chuẩn bị

1. **Đổi package Android trước khi đăng ký** (khuyến nghị): app đang là `com.familyhub`. Google và Facebook gắn
   cấu hình với package name; đổi sau thì phải làm lại. Đề xuất `com.famora.app`.
2. **Google Cloud Console**: tạo project → OAuth consent screen → tạo 2 OAuth client:
   - loại *Web application*: lấy **Web client ID** (backend dùng làm `aud`, app dùng làm `webClientId`);
   - loại *Android*: package name + **SHA-1** của keystore debug:
     `keytool -list -v -keystore mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`
3. **Meta for Developers**: tạo app (Consumer) → thêm *Facebook Login* cho Android: package name, class
   `MainActivity`, **key hash** của keystore debug. Lấy **App ID**, **Client Token** (app dùng) và **App Secret**
   (chỉ để trong `.env` của backend, không bao giờ đưa vào app hay git).
4. Thêm vào `.env`: `GOOGLE_WEB_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`.

## 4. Quyết định cần chốt

| Câu hỏi | Đề xuất |
|---|---|
| Email Google trùng tài khoản đã có | Tự gộp nếu Google xác nhận email (`email_verified`) |
| Email Facebook trùng tài khoản đã có | **Không tự gộp**: yêu cầu đăng nhập bằng mật khẩu một lần để liên kết (409 `ACCOUNT_LINK_REQUIRED`), vì Facebook không luôn xác minh email |
| Facebook không trả email | Vẫn tạo tài khoản theo Facebook id; app hỏi thêm email sau |
| Tài khoản chỉ có Google/Facebook muốn đăng nhập bằng mật khẩu | Thêm "Đặt mật khẩu" trong Cá nhân (sau) |
| iOS | Làm sau, khi có máy Mac / tài khoản Apple Developer (Apple yêu cầu kèm "Sign in with Apple") |
