from .base import *

DEBUG = False

ADMINS = [("nkruc", "nkruckenberg@gmail.com")]

ALLOWED_HOSTS = ["codilla.northridge.dev", "localhost"]

CSRF_COOKIE_DOMAIN = "codilla.northridge.dev"
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = ["codilla.northridge.dev"]
SESSION_COOKIE_SECURE = True
