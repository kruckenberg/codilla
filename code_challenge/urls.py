from django.urls import path

from . import views

urlpatterns = [
    path("", views.courses_index, name="courses"),
    path("<slug:course_slug>", views.units_index, name="units"),
    path("<slug:course_slug>/<slug:unit_slug>", views.lessons_index, name="lessons"),
    path(
        "<slug:course_slug>/<slug:unit_slug>/<slug:lesson_slug>",
        views.lesson,
        name="lesson_view",
    ),
]
