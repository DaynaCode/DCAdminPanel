"""
URL configuration for the example test server.

By default, admin URLs are NOT wrapped with i18n_patterns because the
existing test suite calls `/admin/` directly (e.g. `admin_client.get("/admin/")`).
Wrapping would cause a 302 redirect to `/fa/admin/` and break those tests.

Instead, we rely on LocaleMiddleware + Django's LANGUAGE_CODE setting
(defaulting to "fa" in settings.py) for language detection. The set-language
view is still available at `/i18n/setlang/` for the language switcher.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("hijack/", include("hijack.urls")),
    # Language switch endpoint — must be reachable from any URL prefix.
    path("i18n/", include("django.conf.urls.i18n")),
]
