from rest_framework import serializers
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'created_at', 'created_by']
        extra_kwargs = {
            'amount': {'min_value': 0.01}
        }