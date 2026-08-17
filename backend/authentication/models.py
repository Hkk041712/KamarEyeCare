from django.db import models

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'  # Forces exact table name 'users'

    def __str__(self):
        return self.username