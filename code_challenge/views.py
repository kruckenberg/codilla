from django.http import Http404, HttpResponseServerError
from django.shortcuts import render
import markdown
from .importer.build_courses import courses


def get_course(course_slug):
    course = courses.get(course_slug)

    if not course:
        raise Http404()

    return course


def courses_index(request):
    return render(
        request,
        "code_challenge/courses.html",
        context={"courses": list(courses.values())},
    )


def units_index(request, course_slug=""):
    course = get_course(course_slug)
    return render(
        request,
        "code_challenge/units.html",
        context={"course": course},
    )


def lessons_index(request, course_slug="", unit_slug=""):
    course = get_course(course_slug)
    unit = course.get_unit(unit_slug)

    if not unit:
        raise Http404()

    return render(request, "code_challenge/lessons.html", context={"unit": unit})


def lesson(request, course_slug="", unit_slug="", lesson_slug=""):
    course = get_course(course_slug)
    lesson = course.get_lesson(unit_slug, lesson_slug)

    if not lesson:
        raise Http404()

    if lesson.type == "editor":
        return render_editor(request, lesson)
    if lesson.type == "repl":
        return render_terminal(request, lesson)

    return HttpResponseServerError(
        b"Oops. Something went wrong. Reloading the page is unlikely to help."
    )


def render_editor(request, lesson):
    context = {
        "challenge": {
            "title": lesson.title,
            "instructions": markdown.markdown(
                lesson.instructionsFile, extensions=["fenced_code", "codehilite"]
            ),
            "starter_code": lesson.sourceFile,
        }
    }

    return render(request, "code_challenge/editor.html", context=context)


def render_terminal(request, lesson):
    context = {
        "challenge": {
            "title": lesson.title,
            "instructions": markdown.markdown(
                lesson.instructionsFile, extensions=["fenced_code", "codehilite"]
            ),
        }
    }

    return render(request, "code_challenge/terminal.html", context=context)
