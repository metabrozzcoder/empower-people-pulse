ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

WITH numbered_profiles AS (
  SELECT
    id,
    lower(
      regexp_replace(
        coalesce(nullif(username, ''), nullif(split_part(email, '@', 1), ''), 'user' || substr(id::text, 1, 8)),
        '[^a-z0-9._-]',
        '',
        'g'
      )
    ) AS base_username,
    row_number() OVER (
      PARTITION BY lower(
        regexp_replace(
          coalesce(nullif(username, ''), nullif(split_part(email, '@', 1), ''), 'user' || substr(id::text, 1, 8)),
          '[^a-z0-9._-]',
          '',
          'g'
        )
      )
      ORDER BY created_at, id
    ) AS duplicate_number
  FROM public.profiles
  WHERE username IS NULL OR username = ''
)
UPDATE public.profiles p
SET username = CASE
  WHEN np.duplicate_number = 1 THEN np.base_username
  ELSE np.base_username || '-' || np.duplicate_number::text
END
FROM numbered_profiles np
WHERE p.id = np.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON public.profiles (lower(username))
WHERE username IS NOT NULL;
