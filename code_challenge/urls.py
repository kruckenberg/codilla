from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="course_index"),
    path("<slug:course>", views.index, name="unit_index"),
    path("<slug:course>/<slug:unit>", views.index, name="lesson_index"),
    path("<slug:course>/<slug:unit>/<slug:lesson>", views.lesson, name="lesson_view"),
]
