from django.contrib import admin
from .models import Courses, Enrollments


admin.site.register(Enrollments)


@admin.register(Courses)
class CoursesAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "repo")
    search_fields = ("id", "title")
    ordering = ("id",)
