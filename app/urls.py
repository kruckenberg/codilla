from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("challenge/", include("code_challenge.urls")),
    path("admin/", admin.site.urls),
]
