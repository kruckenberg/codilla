from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

STATICFILES_DIRS = [BASE_DIR / "static", BASE_DIR / "common/static"]
