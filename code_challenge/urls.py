from django.urls import path

from . import views
from . import api

urlpatterns = [
    path("", views.courses_index, name="courses"),
    path("api/challenge/complete", api.mark_complete, name="mark_complete"),
    path("api/challenge/save", api.save_code, name="save_code"),
    path("api/challenge/reset", api.reset_code, name="reset_code"),
    path("<slug:course_slug>", views.course_view, name="course_view"),
    path(
        "<slug:course_slug>/<slug:unit_slug>",
        views.units_redirect,
        name="unit_redirect",
    ),
    path(
        "<slug:course_slug>/<slug:unit_slug>/<slug:lesson_slug>",
        views.lesson,
        name="lesson_view",
    ),
]
