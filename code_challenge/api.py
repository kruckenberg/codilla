import json
from django.http import JsonResponse
from .models import Challenge


def split_lesson_id(request):
    lesson_id = json.loads(request.body)["lesson_id"]
    return lesson_id.split("/")


def mark_complete(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "OK"})

    try:
        course_slug, unit_slug, lesson_slug = split_lesson_id(request)
        code = json.loads(request.body).get("code")
        Challenge.objects.update_or_create(
            user=request.user,
            course_slug=course_slug,
            unit_slug=unit_slug,
            lesson_slug=lesson_slug,
            defaults={"completed": True, "code": code},
        )

    except json.JSONDecodeError:
        return JsonResponse({"message": "Error"}, status=500)

    return JsonResponse({"message": "OK"})


def save_code(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "OK"})

    try:
        course_slug, unit_slug, lesson_slug = split_lesson_id(request)
        code = json.loads(request.body).get("code")
        Challenge.objects.update_or_create(
            user=request.user,
            course_slug=course_slug,
            unit_slug=unit_slug,
            lesson_slug=lesson_slug,
            defaults={"code": code},
        )

    except json.JSONDecodeError:
        return JsonResponse({"message": "Error"}, status=500)

    return JsonResponse({"message": "OK"})


def reset_code(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "OK"})

    try:
        course_slug, unit_slug, lesson_slug = split_lesson_id(request)
        Challenge.objects.update_or_create(
            user=request.user,
            course_slug=course_slug,
            unit_slug=unit_slug,
            lesson_slug=lesson_slug,
            defaults={"code": None, "completed": False},
        )

    except json.JSONDecodeError:
        print("error: ", request.body)

    return JsonResponse({"message": "OK"})
