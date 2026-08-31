import random
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal, InvalidOperation


from .models import User, Product, Sale, Patient, Expense
from .serializers import ExpenseSerializer

logger = logging.getLogger(__name__)

class AuthRateThrottle(AnonRateThrottle):
    rate = '5/min'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    try:
        username = (request.data.get('username') or request.data.get('email') or '').strip().lower()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({'error': 'Credentials required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username=username).first()
        if not user or not check_password(password, user.password_hash):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({'error': "An internal error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def request_password_reset_otp(request):
    username = (request.data.get('username') or '').strip().lower()
    if not username:
        return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'message': 'If the account exists, an OTP code has been sent.'}, status=status.HTTP_200_OK)

    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = make_password(otp)
    user.reset_otp_created_at = timezone.now()
    user.save()

    try:
        send_mail(
            subject="Kamar Eye Care - Password Reset OTP",
            message=f"Your verification code is: {otp}\n\nThis code will expire in 10 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.username],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Email failure: {str(e)}")
        return Response({'error': 'Failed to send OTP email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'If the account exists, an OTP code has been sent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def confirm_password_reset(request):
    username = (request.data.get('username') or '').strip().lower()
    otp = request.data.get('otp', '').strip()
    new_password = request.data.get('new_password', '')

    if not username or not otp or not new_password:
        return Response({'error': 'All fields (email, OTP, new password) are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=username).first()
    if not user or not user.reset_otp or not check_password(otp, user.reset_otp):
        return Response({'error': 'Invalid OTP code or email.'}, status=status.HTTP_400_BAD_REQUEST)

    if user.reset_otp_created_at and (timezone.now() - user.reset_otp_created_at > timedelta(minutes=10)):
        return Response({'error': 'OTP code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    user.password_hash = make_password(new_password)
    user.reset_otp = None
    user.save()

    return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


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


def generate_patient_id():
    while True:
        patient_id = f"PAT{random.randint(1000, 9999)}"
        if not Patient.objects.filter(id=patient_id).exists():
            return patient_id


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_products(request, product_id=None):
    try:
        if request.method == 'GET':
            products = Product.objects.all().order_by('-created_at')
            data = []
            for p in products:
                # Safe date formatting
                created_str = None
                if getattr(p, 'created_at', None):
                    try:
                        created_str = p.created_at.strftime("%Y-%m-%d")
                    except AttributeError:
                        created_str = str(p.created_at)[:10]

                data.append({
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "quantity": p.quantity,
                    "buy_price": float(p.buy_price) if p.buy_price is not None else 0.0,
                    "sell_price": float(p.sell_price) if p.sell_price is not None else 0.0,
                    "created_at": created_str,
                })
            return Response(data, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            custom_id = (request.data.get('id') or '').strip()
            name = request.data.get('name')
            category = request.data.get('category', 'Frames')

            if not custom_id:
                return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

            if not name:
                return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

            if Product.objects.filter(id=custom_id).exists():
                return Response({'error': f'Product with ID "{custom_id}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                quantity = int(request.data.get('quantity', 0))
                raw_buy = str(request.data.get('buy_price', 0)).strip() or '0'
                raw_sell = str(request.data.get('sell_price', 0)).strip() or '0'

                buy_price = Decimal(raw_buy).quantize(Decimal('0.01'))
                sell_price = Decimal(raw_sell).quantize(Decimal('0.01'))
            except (ValueError, TypeError, InvalidOperation):
                return Response({'error': 'Invalid format for price or quantity.'}, status=status.HTTP_400_BAD_REQUEST)

            product = Product.objects.create(
                id=custom_id,
                name=name,
                category=category,
                quantity=quantity,
                buy_price=buy_price,
                sell_price=sell_price
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

    except Exception as e:
        logger.error(f"manage_products internal error: {str(e)}", exc_info=True)
        return Response({'error': f'Server error processing products: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_sales(request):
    if request.method == 'GET':
        sales = Sale.objects.all().order_by('-created_at')
        data = [
            {
                "id": s.id,
                "product_id": s.product.id if s.product else None,
                "product_name": s.product.name if s.product else "Deleted Product",
                "quantity": s.quantity,
                "unit_price": float(s.unit_price),
                "total": float(s.total) if hasattr(s, 'total') else float(s.unit_price * s.quantity),
                "created_at": s.created_at.strftime("%Y-%m-%d") if s.created_at else None,
            }
            for s in sales
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        try:
            quantity = int(request.data.get('quantity', 1))
            unit_price = Decimal(str(request.data.get('unit_price', 0)).strip() or '0')
        except (ValueError, TypeError, InvalidOperation):
            return Response({'error': 'Invalid format for quantity or price.'}, status=status.HTTP_400_BAD_REQUEST)

        if not product_id:
            return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Atomic transaction to ensure data integrity
            with transaction.atomic():
                product = Product.objects.select_for_update().get(id=product_id)

                if product.quantity < quantity:
                    return Response(
                        {'error': f'Insufficient stock. Only {product.quantity} items available.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Record the sale transaction
                sale = Sale.objects.create(
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    created_at=request.data.get('created_at')
                )

                # Deduct stock quantity
                product.quantity -= quantity

                # Check if stock has reached 0
                if product.quantity <= 0:
                    product.delete()
                    msg = 'Sale recorded successfully! Stock reached 0 and the product was automatically removed from inventory.'
                else:
                    product.save()
                    msg = f'Sale recorded! Remaining stock for {product.name}: {product.quantity}'

                return Response({'message': msg, 'sale_id': sale.id}, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND) 


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_patients(request, patient_id=None):
    if request.method == 'GET':
        patients = Patient.objects.all().order_by('-created_at')
        data = [
            {
                "id": p.id,
                "patient_id": p.id,
                "full_name": p.full_name,
                "name": p.full_name,
                "phone": p.phone or "",
                "email": p.email or "",
                "frame_chosen": p.frame_chosen or "",
                "lens_chosen": p.lens_chosen or "",
                "others_chosen": p.others_chosen or "",
                "notes": p.notes or "",
                "power_right_sphere": p.power_right_sphere or "0.00",
                "power_right_cylinder": p.power_right_cylinder or "0.00",
                "power_right_addition": p.power_right_addition or "0.00",
                "power_left_sphere": p.power_left_sphere or "0.00",
                "power_left_cylinder": p.power_left_cylinder or "0.00",
                "power_left_addition": p.power_left_addition or "0.00",
                "power_notes": p.power_notes or "",
                "created_at": p.created_at.strftime("%Y-%m-%d") if p.created_at and hasattr(p.created_at, 'strftime') else "",
            }
            for p in patients
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        full_name = (request.data.get('full_name') or request.data.get('name') or '').strip()
        
        if not full_name:
            return Response({'error': 'Full name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        patient = Patient.objects.create(
            id=request.data.get('patient_id') or generate_patient_id(),
            full_name=full_name,
            phone=request.data.get('phone', '').strip(),
            email=request.data.get('email', '').strip(),
            frame_chosen=request.data.get('frame_chosen', ''),
            lens_chosen=request.data.get('lens_chosen', ''),
            others_chosen=request.data.get('others_chosen', ''),
            notes=request.data.get('notes', ''),
            power_right_sphere=request.data.get('power_right_sphere', ''),
            power_right_cylinder=request.data.get('power_right_cylinder', ''),
            power_right_addition=request.data.get('power_right_addition', ''),
            power_left_sphere=request.data.get('power_left_sphere', ''),
            power_left_cylinder=request.data.get('power_left_cylinder', ''),
            power_left_addition=request.data.get('power_left_addition', ''),
            power_notes=request.data.get('power_notes', '')
        )
        return Response({'message': 'Patient recorded successfully!', 'id': patient.id}, status=status.HTTP_201_CREATED)

    elif request.method == 'DELETE':
        if not patient_id:
            return Response({'error': 'Patient ID is required for deletion.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            patient = Patient.objects.get(id=patient_id)
            patient.delete()
            return Response({'message': f'Patient {patient_id} deleted successfully.'}, status=status.HTTP_200_OK)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_expenses(request):
    if request.method == 'GET':
        expenses = Expense.objects.all().order_by('-created_at')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Expense recorded successfully!", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response({"error": "Invalid expense details provided."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_expense(request, expense_id):
    try:
        expense = Expense.objects.get(id=expense_id)
        expense.delete()
        return Response({"message": "Expense record deleted successfully!"}, status=status.HTTP_200_OK)
    except Expense.DoesNotExist:
        return Response({"error": "Expense record not found."}, status=status.HTTP_404_NOT_FOUND)