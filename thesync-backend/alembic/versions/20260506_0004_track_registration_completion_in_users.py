"""Track application registration completion on public.users.

Revision ID: 202605060004
Revises: 202605060003
Create Date: 2026-05-06 22:10:00

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060004"
down_revision = "202605060003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "registration_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.execute("""
        UPDATE public.users AS u
        SET registration_completed = COALESCE(
          (au.raw_user_meta_data ->> 'registration_completed')::boolean,
          false
        )
        FROM auth.users AS au
        WHERE au.id = u.id;
        """)
    op.execute("""
        UPDATE public.users
        SET registration_completed = true
        WHERE role_id = 3;
        """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.ensure_auth_user_profile()
        RETURNS public.users
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          current_user_id uuid := auth.uid();
          current_claims jsonb := auth.jwt();
          resolved_full_name text;
          resolved_email text;
          resolved_avatar_url text;
          ensured_user public.users;
        BEGIN
          IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
          END IF;

          resolved_full_name := COALESCE(
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'full_name'), ''),
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'name'), ''),
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'given_name'), ''),
            NULLIF(trim(current_claims ->> 'email'), '')
          );
          resolved_email := NULLIF(trim(current_claims ->> 'email'), '');
          resolved_avatar_url := NULLIF(
            trim(
              COALESCE(
                current_claims -> 'user_metadata' ->> 'avatar_url',
                current_claims -> 'user_metadata' ->> 'picture'
              )
            ),
            ''
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
            current_user_id,
            1,
            COALESCE(resolved_full_name, current_user_id::text),
            COALESCE(resolved_email, current_user_id::text || '@pending.local'),
            resolved_avatar_url,
            false
          )
          ON CONFLICT (id) DO UPDATE
          SET email = COALESCE(EXCLUDED.email, public.users.email),
              full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
              avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url)
          RETURNING * INTO ensured_user;

          RETURN ensured_user;
        END;
        $$;
        """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.complete_user_registration(
          p_role_id integer,
          p_full_name text,
          p_email text,
          p_avatar_url text DEFAULT NULL
        )
        RETURNS public.users
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          current_user_id uuid := auth.uid();
          normalized_full_name text := NULLIF(trim(p_full_name), '');
          normalized_email text := NULLIF(lower(trim(p_email)), '');
          normalized_avatar_url text := NULLIF(trim(p_avatar_url), '');
          completed_user public.users;
        BEGIN
          IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
          END IF;

          IF p_role_id NOT IN (1, 2) THEN
            RAISE EXCEPTION 'Only student and adviser registrations are supported';
          END IF;

          IF normalized_full_name IS NULL THEN
            RAISE EXCEPTION 'Full name is required';
          END IF;

          IF normalized_email IS NULL THEN
            RAISE EXCEPTION 'Email is required';
          END IF;

          PERFORM public.ensure_auth_user_profile();

          INSERT INTO public.users (
            id,
            role_id,
            full_name,
            email,
            avatar_url,
            registration_completed
          )
          VALUES (
            current_user_id,
            p_role_id,
            normalized_full_name,
            normalized_email,
            normalized_avatar_url,
            true
          )
          ON CONFLICT (id) DO UPDATE
          SET role_id = EXCLUDED.role_id,
              full_name = EXCLUDED.full_name,
              email = EXCLUDED.email,
              avatar_url = EXCLUDED.avatar_url,
              registration_completed = true
          RETURNING * INTO completed_user;

          RETURN completed_user;
        END;
        $$;
        """)


def downgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION public.complete_user_registration(
          p_role_id integer,
          p_full_name text,
          p_email text,
          p_avatar_url text DEFAULT NULL
        )
        RETURNS public.users
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          current_user_id uuid := auth.uid();
          normalized_full_name text := NULLIF(trim(p_full_name), '');
          normalized_email text := NULLIF(lower(trim(p_email)), '');
          normalized_avatar_url text := NULLIF(trim(p_avatar_url), '');
          completed_user public.users;
        BEGIN
          IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
          END IF;

          IF p_role_id NOT IN (1, 2) THEN
            RAISE EXCEPTION 'Only student and adviser registrations are supported';
          END IF;

          IF normalized_full_name IS NULL THEN
            RAISE EXCEPTION 'Full name is required';
          END IF;

          IF normalized_email IS NULL THEN
            RAISE EXCEPTION 'Email is required';
          END IF;

          PERFORM public.ensure_auth_user_profile();

          INSERT INTO public.users (id, role_id, full_name, email, avatar_url)
          VALUES (
            current_user_id,
            p_role_id,
            normalized_full_name,
            normalized_email,
            normalized_avatar_url
          )
          ON CONFLICT (id) DO UPDATE
          SET role_id = EXCLUDED.role_id,
              full_name = EXCLUDED.full_name,
              email = EXCLUDED.email,
              avatar_url = EXCLUDED.avatar_url
          RETURNING * INTO completed_user;

          RETURN completed_user;
        END;
        $$;
        """)

    op.execute("""
        CREATE OR REPLACE FUNCTION public.ensure_auth_user_profile()
        RETURNS public.users
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          current_user_id uuid := auth.uid();
          current_claims jsonb := auth.jwt();
          resolved_full_name text;
          resolved_email text;
          resolved_avatar_url text;
          ensured_user public.users;
        BEGIN
          IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
          END IF;

          resolved_full_name := COALESCE(
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'full_name'), ''),
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'name'), ''),
            NULLIF(trim(current_claims -> 'user_metadata' ->> 'given_name'), ''),
            NULLIF(trim(current_claims ->> 'email'), '')
          );
          resolved_email := NULLIF(trim(current_claims ->> 'email'), '');
          resolved_avatar_url := NULLIF(
            trim(
              COALESCE(
                current_claims -> 'user_metadata' ->> 'avatar_url',
                current_claims -> 'user_metadata' ->> 'picture'
              )
            ),
            ''
          );

          INSERT INTO public.users (id, role_id, full_name, email, avatar_url)
          VALUES (
            current_user_id,
            1,
            COALESCE(resolved_full_name, current_user_id::text),
            COALESCE(resolved_email, current_user_id::text || '@pending.local'),
            resolved_avatar_url
          )
          ON CONFLICT (id) DO UPDATE
          SET email = COALESCE(EXCLUDED.email, public.users.email),
              full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
              avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url)
          RETURNING * INTO ensured_user;

          RETURN ensured_user;
        END;
        $$;
        """)

    op.drop_column("users", "registration_completed")
