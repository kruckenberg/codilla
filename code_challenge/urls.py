from django.urls import path

from . import views

urlpatterns = [
    path("terminal", views.terminal, name="terminal"),
    path("", views.index, name="index"),
]
