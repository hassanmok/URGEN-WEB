# generate-doctor-request-pdf

Creates the filled **Request_General** PDF for a doctor case and saves it to `doctor-case-files` storage.

## Deploy (required once)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-doctor-request-pdf
```

The function bundle includes `request-general.pdf` and `NotoSansArabic-Regular.ttf`.

## Who can call it

- The doctor who owns the case
- Admin staff (not partner lab / not doctor login)

## Body

```json
{ "case_id": "uuid", "locale": "ar" }
```
