-- Supabase Auth owns auth.users. public.users remains the application profile table.
-- The trigger is installed only on Supabase; local PostgreSQL continues to work without an auth schema.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = ''
      AS $body$
      BEGIN
        INSERT INTO public.users(id,name,email)
        VALUES(
          NEW.id,
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''),NULLIF(NEW.raw_user_meta_data->>'name',''),split_part(NEW.email,'@',1),'Estudante'),
          NEW.email
        )
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email;
        RETURN NEW;
      END;
      $body$
    $function$;
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE OF email,raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user()';
  END IF;
END $$;

-- The browser talks to Supabase only for Auth. Application data is exposed through the authenticated Spring API.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
  END IF;
END $$;
