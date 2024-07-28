from django.conf import settings
from django.db import models
from django.utils import timezone


class Challenge(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenges"
    )
    course_slug = models.CharField(max_length=250)
    unit_slug = models.CharField(max_length=250)
    lesson_slug = models.CharField(max_length=250)
    code = models.TextField(null=True, blank=True)
    completed = models.BooleanField(default=False)  # type: ignore
    last_attempt = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "challenges"

        indexes = [
            models.Index(fields=["user"], name="idx_user"),
            models.Index(fields=["user", "course_slug"], name="idx_user_course"),
            models.Index(
                fields=["user", "course_slug", "unit_slug"], name="idx_user_unit"
            ),
            models.Index(
                fields=["user", "course_slug", "unit_slug", "lesson_slug"],
                name="idx_user_challenge",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course_slug", "unit_slug", "lesson_slug"],
                name="unique_user_challenge",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.course_slug}/{self.unit_slug}/{self.lesson_slug}"

    @property
    def lesson_id(self):
        return f"{self.course_slug}/{self.unit_slug}/{self.lesson_slug}"
