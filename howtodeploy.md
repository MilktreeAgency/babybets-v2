# BabyBets Deployment Guide

## Frontend Environment Variables (Vercel)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_G2PAY_MERCHANT_ID=
VITE_GOOGLE_MERCHANT_ID=
VITE_GOOGLE_PAY_MERCHANT_NAME=
VITE_GOOGLE_PAY_GATEWAY=
VITE_GOOGLE_PAY_GATEWAY_MERCHANT_ID=
```

## Backend Environment Variables (Supabase)

```
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
SMTP_FROM=
G2PAY_MERCHANT_ID=
G2PAY_SIGNATURE_KEY=
G2PAY_GATEWAY_URL=
G2PAY_HOSTED_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APPLE_PAY_DISPLAY_NAME=
APPLE_PAY_DOMAIN_NAME=
PUBLIC_SITE_URL=
SITE_URL=
```

## Github Environment Variables (Github)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## How to Setup

Step 1 :- bun install
Step 2 :- supabase login
Step 3 :- supabase link --project-ref your-project-ref
Step 4 :- supabase db push
Step 5 :- chmod +x deploy-secrets.sh deploy-functions.sh
Step 6 :- Replace Apple Pay file from G2Pay (public/.well-known/apple-developer-merchantid-domain-association)
Step 7 :- ./deploy-secrets.sh
Step 8 :- ./deploy-functions.sh
Step 9 :- Deploy to Vercel (add Frontend Environment Variables)
Step 10 :- Set Github Environment Variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

