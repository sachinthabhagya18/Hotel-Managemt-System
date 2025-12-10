import random
from rest_framework import viewsets, status, generics
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError, PermissionDenied, APIException
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
import hashlib 
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAuthenticatedOrReadOnly

 # <--- IMPORT THIS
from .models import (
    Hotel, StaffProfile, Amenity, RoomType, Room,
    Guest, Booking, Invoice, Payment,
    HousekeepingTask, InventoryItem, DiscountCoupon,PayrollEntry,FoodItem, FoodOrder,Blog,
    PasswordResetOTP,EventBooking,ContactMessage,PromoBanner
)
from .serializers import (
    HotelSerializer, StaffProfileSerializer, AmenitySerializer, RoomTypeSerializer, RoomSerializer,
    GuestSerializer, BookingSerializer, InvoiceSerializer, PaymentSerializer,
    HousekeepingTaskSerializer, InventoryItemSerializer, DiscountCouponSerializer,
    UserSerializer,PayrollEntrySerializer,FoodItemSerializer, FoodOrderSerializer,BlogSerializer,ChangePasswordSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,EventBookingSerializer,ContactMessageSerializer, PromoBannerSerializer
)

# A ViewSet automatically provides list, create, retrieve, update, delete actions

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing User instances.
    Used for assigning housekeepers.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer

    def perform_create(self, serializer):
        user = self.request.user
        try:
            admin_profile = StaffProfile.objects.get(user=user)
            serializer.save(hotel=admin_profile.hotel)
        except StaffProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Logged-in user is not associated with a hotel staff profile.')

class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer

class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer

    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Security Check
        if not (user.is_staff or user.is_superuser):
            raise PermissionDenied("You must be an admin to perform this action.")

        # 2. Determine Hotel
        hotel = None
        try:
            staff_profile = StaffProfile.objects.get(user=user)
            hotel = staff_profile.hotel
        except StaffProfile.DoesNotExist:
            if user.is_superuser:
                hotel = Hotel.objects.first()
                if not hotel:
                    # Auto-create default hotel if missing
                    hotel = Hotel.objects.create(name="Azure Coast Default", location="Main St", admin_user=user)
            else:
                raise ValidationError({"detail": "Logged-in user is not linked to any Hotel Staff Profile."})

        # 3. Safe Save (Catch Database Crashes)
        try:
            serializer.save(hotel=hotel)
        except IntegrityError as e:
            # This catches "NOT NULL constraint failed" errors and sends them as JSON
            raise ValidationError({"db_error": str(e)})
        except Exception as e:
            raise ValidationError({"server_error": str(e)})


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().select_related('room_type')
    serializer_class = RoomSerializer

