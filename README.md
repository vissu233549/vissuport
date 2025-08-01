# Invoice Builder (Static)

This repository contains a simple client-side React application that allows authenticated users to create and save invoices using Firebase services.

## Features
- Google OAuth sign-in (Firebase Auth)
- Invoice creation with dynamic items
- Upload company logo and draw signature
- Calculate subtotal, tax, and total
- Save invoices to Firestore and files to Storage
- View past invoices

## Usage
1. Provide your Firebase configuration in `public/app.js`.
2. Serve the `public` directory using any static server.
3. Open the app in a browser and sign in with Google to create invoices.

> **Note:** This static version uses CDN scripts for React, Tailwind, Firebase and SignaturePad. PDF generation, email sending, analytics and other advanced features are not included.
