# OTP Authentication System – Design & Implementation

## Overview

This project implements a minimal fullstack OTP-based authentication system.
Users log in using their email or phone number, receive a one-time password (OTP), and are authenticated upon successful verification.

The solution demonstrates secure OTP handling, session management, and blocking logic, while keeping the architecture simple and readable.

---

## Architecture

### Frontend

* React + Vite
* Pages:

  * Login (enter email/phone)
  * OTP Verification
  * Welcome (post-login)
* Communicates with backend via Fetch API
* Stores token in `localStorage` and validates on reload

### Backend

* Node.js + Express
* REST API under `/auth/*`
* In-memory storage for:

  * OTP data
  * Blocked users
  * Active sessions
* No database used (simplified as allowed)

---

## OTP Flow

### Request OTP

`POST /auth/request-otp`

* Generates 6-digit OTP
* Stores OTP with:

  * Expiry: 5 minutes
  * Attempts counter
* OTP is mocked by logging in backend console

### Verify OTP

`POST /auth/verify-otp`

* Validates:

  * OTP correctness
  * Expiry
  * Block status
* After 3 failed attempts → user blocked for 10 minutes
* On success:

  * OTP deleted
  * Token generated and returned

---

## API Endpoints

* `POST /auth/request-otp`
  Generates OTP for given identifier

* `POST /auth/verify-otp`
  Validates OTP and returns token

* `GET /auth/me`
  Returns user data for valid token
