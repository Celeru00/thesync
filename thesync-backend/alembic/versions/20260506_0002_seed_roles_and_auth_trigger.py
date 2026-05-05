"""Seed auth roles and auto-provision public.users from auth.users.

Revision ID: 202605060002
Revises: 202605060001
Create Date: 2026-05-06 00:30:00

"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060002"
down_revision = "202605060001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM public.roles WHERE lower(name) = 'student' AND id <> 1) THEN
            RAISE EXCEPTION 'roles.name=student must use id=1 before installing the auth trigger';
          END IF;

          IF EXISTS (SELECT 1 FROM public.roles WHERE lower(name) = 'adviser' AND id <> 2) THEN
            RAISE EXCEPTION 'roles.name=adviser must use id=2 before installing the auth trigger';
          END IF;

          IF EXISTS (SELECT 1 FROM public.roles WHERE lower(name) = 'admin' AND id <> 3) THEN
            RAISE EXCEPTION 'roles.name=admin must use id=3 before installing the auth trigger';
          END IF;

          INSERT INTO public.roles (id, name)
          VALUES
            (1, 'student'),
            (2, 'adviser'),
            (3, 'admin')
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name;
        END
        $$;
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.users (id, role_id, full_name, email, avatar_url)
          VALUES (
            NEW.id,
            1,
            COALESCE(
              NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
              NEW.email
            ),
            NEW.email,
            NULLIF(trim(NEW.raw_user_meta_data ->> 'avatar_url'), '')
          )
          ON CONFLICT (id) DO NOTHING;

          RETURN NEW;
        END;
        $$;
        """
    )

    op.execute(
        """
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;")
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_user();")
