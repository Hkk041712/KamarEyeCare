import hashlib
import random
import re
from datetime import date, timedelta
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .models import Product, Sale
from .models import Product, Sale
import random

ALLOWED_DOMAINS = {
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com',
    'aol.com', 'proton.me', 'protonmail.com', 'mail.com', 'gmx.com',
    'zoho.com', 'yandex.com', 'live.com', 'msn.com', 'me.com', 'mac.com',
    'fastmail.com', 'tutanota.com', 'hey.com'
}

def validate_password_strength(password):
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r'[0-9]', password):
        return "Password must contain at least one number (0-9)."
    return None

def generate_custom_id(username):
    prefix = username[:3].upper().ljust(3, 'X')
    while True:
        random_num = str(random.randint(1000, 9999))
        custom_id = f"{prefix}{random_num}"
        if not User.objects.filter(id=custom_id).exists():
            return custom_id

@api_view(['POST'])
def send_verification_code(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    username_lower = username.lower()
    email_match = re.match(r'^[^@\s]+@([^@\s]+)$', username_lower)

    if not email_match or email_match.group(1) not in ALLOWED_DOMAINS:
        return Response({'error': 'Please use a valid email address from an allowed provider.'}, status=status.HTTP_400_BAD_REQUEST)

    password_error = validate_password_strength(password)
    if password_error:
        return Response({'error': password_error}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username, is_verified=True).exists():
        return Response({'error': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    today = date.today()
    user = User.objects.filter(username=username).first()

    if not user:
        custom_id = generate_custom_id(username)
        user = User(id=custom_id, username=username)

    if user.last_code_sent_date != today:
        user.codes_sent_today = 0
        user.last_code_sent_date = today

    if user.codes_sent_today >= 5:
        return Response({'error': 'Maximum limit of 5 verification codes per day reached for this email.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    code = f"{random.randint(100000, 999999)}"
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    user.password_hash = password_hash
    user.verification_code = code
    user.code_created_at = timezone.now()
    user.codes_sent_today += 1
    user.save()

    try:
        send_mail(
            subject='Kamar Eye Care - Email Verification Code',
            message=f'Your verification code is: {code}\n\nThis code will expire in 3 minutes.',
            from_email=None,
            recipient_list=[username],
            fail_silently=False,
        )
    except Exception:
        return Response({'error': 'Failed to send verification code via SMTP.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'Verification code sent to email.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def verify_and_register(request):
    username = request.data.get('username', '').strip()
    code = request.data.get('code', '').strip()

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Registration session not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Check 3-minute expiration limit
    if not user.code_created_at or timezone.now() > user.code_created_at + timedelta(minutes=3):
        return Response({'error': 'Verification code has expired (3 minutes limit). Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

    # If verification fails, stop immediately—nothing happens
    if user.verification_code != code:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Update verification status
    user.is_verified = True
    user.verification_code = None
    user.save()

    # 1. Send confirmation email to the user
    try:
        send_mail(
            subject='Welcome to Kamar Eye Care - Full Access Granted',
            message=f'Hello {user.username},\n\nYour email has been successfully verified! You now have full access to your Kamar Eye Care account.',
            from_email=None,
            recipient_list=[user.username],
            fail_silently=True,
        )
    except Exception:
        pass

    # 2. Send notification email to the admin
    admin_email = 'hasankamar2004@gmail.com'
    try:
        send_mail(
            subject='Admin Alert: New Verified User Joined',
            message=f'Admin Notification:\n\nThe user "{user.username}" (ID: {user.id}) has successfully verified their code and entered the application.',
            from_email=None,
            recipient_list=[admin_email],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({
        'message': f'User verified successfully! Full access granted. ID: {user.id}'
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_users(request):
    # Fetch all users from the database table directly
    users = User.objects.all().values('id', 'username', 'created_at', 'is_verified')
    return Response(list(users), status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user_email = user.username  # Storing email before deletion

        # Perform deletion
        user.delete()

        # 1. Send deletion notification to the user
        try:
            send_mail(
                subject='Kamar Eye Care - Account Deletion Notice',
                message=(
                    f'Hello,\n\n'
                    f'Your Kamar Eye Care account (ID: {user_id}) has been successfully deleted.\n'
                    f'If you did not request this action, please contact support immediately.'
                ),
                from_email=None,
                recipient_list=[user_email],
                fail_silently=True,
            )
        except Exception:
            pass

        # 2. Send deletion alert to the admin
        admin_email = 'hasankamar2004@gmail.com'
        try:
            send_mail(
                subject='Admin Alert: User Account Deleted',
                message=(
                    f'Admin Notification:\n\n'
                    f'The user account "{user_email}" (ID: {user_id}) has been deleted from the database.'
                ),
                from_email=None,
                recipient_list=[admin_email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({'message': f'User {user_id} deleted successfully, and notification emails were sent.'}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def login_view(request):
    # Accept either 'username' or 'email' key from the frontend payload
    username = (request.data.get('username') or request.data.get('email') or '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Email/Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()

    try:
        user = User.objects.get(username=username)
        
        # Check if the user completed email verification
        if not user.is_verified:
            return Response({'error': 'Account is not verified yet. Please verify your email first.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check password hash match
        if user.password_hash == password_hash:
            return Response({'message': f'Welcome back, {user.username}! Login successful.', 'user_id': user.id}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)
    

def generate_product_id():
    while True:
        prod_id = f"PRD{random.randint(1000, 9999)}"
        if not Product.objects.filter(id=prod_id).exists():
            return prod_id

def generate_sale_id():
    return f"SLS{random.randint(1000, 9999)}"

@api_view(['GET', 'POST'])
def manage_products(request):
    if request.method == 'GET':
        products = Product.objects.all().order_by('-created_at')
        data = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "quantity": p.quantity,
                "buy_price": float(p.buy_price),
                "sell_price": float(p.sell_price),
                "created_at": p.created_at.strftime("%Y-%m-%d"),
            }
            for p in products
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        name = request.data.get('name')
        category = request.data.get('category')
        quantity = request.data.get('quantity', 0)
        buy_price = request.data.get('buy_price', 0.0)
        sell_price = request.data.get('sell_price', 0.0)

        if not name or not category:
            return Response({'error': 'Name and Category are required.'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.create(
            id=generate_product_id(),
            name=name,
            category=category,
            quantity=int(quantity),
            buy_price=float(buy_price),
            sell_price=float(sell_price)
        )
        return Response({'message': 'Product added successfully!', 'id': product.id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
def manage_sales(request):
    if request.method == 'GET':
        sales = Sale.objects.all().order_by('-created_at')
        data = [
            {
                "id": s.id,
                "product_id": s.product.id,
                "product_name": s.product.name,
                "quantity": s.quantity,
                "unit_price": float(s.unit_price),
                "total": float(s.total),
                "created_at": s.created_at.strftime("%Y-%m-%d"),
            }
            for s in sales
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
            if product.quantity < qty:
                return Response({'error': 'Insufficient stock available.'}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = float(product.sell_price)
            total = unit_price * qty

            # Deduct stock
            product.quantity -= qty
            product.save()

            sale = Sale.objects.create(
                id=generate_sale_id(),
                product=product,
                quantity=qty,
                unit_price=unit_price,
                total=total
            )
            return Response({'message': 'Sale recorded successfully!', 'id': sale.id}, status=status.HTTP_201_CREATED)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Sale
import random

def generate_product_id():
    while True:
        prod_id = f"PRD{random.randint(1000, 9999)}"
        if not Product.objects.filter(id=prod_id).exists():
            return prod_id

def generate_sale_id():
    while True:
        sale_id = f"SLS{random.randint(1000, 9999)}"
        if not Sale.objects.filter(id=sale_id).exists():
            return sale_id

@api_view(['GET', 'POST', 'DELETE'])
def manage_products(request, product_id=None):
    if request.method == 'GET':
        products = Product.objects.all().order_by('-created_at')
        data = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "quantity": p.quantity,
                "buy_price": float(p.buy_price),
                "sell_price": float(p.sell_price),
                "created_at": p.created_at.strftime("%Y-%m-%d"),
            }
            for p in products
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        name = request.data.get('name')
        category = request.data.get('category')
        quantity = request.data.get('quantity', 0)
        buy_price = request.data.get('buy_price', 0.0)
        sell_price = request.data.get('sell_price', 0.0)

        if not name or not category:
            return Response({'error': 'Name and Category are required.'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.create(
            id=generate_product_id(),
            name=name,
            category=category,
            quantity=int(quantity),
            buy_price=float(buy_price),
            sell_price=float(sell_price)
        )
        return Response({'message': 'Product added successfully!', 'id': product.id}, status=status.HTTP_201_CREATED)

    elif request.method == 'DELETE':
        if not product_id:
            return Response({'error': 'Product ID is required for deletion.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(id=product_id)
            product.delete()
            return Response({'message': f'Product {product_id} deleted successfully.'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
def manage_sales(request):
    if request.method == 'GET':
        sales = Sale.objects.all().order_by('-created_at')
        data = [
            {
                "id": s.id,
                "product_id": s.product.id,
                "product_name": s.product.name,
                "category": s.product.category,
                "quantity": s.quantity,
                "unit_price": float(s.unit_price),
                "total": float(s.total),
                "created_at": s.created_at.strftime("%Y-%m-%d"),
            }
            for s in sales
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 1))
        custom_price = request.data.get('unit_price')
        sale_date = request.data.get('created_at')

        try:
            product = Product.objects.get(id=product_id)
            
            if product.quantity < qty:
                return Response({'error': f'Insufficient stock. Only {product.quantity} units remaining.'}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = float(custom_price) if custom_price is not None else float(product.sell_price)
            total = unit_price * qty

            # 1. Deduct stock from product
            product.quantity -= qty
            product.save()

            # 2. Record sale
            sale = Sale.objects.create(
                id=generate_sale_id(),
                product=product,
                quantity=qty,
                unit_price=unit_price,
                total=total
            )

            # Override created_at if custom date is passed
            if sale_date:
                sale.created_at = sale_date
                sale.save()

            return Response({'message': 'Income transaction recorded successfully!', 'id': sale.id}, status=status.HTTP_201_CREATED)
            
        except Product.DoesNotExist:
            return Response({'error': 'Selected product does not exist.'}, status=status.HTTP_404_NOT_FOUND)