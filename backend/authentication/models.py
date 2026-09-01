import uuid
import secrets
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator

def default_secret():
    return secrets.token_hex(32)

def generate_product_id():
    return f"PRD{uuid.uuid4().hex[:8].upper()}"

def generate_sale_id():
    return f"SLS{uuid.uuid4().hex[:8].upper()}"

def generate_patient_id():
    return f"PAT{uuid.uuid4().hex[:8].upper()}"

class User(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    username = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    reset_otp = models.CharField(max_length=128, null=True, blank=True)
    reset_otp_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.id} - {self.username}"


class Product(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=generate_product_id)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    buy_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    sell_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return f"{self.id} - {self.name}"


class Sale(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=generate_sale_id)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255, blank=True, null=True)  # <-- Added field
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateField(default=timezone.now)

    class Meta:
        db_table = 'sales'

    def __str__(self):
        name = self.product_name or (self.product.name if self.product else "Unknown Product")
        return f"{self.id} - {name}"


class Patient(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=generate_patient_id)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    prescription_details = models.TextField(blank=True, null=True)
    
    frame_chosen = models.CharField(max_length=255, blank=True, null=True)
    lens_chosen = models.CharField(max_length=255, blank=True, null=True)
    others_chosen = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    power_right_sphere = models.CharField(max_length=50, blank=True, null=True)
    power_right_cylinder = models.CharField(max_length=50, blank=True, null=True)
    power_right_addition = models.CharField(max_length=50, blank=True, null=True)

    power_left_sphere = models.CharField(max_length=50, blank=True, null=True)
    power_left_cylinder = models.CharField(max_length=50, blank=True, null=True)
    power_left_addition = models.CharField(max_length=50, blank=True, null=True)
    power_notes = models.TextField(blank=True, null=True)

    created_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'patients'


class Expense(models.Model):
    id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=150, default='Admin')

    class Meta:
        db_table = 'expenses'  
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.description} - ${self.amount}"