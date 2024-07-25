from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="course_index"),
    path("<slug:course_slug>", views.index, name="unit_index"),
    path("<slug:course_slug>/<slug:unit_slug>", views.index, name="lesson_index"),
    path(
        "<slug:course_slug>/<slug:unit_slug>/<slug:lesson_slug>",
        views.lesson,
        name="lesson_view",
    ),
]
