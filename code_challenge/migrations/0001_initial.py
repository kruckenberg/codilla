# Generated by Django 5.0.6 on 2024-07-26 21:57

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Challenge',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('course_slug', models.CharField(max_length=250)),
                ('unit_slug', models.CharField(max_length=250)),
                ('lesson_slug', models.CharField(max_length=250)),
                ('code', models.TextField()),
                ('completed', models.BooleanField(default=False)),
                ('last_attempt', models.DateTimeField(default=django.utils.timezone.now)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='challenges', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'challenges',
                'indexes': [models.Index(fields=['user'], name='idx_user'), models.Index(fields=['user', 'course_slug'], name='idx_user_course'), models.Index(fields=['user', 'course_slug', 'unit_slug'], name='idx_user_unit'), models.Index(fields=['user', 'course_slug', 'unit_slug', 'lesson_slug'], name='idx_user_challenge')],
            },
        ),
        migrations.AddConstraint(
            model_name='challenge',
            constraint=models.UniqueConstraint(fields=('user', 'course_slug', 'unit_slug', 'lesson_slug'), name='unique_user_challenge'),
        ),
    ]
