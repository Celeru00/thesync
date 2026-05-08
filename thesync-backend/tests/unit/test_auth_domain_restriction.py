from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from repository.auth import (
    DomainRestrictedAuthenticationError,
    _assert_allowed_email_domain,
    _has_allowed_email_domain,
    _normalize_email_domain,
)
from repository.config import get_settings


class AuthDomainRestrictionTests(unittest.TestCase):
    def tearDown(self) -> None:
        get_settings.cache_clear()

    def test_normalize_email_domain_removes_prefix_and_lowercases(self) -> None:
        self.assertEqual(_normalize_email_domain("@UP.EDU.PH"), "up.edu.ph")
        self.assertEqual(_normalize_email_domain(" up.edu.ph "), "up.edu.ph")
        self.assertIsNone(_normalize_email_domain(" "))

    def test_development_allows_any_email_when_domain_not_configured(self) -> None:
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "development",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            self.assertTrue(_has_allowed_email_domain("tester@gmail.com"))
            _assert_allowed_email_domain("tester@gmail.com")

    def test_non_development_falls_back_to_up_domain(self) -> None:
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            self.assertTrue(_has_allowed_email_domain("tester@up.edu.ph"))
            self.assertFalse(_has_allowed_email_domain("tester@gmail.com"))

            with self.assertRaises(DomainRestrictedAuthenticationError) as raised:
                _assert_allowed_email_domain("tester@gmail.com")

            self.assertIn("@up.edu.ph", str(raised.exception))

    def test_configured_domain_overrides_default(self) -> None:
        with patch.dict(
            os.environ,
            {
                "APP_ENV": "development",
                "ALLOWED_GOOGLE_EMAIL_DOMAIN": "@example.com",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            self.assertTrue(_has_allowed_email_domain("tester@example.com"))
            self.assertFalse(_has_allowed_email_domain("tester@gmail.com"))
