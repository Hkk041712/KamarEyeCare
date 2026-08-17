from django.urls import path, include

urlpatterns = [
    # path('admin/', admin.site.urls),  # Removed because admin app is disabled
    path('api/auth/', include('authentication.urls')),
]