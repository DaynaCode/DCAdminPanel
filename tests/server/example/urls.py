from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.urls import include, path

# Non-i18n URLs (must NOT be inside i18n_patterns).
# The set-language view must live here so it can be reached from any language prefix.
urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    path("hijack/", include("hijack.urls")),
]

# Admin URLs wrapped with i18n_patterns so they get a language prefix (/fa/admin/, /en/admin/).
urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
)
