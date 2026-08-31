import secrets
from django.db import models

def default_secret():
    return secrets.token_hex(32)

class User(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    username = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    reset_otp = models.CharField(max_length=6, null=True, blank=True)
    reset_otp_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.id} - {self.username}"


class Product(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    buy_price = models.DecimalField(max_digits=10, decimal_places=2)
    sell_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return f"{self.id} - {self.name}"


class Sale(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'sales'

    def __str__(self):
        prod_name = self.product.name if self.product else "Deleted Product"
        return f"{self.id} - {prod_name}"
    
class Patient(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    prescription_details = models.TextField(blank=True, null=True)
    
    # Add Eyewear Choices
    frame_chosen = models.CharField(max_length=255, blank=True, null=True)
    lens_chosen = models.CharField(max_length=255, blank=True, null=True)
    others_chosen = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Add Power Fields (Right Eye - OD)
    power_right_sphere = models.CharField(max_length=50, blank=True, null=True)
    power_right_cylinder = models.CharField(max_length=50, blank=True, null=True)
    power_right_addition = models.CharField(max_length=50, blank=True, null=True)

    # Add Power Fields (Left Eye - OS)
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
        db_table = 'EXPENSES'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.description} - ${self.amount}"
    