class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # support filtering by email or by user id via query params
        email = self.request.query_params.get('email')
        user_id = self.request.query_params.get('user')
        if email:
            return queryset.filter(email__iexact=email)
        if user_id:
            return queryset.filter(user__id=user_id)
        return queryset

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related('guest', 'room_type', 'room').order_by('-check_in')
    serializer_class = BookingSerializer

    # --- FIX: Add Server-Side Filtering ---
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by guest ID if provided in URL (e.g. ?guest=5)
        guest_id = self.request.query_params.get('guest')
        if guest_id:
            queryset = queryset.filter(guest=guest_id)
        return queryset

    def perform_create(self, serializer):
        # ... (keep your existing create logic unchanged) ...
        try:
            data = self.request.data
            room_type_id = data.get('room_type')
            check_in = data.get('check_in')
            check_out = data.get('check_out')
            
            if not all([room_type_id, check_in, check_out]):
                raise ValidationError("Room Type, Check-in, and Check-out are required.")

            room_type = RoomType.objects.get(pk=room_type_id)
            hotel = room_type.hotel
            
            occupied_room_ids = Booking.objects.filter(
                room__room_type=room_type,
                status__in=['CONFIRMED', 'CHECKED_IN'],
                check_in__lt=check_out, 
                check_out__gt=check_in
            ).values_list('room_id', flat=True)

            available_room = Room.objects.filter(room_type=room_type).exclude(id__in=occupied_room_ids).exclude(status='MAINTENANCE').first()

            if not available_room:
                raise ValidationError({"detail": "No specific rooms are available for these dates."})

            serializer.save(hotel=hotel, room=available_room)

            # Invoice logic (Keep existing)
            notes = data.get('special_requests', '')
            is_prepaid = 'PAYHERE' in notes.upper()
            invoice_status = 'PAID' if is_prepaid else 'UNPAID'
            
            invoice = Invoice.objects.create(
                booking=serializer.instance,
                amount=serializer.instance.total_price,
                status=invoice_status,
                due_date=serializer.instance.check_in
            )
            
            if is_prepaid:
                Payment.objects.create(
                    invoice=invoice,
                    amount=serializer.instance.total_price,
                    method='PAYHERE_SANDBOX'
                )

        except RoomType.DoesNotExist:
             raise ValidationError({"room_type": "Invalid Room Type selected."})
        except ValidationError as e:
             raise e
        except Exception as e:
             hotel = Hotel.objects.first()
             if hotel: serializer.save(hotel=hotel)
             else: raise ValidationError({"detail": f"System error: {str(e)}"})

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().prefetch_related('payments')
    serializer_class = InvoiceSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class HousekeepingTaskViewSet(viewsets.ModelViewSet):
    queryset = HousekeepingTask.objects.all().select_related('room', 'assigned_to')
    serializer_class = HousekeepingTaskSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    # --- ADD THIS FUNCTION ---
    def perform_create(self, serializer):
        user = self.request.user
        try:
            # Find the user's staff profile to get their hotel
            staff_profile = StaffProfile.objects.get(user=user)
            # Save the item, automatically adding the hotel
            serializer.save(hotel=staff_profile.hotel)
        except StaffProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Logged-in user is not associated with a hotel staff profile.')

class DiscountCouponViewSet(viewsets.ModelViewSet):
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer

    # --- FIX: Auto-assign the hotel from the logged-in admin ---
    def perform_create(self, serializer):
        user = self.request.user
        try:
            staff_profile = StaffProfile.objects.get(user=user)
            serializer.save(hotel=staff_profile.hotel)
        except StaffProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Logged-in user is not associated with a hotel staff profile.')

class PayrollEntryViewSet(viewsets.ModelViewSet):
    queryset = PayrollEntry.objects.all().order_by('-payment_date')
    serializer_class = PayrollEntrySerializer

    def get_queryset(self):
        """
        Optionally restricts the returned payroll entries to a given staff member,
        by filtering against a `staff_id` query parameter in the URL.
        """
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff_id')
        if staff_id is not None:
            queryset = queryset.filter(staff=staff_id)
        return queryset

    def perform_create(self, serializer):
        # Save the payroll record
        payroll_entry = serializer.save()
        
        # Automatically update the staff profile's last_payment_date
        staff_profile = payroll_entry.staff
        staff_profile.last_payment_date = payroll_entry.payment_date
        staff_profile.save()

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        role = 'GUEST'
        if user.is_superuser:
            role = 'SUPER_ADMIN'  # <--- THIS LINE IS CRITICAL
        else:
            try:
                profile = StaffProfile.objects.get(user=user)
                role = profile.role
            except StaffProfile.DoesNotExist:
                role = 'GUEST'

        # If there is a Guest linked to this user, include its id
        guest_obj = Guest.objects.filter(user=user).first()
        guest_id = guest_obj.id if guest_obj else None

        user_payload = {
            'id': user.pk,
            'username': user.username,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'is_superuser': user.is_superuser,
            'role': role,
            'guest_id': guest_id,
        }

        # Optionally include basic guest info to speed frontend setup
        if guest_obj:
            user_payload['guest'] = {
                'id': guest_obj.id,
                'name': guest_obj.name,
                'email': guest_obj.email,
                'phone': guest_obj.phone,
            }

        return Response({
            'token': token.key,
            'user': user_payload
        })
    
class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    
    def perform_create(self, serializer):
        # Auto-assign hotel
        try:
            serializer.save(hotel=Hotel.objects.first())
        except Exception:
            pass

class FoodOrderViewSet(viewsets.ModelViewSet):
    queryset = FoodOrder.objects.all().select_related('guest').order_by('-created_at')
    serializer_class = FoodOrderSerializer

    def perform_create(self, serializer):
        try:
            serializer.save(hotel=Hotel.objects.first())
        except Exception:
            pass

