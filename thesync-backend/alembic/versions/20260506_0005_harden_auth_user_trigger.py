"""Harden auth user trigger against orphan pending user rows.

Revision ID: 202605060005
Revises: 202605060004
Create Date: 2026-05-06 14:20:00

"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060005"
down_revision = "202605060004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DELETE FROM public.users AS u
        WHERE u.registration_completed = false
          AND NOT EXISTS (
            SELECT 1
            FROM auth.users AS au
            WHERE au.id = u.id
          );
        """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          DELETE FROM public.users AS existing_user
          WHERE existing_user.email = NEW.email
            AND existing_user.id <> NEW.id
            AND existing_user.registration_completed = false
            AND NOT EXISTS (
              SELECT 1
              FROM auth.users AS auth_user
              WHERE auth_user.id = existing_user.id
            );

          INSERT INTO public.users (
            id,
            role_id,
            full_name,
            email,
            avatar_url,
            registration_completed
          )
          VALUES (
            NEW.id,
            1,
            COALESCE(
              NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
              NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
              NEW.email
            ),
            NEW.email,
            NULLIF(
              trim(
                COALESCE(
                  NEW.raw_user_meta_data ->> 'avatar_url',
                  NEW.raw_user_meta_data ->> 'picture'
                )
              ),
              ''
            ),
            false
          )
          ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

          RETURN NEW;
        END;
        $$;
        """)


def downgrade() -> None:
    op.execute("""
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
        """)
