from .base import *

DEBUG = False

ADMINS = [("nkruc", "nkruckenberg@gmail.com")]

ALLOWED_HOSTS = [
    "northridge.dev",
    "www.northridge.dev",
    "localhost",
]

CSRF_COOKIE_DOMAIN = "northridge.dev"
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = ["northridge.dev"]
SESSION_COOKIE_SECURE = True
