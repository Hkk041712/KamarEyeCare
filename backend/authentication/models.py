from django.db import models

class User(models.Model):
    id = models.CharField(max_length=20, primary_key=True)  # Custom ID (e.g., HAS1234)
    username = models.CharField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=64)  # SHA-256 output is 64 hex chars
    created_at = models.DateField(auto_now_add=True)  # Current date only

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.id} - {self.username}"