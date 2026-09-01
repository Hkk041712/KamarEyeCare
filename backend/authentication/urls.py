# core/urls.py
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('', lambda request: HttpResponse("OK"), name='health_check'),  
    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/request-reset-otp/', views.request_password_reset_otp, name='request_reset_otp'),
    path('api/auth/confirm-reset/', views.confirm_password_reset, name='confirm_reset'),
    path('api/products/', views.manage_products, name='manage_products'),
    path('api/products/<str:product_id>/', views.manage_products, name='delete_product'),
    path('api/sales/', views.manage_sales, name='manage_sales'),
    path('api/patients/', views.manage_patients, name='manage_patients'),
    path('api/patients/<str:patient_id>/', views.manage_patients, name='delete_patient'),
    path('api/expenses/', views.manage_expenses, name='manage_expenses'),
    path('api/expenses/<int:expense_id>/', views.delete_expense, name='delete_expense'),
]