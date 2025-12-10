from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Hotel, StaffProfile, Amenity, RoomType, Room,
    Guest, Booking, Invoice, Payment,EventBooking,
    HousekeepingTask, InventoryItem, DiscountCoupon,PayrollEntry,FoodItem, FoodOrder,Blog,ContactMessage,Hotel,PromoBanner
)

# --- Guest & Booking Serializers ---

class GuestSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Guest
        fields = ['id', 'user', 'name', 'email', 'phone', 'address','preferences']
        extra_kwargs = {
            'email': {'required': True}
        }

class BookingSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'hotel', 'guest', 'guest_name', 'room', 'room_type', 'room_type_name', # <-- ADDED 'hotel'
            'check_in', 'check_out', 'status', 'total_price', 'special_requests'
        ]
        
        # --- ADDED THIS ---
        # Make 'hotel' read-only. The backend will set this automatically.
        read_only_fields = ['hotel'] 
        
        # Make foreign keys read-only=False so they can be set via ID
        extra_kwargs = {
            'guest': {'required': True},
            'room_type': {'required': True},
        }

# --- Room Configuration Serializers ---

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon']

class RoomTypeSerializer(serializers.ModelSerializer):
    amenities = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Amenity.objects.all(),
        required=False
    )
    # To show amenity details in GET requests, you might want a separate serializer or method
    # But for creation (POST), PrimaryKeyRelatedField is standard.

    class Meta:
        model = RoomType
        fields = [
            'id', 'hotel', 'name', 'price_weekday', 
            'price_weekend', 'capacity', 'amenities', 
            'image' # <-- ADDED THIS
        ]
        read_only_fields = ['hotel']

class RoomSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    # --- ADD THIS to pass image to the Room list ---
    room_type_image = serializers.ImageField(source='room_type.image', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'room_type', 'room_type_name', 'room_type_image', # <-- ADDED IMAGE
            'room_number', 'floor', 'status'
        ]
        extra_kwargs = {
            'room_type': {'required': True},
        }

# --- Staff & Hotel Serializers ---

class UserSerializer(serializers.ModelSerializer):
    # Add password field explicitly
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def create(self, validated_data):
        # Use create_user to automatically hash the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class StaffProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    # Allow updating profile without re-sending user fields
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffProfile
        # IMPORTANT: 'salary' and 'pay_frequency' MUST be in this list
        fields = [
            'id', 'user', 'hotel', 'role', 'phone', 
            'job_title', 'department', 'status',
            'salary', 'pay_frequency', 'last_payment_date', 
            'first_name', 'last_name', 'email', 'password'
        ]
        read_only_fields = ['user', 'hotel', 'last_payment_date'] # Protect last_payment_date from manual edits

    def create(self, validated_data):
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        email = validated_data.pop('email', '')
        password = validated_data.pop('password', 'Welcome123!')
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        user.is_staff = True
        user.save()
        
        # We assume 'hotel' is added by the view
        staff_profile = StaffProfile.objects.create(user=user, **validated_data)
        return staff_profile
    
      



    def update(self, instance, validated_data):
        # Update User model
        user = instance.user
        if 'first_name' in validated_data:
            user.first_name = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            user.last_name = validated_data.pop('last_name')
        if 'email' in validated_data:
            user.email = validated_data.pop('email')
            user.username = user.email
        user.save()

        # Update StaffProfile model (salary, pay_frequency, etc.)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class HotelSerializer(serializers.ModelSerializer):
    # Show the admin's email (read-only)
    admin_email = serializers.EmailField(source='admin_user.email', read_only=True)

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'location', 'admin_user', 'admin_email',
            'logo_url', 'check_in_time', 'check_out_time',
            'default_currency', 'tax_rate', 'maintenance_mode',
            'contact_phone', 'contact_email', 'facebook_url', 'instagram_url', 'cancellation_policy'
        ]
        read_only_fields = ['admin_user']

# --- Housekeeping & Inventory Serializers ---

class HousekeepingTaskSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True, default=None)

    class Meta:
        model = HousekeepingTask
        fields = [
            'id', 'room', 'room_number', 'assigned_to', 
            'assigned_to_name', 'status', 'notes'
        ]

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = ['id', 'hotel', 'name', 'stock_level', 'low_stock_threshold']
        read_only_fields = ['hotel'] 
# --- Payment & Marketing Serializers ---

class PaymentSerializer(serializers.ModelSerializer):
    # Read-only fields to show context in the admin panel
    invoice_number = serializers.CharField(source='invoice.id', read_only=True)
    guest_name = serializers.CharField(source='invoice.booking.guest.name', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'invoice_number', 'guest_name', 'amount', 'payment_date', 'method', 'transaction_id', 'status']

class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'booking', 'amount', 'status', 'issued_date', 'due_date', 'payments']

class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = ['id', 'hotel', 'code', 'discount_percent', 'valid_from', 'valid_to', 'is_active']
        read_only_fields = ['hotel'] 

class PayrollEntrySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.first_name', read_only=True)
    
    class Meta:
        model = PayrollEntry
        fields = ['id', 'staff', 'staff_name', 'salary_amount', 'bonus_amount', 'payment_date']


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ['id', 'hotel', 'name', 'category', 'price', 'description', 'image', 'is_available']
        read_only_fields = ['hotel']

class FoodOrderSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.name', read_only=True)
    
    class Meta:
        model = FoodOrder
        fields = ['id', 'hotel', 'guest', 'guest_name', 'room_number', 'items_json', 'total_price', 'status', 'created_at']
        read_only_fields = ['hotel', 'created_at']

class BlogSerializer(serializers.ModelSerializer):
    # Format date for frontend
    created_at_formatted = serializers.DateTimeField(source='created_at', format="%b %d, %Y", read_only=True)

    class Meta:
        model = Blog
        fields = ['id', 'hotel', 'title', 'content', 'image', 'author', 'is_published', 'created_at', 'created_at_formatted']
        read_only_fields = ['hotel', 'created_at']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        # Add complexity checks here if needed
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value
    
class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=True) # Changed from email

class PasswordResetConfirmSerializer(serializers.Serializer):
    username = serializers.CharField(required=True) # Changed from email
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

class EventBookingSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.name', read_only=True)
    guest_email = serializers.CharField(source='guest.email', read_only=True)

    class Meta:
        model = EventBooking
        fields = [
            'id', 'hotel', 'guest', 'guest_name', 'guest_email',
            'event_type', 'start_date', 'end_date', 'attendees', 
            'budget_notes', 'special_requests', 'status', 'created_at'
        ]
        read_only_fields = ['hotel', 'created_at']

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'status', 'created_at']
        read_only_fields = ['created_at']


class PromoBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoBanner
        fields = ['id', 'hotel', 'title', 'message', 'link_text', 'link_url', 'style', 'is_active', 'created_at']
        read_only_fields = ['hotel', 'created_at']
