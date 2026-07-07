# Auth management

Base URL:

```text
https://science-nuke-atomic-olympic.trycloudflare.com
```

List of function:

1. Auth - SignIn
2. Auth - SignUp
3. Auth - Logout
4. Auth - RefreshToken
5. Auth - ForgotPassword
6. Auth - CheckOtp
7. Auth - ResetPassword
8. Auth - ChangePassword

## 1. Auth - SignIn

Authenticates a user account and returns authentication tokens for future requests.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/signin
```

```json
{
  "email": "candidate@example.com",
  "password": "Password123!"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| email required | String | Email address used for authentication |
| password required | String | Password of the account |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether login is successful |
| message | String | Backend response message |
| token | String | Access token used in future requests. Backend may also return this as `access_token`, `accessToken`, or `jwt` |
| refresh_token | String | Refresh token used to request a new access token. Backend may also return this as `refreshToken` |
| user_info | Object | User profile information returned by backend |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "user_info": {
    "email": "candidate@example.com",
    "full_name": "Candidate User",
    "user_role": "candidate"
  }
}
```

## 2. Auth - SignUp

Creates a new user account.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/signup
```

```json
{
  "email": "candidate@example.com",
  "password": "Password123!",
  "full_name": "Candidate User",
  "phone": "0901234567"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| email required | String | Email address of the new account |
| password required | String | Password of the new account |
| full_name required | String | Full name of the user |
| phone required | String | Phone number of the user |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether registration is successful |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "Register successfully"
}
```

## 3. Auth - Logout

Logs out the current user and invalidates the refresh token if provided.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/logout
```

```json
{
  "refresh_token": "eyJhbGciOi..."
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |
| Authorization optional | string | Bearer access token. Default value: `Bearer <access_token>` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| refresh_token optional | String | Refresh token to invalidate |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether logout is successful |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "Logout successful"
}
```

## 4. Auth - RefreshToken

Creates a new access token by using the current refresh token.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/refresh-token
```

```json
{
  "refresh_token": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| refresh_token required | String | Refresh token used to generate a new access token |
| refreshToken optional | String | Same refresh token in camelCase format for backend compatibility |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| token | String | New access token. Backend may also return this as `access_token`, `accessToken`, or `jwt` |
| refresh_token | String | New refresh token if the backend rotates refresh tokens |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi..."
}
```

## 5. Auth - ForgotPassword

Sends a reset password OTP code to the user's email address.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/forgot-password
```

```json
{
  "email": "candidate@example.com"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| email required | String | Email address that will receive the OTP code |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether the OTP email is sent successfully |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

## 6. Auth - CheckOtp

Verifies the OTP code sent to the user's email address.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/check-otp
```

```json
{
  "email": "candidate@example.com",
  "otp": "123456"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| email required | String | Email address used to request OTP |
| otp required | String | OTP code sent to the user's email |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether OTP verification is successful |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

## 7. Auth - ResetPassword

Resets the user's password after OTP verification.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/reset-password
```

```json
{
  "email": "candidate@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| email required | String | Email address of the account |
| otp required | String | Verified OTP code |
| newPassword required | String | New password of the account |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether password reset is successful |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 8. Auth - ChangePassword

Changes the password of the currently authenticated user.

POST:

```text
https://science-nuke-atomic-olympic.trycloudflare.com/api/auth/change-password
```

```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!"
}
```

### Header

| Field | Type | Description |
| --- | --- | --- |
| Content-Type required | string | Sets the format of payload you are sending. Default value: `application/json` |
| Authorization required | string | Bearer access token. Default value: `Bearer <access_token>` |

### Request body

| Field | Type | Description |
| --- | --- | --- |
| oldPassword required | String | Current password of the account |
| newPassword required | String | New password of the account |

### Success 200

| Field | Type | Description |
| --- | --- | --- |
| success | Boolean | Indicates whether password change is successful |
| message | String | Backend response message |

Response:

```http
HTTP/1.1 200 OK
```

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Common error response

The frontend extracts error messages from `message`, `error`, `code`, or `data.message`.

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "success": false,
  "message": "Invalid request"
}
```

Common status codes:

| Status | Description |
| --- | --- |
| 400 | Invalid request body or validation error |
| 401 | Unauthorized or expired access token |
| 404 | Account not found |
| 500 | Server error |
