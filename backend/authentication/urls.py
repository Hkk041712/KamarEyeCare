from django.urls import path
from . import views

urlpatterns = [
    path('send-code/', views.send_verification_code, name='send_code'),
    path('verify-user/', views.verify_and_register, name='verify_user'),
    path('login/', views.login_view, name='login'),
    path('users/', views.get_users, name='get_users'),
    path('users/<str:user_id>/', views.delete_user, name='delete_user'),
]