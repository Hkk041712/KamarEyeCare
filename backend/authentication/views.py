import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.utils import timezone
from django.db import transaction
from django.contrib.auth.hashers import check_password
from django.core.paginator import Paginator

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, Product, Sale, Patient, Expense,
    generate_product_id, generate_sale_id, generate_patient_id
)

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


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_products(request, product_id=None):
    try:
        if request.method == 'GET':
            products = Product.objects.all().order_by('-created_at')
            data = []
            for p in products:
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
                    "buy_price": f"{p.buy_price:.2f}" if p.buy_price is not None else "0.00",
                    "sell_price": f"{p.sell_price:.2f}" if p.sell_price is not None else "0.00",
                    "created_at": created_str,
                })

            page = request.query_params.get('page')
            if page:
                paginator = Paginator(data, 20)
                paginated_data = paginator.get_page(page)
                return Response({
                    "count": paginator.count,
                    "total_pages": paginator.num_pages,
                    "results": list(paginated_data)
                }, status=status.HTTP_200_OK)

            return Response(data, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            custom_id = (request.data.get('id') or '').strip()
            name = request.data.get('name')
            category = request.data.get('category', 'Frames')

            if not name:
                return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

            if not custom_id:
                custom_id = generate_product_id()

            if Product.objects.filter(id__iexact=custom_id).exists():
                return Response({'error': f'Product with ID "{custom_id}" already exists.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                raw_qty = request.data.get('quantity')
                quantity = int(raw_qty) if raw_qty is not None and str(raw_qty).strip() != "" else 0

                raw_buy = str(request.data.get('buy_price', 0)).strip()
                raw_sell = str(request.data.get('sell_price', 0)).strip()

                buy_price = Decimal(raw_buy if raw_buy else '0').quantize(Decimal('0.01'))
                sell_price = Decimal(raw_sell if raw_sell else '0').quantize(Decimal('0.01'))

                if quantity < 0:
                    return Response({'error': 'Quantity cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)
                if buy_price < Decimal('0.00') or sell_price < Decimal('0.00'):
                    return Response({'error': 'Prices cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)

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


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_sales(request, sale_id=None):
    if request.method == 'GET':
        sales = Sale.objects.all().order_by('-created_at')
        data = [
            {
                "id": s.id,
                "product_id": s.product.id if s.product else None,
                "product_name": s.product_name or (s.product.name if s.product else "Deleted Product"),
                "quantity": s.quantity,
                "unit_price": f"{s.unit_price:.2f}" if s.unit_price is not None else "0.00",
                "total": f"{s.total:.2f}" if getattr(s, 'total', None) is not None else f"{(s.unit_price * s.quantity):.2f}",
                "created_at": s.created_at.strftime("%Y-%m-%d") if getattr(s, 'created_at', None) else None,
            }
            for s in sales
        ]
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        product_id = str(request.data.get('product_id', '')).strip()
        raw_date = request.data.get('created_at')

        if not product_id:
            return Response({'error': 'Product ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(request.data.get('quantity', 1))
            unit_price = Decimal(str(request.data.get('unit_price', 0)).strip() or '0')
            if quantity <= 0 or unit_price < Decimal('0.00'):
                return Response({'error': 'Quantity must be positive and price cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError, InvalidOperation):
            return Response({'error': 'Invalid format for quantity or price.'}, status=status.HTTP_400_BAD_REQUEST)

        sale_date = timezone.now().date()
        if raw_date:
            try:
                sale_date = datetime.strptime(str(raw_date).strip(), "%Y-%m-%d").date()
            except ValueError:
                return Response({'error': 'Invalid date format. Expected YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id__iexact=product_id)
        except Product.DoesNotExist:
            return Response({'error': f'Product with ID "{product_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        if product.quantity < quantity:
            return Response(
                {'error': f'Insufficient stock for product "{product.id}". Only {product.quantity} items available.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                product_to_update = Product.objects.select_for_update().get(id=product.id)

                if product_to_update.quantity < quantity:
                    return Response(
                        {'error': f'Insufficient stock. Only {product_to_update.quantity} items available.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                total_amount = (unit_price * quantity).quantize(Decimal('0.01'))

                sale = Sale.objects.create(
                    id=generate_sale_id(),
                    product=product_to_update,
                    product_name=product_to_update.name,
                    quantity=quantity,
                    unit_price=unit_price,
                    total=total_amount,
                    created_at=sale_date
                )

                product_to_update.quantity -= quantity

                if product_to_update.quantity == 0:
                    prod_name = product_to_update.name
                    product_to_update.delete()
                    msg = f'Sale recorded! Stock for {prod_name} reached 0 and item was removed from inventory.'
                else:
                    product_to_update.save()
                    msg = f'Sale recorded! Remaining stock for {product_to_update.name}: {product_to_update.quantity}'

                return Response({'message': msg, 'sale_id': sale.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Sale processing error: {str(e)}", exc_info=True)
            return Response({'error': f'Failed to process sale: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        if not sale_id:
            return Response({'error': 'Sale ID is required for deletion.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sale = Sale.objects.get(id=sale_id)
            sale.delete()
            return Response({'message': f'Sale {sale_id} deleted successfully.'}, status=status.HTTP_200_OK)
        except Sale.DoesNotExist:
            return Response({'error': 'Sale record not found.'}, status=status.HTTP_404_NOT_FOUND)


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
                "power_right_sphere": p.power_right_sphere or "",
                "power_right_cylinder": p.power_right_cylinder or "",
                "power_right_addition": p.power_right_addition or "",
                "power_left_sphere": p.power_left_sphere or "",
                "power_left_cylinder": p.power_left_cylinder or "",
                "power_left_addition": p.power_left_addition or "",
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
            frame_chosen=request.data.get('frame_chosen', '').strip() or None,
            lens_chosen=request.data.get('lens_chosen', '').strip() or None,
            others_chosen=request.data.get('others_chosen', '').strip() or None,
            notes=request.data.get('notes', '').strip() or None,
            power_right_sphere=request.data.get('power_right_sphere', '').strip() or None,
            power_right_cylinder=request.data.get('power_right_cylinder', '').strip() or None,
            power_right_addition=request.data.get('power_right_addition', '').strip() or None,
            power_left_sphere=request.data.get('power_left_sphere', '').strip() or None,
            power_left_cylinder=request.data.get('power_left_cylinder', '').strip() or None,
            power_left_addition=request.data.get('power_left_addition', '').strip() or None,
            power_notes=request.data.get('power_notes', '').strip() or None
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
    try:
        if request.method == 'GET':
            expenses = Expense.objects.all().order_by('-created_at')
            data = [
                {
                    "id": exp.id,
                    "description": exp.description,
                    "amount": f"{exp.amount:.2f}" if exp.amount is not None else "0.00",
                    "created_at": exp.created_at.isoformat() if exp.created_at else None,
                    "created_by": exp.created_by or "Admin",
                }
                for exp in expenses
            ]
            return Response(data, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            description = (request.data.get('description') or '').strip()
            raw_amount = request.data.get('amount')
            created_by = (request.data.get('created_by') or 'Admin').strip()

            if not description or raw_amount is None:
                return Response({'error': 'Description and amount are required.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                amount = Decimal(str(raw_amount).strip()).quantize(Decimal('0.01'))
                if amount < Decimal('0.00'):
                    return Response({'error': 'Amount cannot be negative.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError, InvalidOperation):
                return Response({'error': 'Invalid amount format.'}, status=status.HTTP_400_BAD_REQUEST)

            expense = Expense.objects.create(
                description=description,
                amount=amount,
                created_by=created_by
            )
            return Response(
                {"message": "Expense recorded successfully!", "id": expense.id},
                status=status.HTTP_201_CREATED
            )

    except Exception as e:
        logger.error(f"manage_expenses error: {str(e)}", exc_info=True)
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_expense(request, expense_id):
    try:
        expense = Expense.objects.get(id=expense_id)
        expense.delete()
        return Response({"message": "Expense record deleted successfully!"}, status=status.HTTP_200_OK)
    except Expense.DoesNotExist:
        return Response({"error": "Expense record not found."}, status=status.HTTP_404_NOT_FOUND)