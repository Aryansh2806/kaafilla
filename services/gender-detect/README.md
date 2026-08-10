# Gender-detection service

A tiny Flask + OpenCV service that runs the Levi–Hassner (Adience) gender model
from [smahesh29/Gender-and-Age-Detection](https://github.com/smahesh29/Gender-and-Age-Detection).
The Kaafilla app calls it during onboarding to get a **soft** gender signal — it
flags photo/declared-gender mismatches for human review, it never hard-blocks.

> ⚠️ This model is a 2015 binary (Male/Female) classifier and is **not reliable**.
> It misclassifies real people (lighting, angle, androgynous features) and has no
> correct answer for non-binary users. Treat its output as a hint for a human,
> never as ground truth. The robust alternative is document-verified gender
> (Aadhaar/DigiLocker).

## API

```
POST /detect-gender      header: X-Api-Key: <GENDER_API_KEY>
  { "image_url": "https://…/photo.jpg" }
  → { "gender": "women"|"men", "label": "Female"|"Male", "confidence": 0.87, "faces": 1 }
  → { "gender": null, "reason": "no_face" }
GET /health → { "ok": true }
```

The four model files download automatically from the source repo on first boot
(baked into the image at build time by the Dockerfile).

## Run locally

```bash
cd services/gender-detect
pip install -r requirements.txt
GENDER_API_KEY=dev-secret python app.py      # http://localhost:8080
# test:
curl -s -X POST http://localhost:8080/detect-gender \
  -H "X-Api-Key: dev-secret" -H "Content-Type: application/json" \
  -d '{"image_url":"https://<a public face photo>.jpg"}'
```

## Deploy (Docker — Render / Railway / Google Cloud Run / Fly.io)

1. Point the host at this folder (it has the `Dockerfile`).
2. Set an env var **`GENDER_API_KEY`** to a long random secret.
3. Deploy. You get a public URL, e.g. `https://kaafilla-gender.onrender.com`.
4. Put both into the app's `.env`:
   ```
   EXPO_PUBLIC_GENDER_API_URL=https://kaafilla-gender.onrender.com
   EXPO_PUBLIC_GENDER_API_KEY=<the same secret>
   ```
   then restart Metro with `npx expo start -c`.

## Production hardening (important)

`EXPO_PUBLIC_*` values are **inlined into the app bundle**, so the key above is
*not* truly secret. Before real launch, proxy this call through a Supabase Edge
Function that holds the key server-side and forwards to this service — the app
then calls the Edge Function with the user's JWT instead of calling this
service directly. Also: get explicit consent (DPDP), and never log or store the
face image.
