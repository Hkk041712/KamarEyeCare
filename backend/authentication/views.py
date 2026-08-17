import random
import hashlib
import re
from datetime import date
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User

ALLOWED_DOMAINS = ('@gmail', '@outlook', '@hotmail')

def validate_password_strength(password):
    """Checks if password meets security criteria."""
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r'[0-9]', password):
        return "Password must contain at least one number (0-9)."
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>/?|\\]', password):
        return "Password must contain at least one special character (!@#$%^&* etc.)."
    return None

def generate_custom_id(username):
    prefix = username[:3].upper().ljust(3, 'X')
    while True:
        random_num = str(random.randint(1000, 9999))
        custom_id = f"{prefix}{random_num}"
        if not User.objects.filter(id=custom_id).exists():
            return custom_id

@api_view(['POST'])
def signup_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Validate Email Domain
    username_lower = username.lower()
    if not any(domain in username_lower for domain in ALLOWED_DOMAINS):
        return Response({
            'error': 'Username must contain @gmail, @outlook, or @hotmail'
        }, status=status.HTTP_400_BAD_REQUEST)

    # 2. Validate Password Strength
    password_error = validate_password_strength(password)
    if password_error:
        return Response({'error': password_error}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Check if username exists
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    # 4. Hash password using SHA-256
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    # 5. Save User
    user_id = generate_custom_id(username)
    user = User.objects.create(
        id=user_id,
        username=username,
        password_hash=password_hash,
        created_at=date.today()
    )

    return Response({
        'message': f'Account created successfully! Your ID is {user.id}',
        'user_id': user.id
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    try:
        user = User.objects.get(username=username)
        if user.password_hash == password_hash:
            return Response({'message': f'Welcome back, {user.username}! Login successful.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_400_BAD_REQUEST)