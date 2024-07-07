from django.conf import settings


class NoCache:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        """
        set the "Cache-Control" header to "must-revalidate, no-cache"
        """
        response = self.get_response(request)

        if settings.DEBUG and request.path.startswith("/static/"):
            response["Cache-Control"] = "no-cache"

        return response
