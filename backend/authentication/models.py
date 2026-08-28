from django.db import models

class User(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=64)
    created_at = models.DateField(auto_now_add=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    code_created_at = models.DateTimeField(blank=True, null=True)
    codes_sent_today = models.IntegerField(default=0)
    last_code_sent_date = models.DateField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)

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
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'sales'

    def __str__(self):
        return f"{self.id} - {self.product.name}"