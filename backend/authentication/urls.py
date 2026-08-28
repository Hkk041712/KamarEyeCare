from django.urls import path
from . import views
urlpatterns = [
    path('send-code/', views.send_verification_code, name='send_code'),
    path('verify-user/', views.verify_and_register, name='verify_user'),
    path('login/', views.login_view, name='login'),
    path('users/', views.get_users, name='get_users'),
    path('users/<str:user_id>/', views.delete_user, name='delete_user'),
    path('products/', views.manage_products, name='products'),
    path('sales/', views.manage_sales, name='sales'),
    path('products/', views.manage_products, name='manage_products'),
    path('products/<str:product_id>/', views.manage_products, name='delete_product'),
    path('sales/', views.manage_sales, name='manage_sales'),
]