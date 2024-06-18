from django.shortcuts import render


def index(request):
    return render(request, "code_challenge/base.html")
