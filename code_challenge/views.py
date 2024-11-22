from collections import defaultdict
import json
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from django.http import Http404, HttpResponseServerError, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from .models import Challenge, Enrollments
from .importer.build_courses import courses
from .importer.parsers import Lesson


def get_course(course_slug):
    course = courses.get(course_slug)

    if not course:
        raise Http404()

    return course


def render_markdown(code: str) -> str:
    return markdown.markdown(
        code,
        extensions=[
            "fenced_code",
            CodeHiliteExtension(noclasses=True, pygments_style="dracula"),
            "attr_list",
            "extra",
        ],
    )


def get_starter_code(lesson: Lesson):
    if lesson.language == "html":
        return json.dumps(
            {
                "html": lesson.source_file,
                "css": lesson.style_file,
                "js": lesson.script_file,
            }
        )
    return lesson.source_file


def courses_index(request):
    if request.user.is_authenticated:
        enrolled_courses = Enrollments.objects.filter(user=request.user).values_list(
            "course__id", flat=True
        )

        if enrolled_courses.count():
            course_list = [
                course for course in courses.values() if course.slug in enrolled_courses
            ]
        else:
            course_list = courses.values()
    else:
        course_list = courses.values()

    return render(
        request,
        "code_challenge/courses.html",
        context={"courses": course_list},
    )


def course_view(request, course_slug=""):
    course = get_course(course_slug)

    if request.user.is_authenticated:
        completed_lessons = Challenge.objects.filter(
            user=request.user, course_slug=course_slug, completed=True
        )

        completed_by_unit = defaultdict(list)
        for challenge in completed_lessons:
            completed_by_unit[challenge.unit_slug].append(challenge.lesson_id)

        lessons_by_unit = [
            [
                unit,
                [lesson for lesson in unit.get_lessons()],
                completed_by_unit.get(unit.slug),
            ]
            for unit in course.get_units()
        ]
    else:
        lessons_by_unit = [
            [
                unit,
                [lesson for lesson in unit.get_lessons()],
                [],  # If not authenticated, no lessons completed
            ]
            for unit in course.get_units()
        ]

    return render(
        request,
        "code_challenge/course_view.html",
        context={
            "course": course,
            "lessons_by_unit": lessons_by_unit,
        },
    )


def units_redirect(request, course_slug, unit_slug):
    return redirect("course_view", course_slug=course_slug)


def lesson(request, course_slug="", unit_slug="", lesson_slug=""):
    course = get_course(course_slug)
    lesson = course.get_lesson(unit_slug, lesson_slug)

    if not lesson:
        raise Http404()

    if request.user.is_authenticated:
        challenge, _ = Challenge.objects.get_or_create(
            user=request.user,
            course_slug=course_slug,
            unit_slug=unit_slug,
            lesson_slug=lesson_slug,
        )
    else:
        challenge = Challenge(completed=False)

    if lesson.type == "editor":
        if lesson.language == "html":
            return render_html_editor(request, lesson, challenge)
        return render_editor(request, lesson, challenge)
    if lesson.type == "repl":
        return render_terminal(request, lesson, challenge)
    if lesson.type == "playground":
        return render_playground(request, lesson, challenge)

    return HttpResponseServerError(
        b"Oops. Something went wrong. Reloading the page is unlikely to help."
    )


def render_editor(request, lesson, challenge):
    course_title = lesson.parent.parent.title

    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "language": lesson.language,
            "has_tests": lesson.tests,
            "exports": lesson.exports,
            "file_system": lesson.create_file_system(challenge.code or None),
            "starter_code": get_starter_code(lesson),
            "instructions": render_markdown(lesson.instructions_file),
            "parent": {
                "link": reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": course_title,
            },
            "next_lesson": {
                "link": reverse("lesson_view", args=lesson.next.id.split("/"))
                if lesson.next
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.next.title if lesson.next else course_title,
            },
            "previous_lesson": {
                "link": reverse("lesson_view", args=lesson.previous.id.split("/"))
                if lesson.previous
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.previous.title if lesson.previous else course_title,
            },
            "user": {"authenticated": request.user.is_authenticated},
        },
    }

    return render(request, "code_challenge/editor.html", context=context)


def render_html_editor(request, lesson, challenge):
    course_title = lesson.parent.parent.title

    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "has_tests": lesson.tests,
            "exports": lesson.exports,
            "file_system": lesson.create_file_system(challenge.code or None),
            "starter_code": get_starter_code(lesson),
            "instructions": render_markdown(lesson.instructions_file),
            "parent": {
                "link": reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": course_title,
            },
            "next_lesson": {
                "link": reverse("lesson_view", args=lesson.next.id.split("/"))
                if lesson.next
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.next.title if lesson.next else course_title,
            },
            "previous_lesson": {
                "link": reverse("lesson_view", args=lesson.previous.id.split("/"))
                if lesson.previous
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.previous.title if lesson.previous else course_title,
            },
            "user": {"authenticated": request.user.is_authenticated},
        },
    }

    return render(request, "code_challenge/html_editor.html", context=context)

def render_playground(request, lesson, challenge):
    course_title = lesson.parent.parent.title

    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "has_tests": lesson.tests,
            "exports": lesson.exports,
            "file_system": lesson.create_file_system(challenge.code or None),
            "starter_code": get_starter_code(lesson),
            "instructions": render_markdown(lesson.instructions_file),
            "parent": {
                "link": reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": course_title,
            },
            "next_lesson": {
                "link": reverse("lesson_view", args=lesson.next.id.split("/"))
                if lesson.next
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.next.title if lesson.next else course_title,
            },
            "previous_lesson": {
                "link": reverse("lesson_view", args=lesson.previous.id.split("/"))
                if lesson.previous
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.previous.title if lesson.previous else course_title,
            },
            "user": {"authenticated": request.user.is_authenticated},
        },
    }

    return render(request, "code_challenge/playground_editor.html", context=context)

def render_terminal(request, lesson, challenge):
    course_title = lesson.parent.parent.title

    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "instructions": render_markdown(lesson.instructions_file),
            "has_tests": lesson.tests,
            "parent": {
                "link": reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": course_title,
            },
            "next_lesson": {
                "link": reverse("lesson_view", args=lesson.next.id.split("/"))
                if lesson.next
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.next.title if lesson.next else course_title,
            },
            "previous_lesson": {
                "link": reverse("lesson_view", args=lesson.previous.id.split("/"))
                if lesson.previous
                else reverse("course_view", args=[lesson.parent.parent.slug]),
                "title": lesson.previous.title if lesson.previous else course_title,
            },
            "user": {"authenticated": request.user.is_authenticated},
        },
    }

    return render(request, "code_challenge/terminal.html", context=context)
