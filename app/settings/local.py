from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static", BASE_DIR / "common/static"]