class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all().order_by('-created_at')
    serializer_class = BlogSerializer
    
    # Allow anyone to read, but only auth users to create/edit
    permission_classes = [IsAuthenticatedOrReadOnly] 

    def perform_create(self, serializer):
        # Auto-assign hotel
        try:
            serializer.save(hotel=Hotel.objects.first())
        except Exception:
            pass

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                user = User.objects.get(username=username)
                
                # Generate simple 4-digit code
                otp_code = str(random.randint(1000, 9999))
                
                # Update or Create the OTP record
                PasswordResetOTP.objects.update_or_create(
                    user=user,
                    defaults={'otp': otp_code}
                )
                
                return Response({
                    "message": "Reset code generated.",
                    "demo_token": otp_code,
                    "detail": f"Code generated for user: {username}"
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response({"detail": "Username not found."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                user = User.objects.get(username=username)
                
                try:
                    reset_record = PasswordResetOTP.objects.get(user=user)
                    if reset_record.otp == token:
                        user.set_password(new_password)
                        user.save()
                        reset_record.delete()
                        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
                    else:
                        return Response({"token": ["Invalid code."]}, status=status.HTTP_400_BAD_REQUEST)
                except PasswordResetOTP.DoesNotExist:
                    return Response({"token": ["No reset request found or code expired."]}, status=status.HTTP_400_BAD_REQUEST)
            
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                # FIX: Lookup by username
                user = User.objects.get(username=username)
                
                try:
                    reset_record = PasswordResetOTP.objects.get(user=user)
                    if reset_record.otp == token:
                        user.set_password(new_password)
                        user.save()
                        reset_record.delete()
                        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
                    else:
                        return Response({"token": ["Invalid code."]}, status=status.HTTP_400_BAD_REQUEST)
                except PasswordResetOTP.DoesNotExist:
                    return Response({"token": ["No reset request found or code expired."]}, status=status.HTTP_400_BAD_REQUEST)
            
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class EventBookingViewSet(viewsets.ModelViewSet):
    queryset = EventBooking.objects.all().select_related('guest').order_by('-created_at')
    serializer_class = EventBookingSerializer

    def get_queryset(self):
        """Allow filtering by guest ID for customer dashboard"""
        queryset = super().get_queryset()
        guest_id = self.request.query_params.get('guest')
        if guest_id:
            queryset = queryset.filter(guest=guest_id)
        return queryset

    def perform_create(self, serializer):
        try:
            serializer.save(hotel=Hotel.objects.first())
        except Exception:
            pass

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related('guest', 'room_type', 'room').order_by('-check_in')
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        try:
            data = self.request.data
            room_type_id = data.get('room_type')
            check_in = data.get('check_in')
            check_out = data.get('check_out')
            
            # 1. Find Hotel & Room
            room_type = RoomType.objects.get(pk=room_type_id)
            hotel = room_type.hotel
            
            # Simple room assignment logic
            occupied = Booking.objects.filter(
                room__room_type=room_type, status__in=['CONFIRMED', 'CHECKED_IN'],
                check_in__lt=check_out, check_out__gt=check_in
            ).values_list('room_id', flat=True)
            
            available_room = Room.objects.filter(room_type=room_type).exclude(id__in=occupied).first()
            
            # Save Booking
            booking = serializer.save(hotel=hotel, room=available_room)

            # 2. AUTOMATIC INVOICE GENERATION
            # Check if payment info suggests it was paid (e.g., PayHere)
            notes = data.get('special_requests', '')
            is_prepaid = 'PAYHERE' in notes.upper()
            
            invoice_status = 'PAID' if is_prepaid else 'UNPAID'
            
            invoice = Invoice.objects.create(
                booking=booking,
                amount=booking.total_price,
                status=invoice_status,
                due_date=booking.check_in # Due on arrival
            )
            
            if is_prepaid:
                Payment.objects.create(
                    invoice=invoice,
                    amount=booking.total_price,
                    method='PAYHERE_SANDBOX'
                )

        except Exception as e:
             # Fallback to save without extra logic if it fails
             hotel = Hotel.objects.first()
             if hotel: serializer.save(hotel=hotel)
             else: raise ValidationError({"detail": str(e)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payhere_hash(request):
    try:
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')
        currency = settings.PAYHERE_CURRENCY
        merchant_id = settings.PAYHERE_MERCHANT_ID
        merchant_secret = settings.PAYHERE_MERCHANT_SECRET

        # Ensure amount is formatted to 2 decimal places (e.g., "1000.00")
        amount_formatted = "{:.2f}".format(float(amount))

        # 1. Hash the Secret
        hashed_secret = hashlib.md5(merchant_secret.encode('utf-8')).hexdigest().upper()

        # 2. Create the String to Hash
        # Format: merchant_id + order_id + amount + currency + hashed_secret
        hash_string = f"{merchant_id}{order_id}{amount_formatted}{currency}{hashed_secret}"

        # 3. Generate Final Hash
        final_hash = hashlib.md5(hash_string.encode('utf-8')).hexdigest().upper()

        return Response({
            'hash': final_hash,
            'merchant_id': merchant_id,
            'currency': currency
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payhere_init(request):
    """
    Creates a pending invoice & returns everything frontend needs
    for PayHere form submission.
    """
    try:
        booking_id = request.data.get("booking_id")
        booking = Booking.objects.get(id=booking_id)

        amount = float(booking.total_price)
        order_id = f"BK-{booking.id}"

        merchant_id = settings.PAYHERE_MERCHANT_ID
        currency = settings.PAYHERE_CURRENCY
        merchant_secret = settings.PAYHERE_MERCHANT_SECRET

        # Format to 2 decimals
        amount_formatted = "{:.2f}".format(amount)

        # Step 1: Hash the merchant secret
        hashed_secret = hashlib.md5(merchant_secret.encode('utf-8')).hexdigest().upper()

        # Step 2: Create hash string
        hash_string = f"{merchant_id}{order_id}{amount_formatted}{currency}{hashed_secret}"

        # Step 3: Final hash
        final_hash = hashlib.md5(hash_string.encode('utf-8')).hexdigest().upper()

        return Response({
            "merchant_id": merchant_id,
            "order_id": order_id,
            "amount": amount_formatted,
            "currency": currency,
            "hash": final_hash,

            # Required by PayHere
            "return_url": settings.PAYHERE_RETURN_URL,
            "cancel_url": settings.PAYHERE_CANCEL_URL,
            "notify_url": settings.PAYHERE_NOTIFY_URL,

            # Customer details from booking
            "first_name": booking.guest.name,
            "last_name": "Guest",
            "email": booking.guest.email,
            "phone": booking.guest.phone,

        })

    except Booking.DoesNotExist:
        return Response({"error": "Invalid booking"}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])     # PayHere does not send authentication
def payhere_notify(request):
    """
    PayHere callback → validates payment → marks invoice & booking as paid
    """

    try:
        order_id = request.data.get("order_id")   # example: "BK-33"
        status_code = request.data.get("status_code")  # 2 = success
        payment_id = request.data.get("payment_id")
        paid_amount = float(request.data.get("payhere_amount"))

        # Extract booking ID
        booking_id = int(order_id.split("-")[1])
        booking = Booking.objects.get(id=booking_id)

        invoice = Invoice.objects.get(booking=booking)

        # Only mark success if status_code == 2
        if str(status_code) == "2":
            invoice.status = "PAID"
            invoice.save()

            Payment.objects.create(
                invoice=invoice,
                amount=paid_amount,
                method="PAYHERE",
                transaction_id=payment_id
            )

            booking.status = "CONFIRMED"
            booking.save()

            return Response("OK", status=200)

        else:
            invoice.status = "FAILED"
            invoice.save()
            return Response("FAILED", status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
def payhere_success(request):
    return Response({"message": "Payment successful!"})

@api_view(['GET'])
def payhere_cancel(request):
    return Response({"message": "Payment cancelled!"})


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        """
        Allow anyone to POST (submit message).
        Only Authenticated users (Admins) can GET (list) or PATCH (update status).
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


class PromoBannerViewSet(viewsets.ModelViewSet):
    queryset = PromoBanner.objects.all().order_by('-created_at')
    serializer_class = PromoBannerSerializer
    # Allow public to read (see banners), but only admin to write
    permission_classes = [IsAuthenticatedOrReadOnly] 
    
    def perform_create(self, serializer):
        try:
            serializer.save(hotel=Hotel.objects.first())
        except Exception:
            pass