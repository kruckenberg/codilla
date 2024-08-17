from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.contrib.staticfiles.views import serve
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.contrib.auth import logout


def custom_logout_view(request):
    logout(request)

    next_url = request.META.get("HTTP_REFERER", "/")

    return redirect(next_url)


def custom_serve(request, path, insecure=False, **kwargs):
    """
    Add cross-origin headers when serving static files in dev.
    """
    response = serve(request, path, insecure=True)
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    return response


urlpatterns = [
    path("admin/", admin.site.urls),
    path("account/", include("account.urls")),
    path("codilla/", include("code_challenge.urls")),
    path("", include("nrp.urls")),
    *static(settings.STATIC_URL, view=custom_serve),
    path("logout/", custom_logout_view, name="logout"),
]
