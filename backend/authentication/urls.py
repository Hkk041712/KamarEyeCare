from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('request-reset-otp/', views.request_password_reset_otp, name='request_reset_otp'),
    path('confirm-reset/', views.confirm_password_reset, name='confirm_reset'),
    
    path('products/', views.manage_products, name='manage_products'),
    path('products/<str:product_id>/', views.manage_products, name='delete_product'),
    path('sales/', views.manage_sales, name='manage_sales'),
    path('patients/', views.manage_patients, name='manage_patients'),
    path('patients/<str:patient_id>/', views.manage_patients, name='delete_patient'),
    path('expenses/', views.manage_expenses, name='manage_expenses'),
    path('expenses/<int:expense_id>/', views.delete_expense, name='delete_expense'),
]