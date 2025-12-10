from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# --- 1. Authentication & Hotel Configuration ---

class Hotel(models.Model):
    name = models.CharField(max_length=255)
    location = models.TextField()
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="managed_hotels"
    )
    logo_url = models.URLField(max_length=1024, blank=True, null=True)
    check_in_time = models.TimeField(default='14:00:00')
    check_out_time = models.TimeField(default='11:00:00')
    
    # --- ADDED: Settings Fields ---
    default_currency = models.CharField(max_length=10, default='LKR')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    maintenance_mode = models.BooleanField(default=False)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    cancellation_policy = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class StaffProfile(models.Model):
    class RoleChoices(models.TextChoices):
        HOTEL_ADMIN = 'ADMIN', 'Hotel Admin'
        STAFF = 'STAFF', 'Staff'
        HOUSEKEEPER = 'HOUSEKEEPER', 'Housekeeper'

    # --- ADDED: Pay Frequency Choices ---
    class PayFrequencyChoices(models.TextChoices):
        MONTHLY = 'Monthly', 'Monthly'
        BI_WEEKLY = 'Bi-Weekly', 'Bi-Weekly'
        WEEKLY = 'Weekly', 'Weekly'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.STAFF)
    phone = models.CharField(max_length=20, blank=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    
    # --- ADDED: Salary Fields ---
    # This stores the employee's current base salary setting
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    # This stores how often they get paid
    pay_frequency = models.CharField(
        max_length=20, 
        choices=PayFrequencyChoices.choices, 
        default=PayFrequencyChoices.MONTHLY
    )
    # This tracks when they were last paid
    last_payment_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} @ {self.hotel.name}"
# --- 2. Room Configuration ---

class Amenity(models.Model):
    """
    Amenities that can be associated with RoomTypes (e.g., WiFi, Pool)
    """
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, null=True) # e.g., 'wifi'

    def __str__(self):
        return self.name

class RoomType(models.Model):
    """
    Categories of rooms (e.g., Deluxe, Standard, Suite)
    """
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="room_types")
    name = models.CharField(max_length=100)
    price_weekday = models.DecimalField(max_digits=10, decimal_places=2)
    price_weekend = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField(default=2)
    amenities = models.ManyToManyField(Amenity, blank=True)
    image = models.ImageField(upload_to='room_types/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.hotel.name})"

class Room(models.Model):
    """
    Individual rooms in the hotel.
    """
    class RoomStatus(models.TextChoices):
        CLEAN = 'CLEAN', 'Clean'
        DIRTY = 'DIRTY', 'Dirty'
        MAINTENANCE = 'MAINTENANCE', 'Out of Order'
        
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="rooms")
    room_number = models.CharField(max_length=10)
    floor = models.IntegerField()
    status = models.CharField(max_length=20, choices=RoomStatus.choices, default=RoomStatus.CLEAN)

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type.name})"

# --- 3. Booking & Guest Management ---

class Guest(models.Model):
    """
    Stores customer details for current and future bookings.
    """
    # Optional link to Django User for registered accounts
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guest_profile'
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, max_length=255)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True) 

    def __str__(self):
        return self.name

class Booking(models.Model):
    """
    The core reservation/booking record.
    """
    class BookingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        CHECKED_IN = 'CHECKED_IN', 'Checked-In'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked-Out'

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    guest = models.ForeignKey(Guest, on_delete=models.PROTECT)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True) # Can be assigned later
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT) # What they booked
    check_in = models.DateField()
    check_out = models.DateField()
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    special_requests = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Booking {self.id} for {self.guest.name}"

# --- 4. Payment & Billing ---

class Invoice(models.Model):
    """
    Generated invoice for a booking.
    """
    class InvoiceStatus(models.TextChoices):
        UNPAID = 'UNPAID', 'Unpaid'
        PAID = 'PAID', 'Paid'
        PARTIAL = 'PARTIAL', 'Partially Paid'

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="invoices")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID)
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()

class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CARD = 'CARD', 'Credit Card'
        CASH = 'CASH', 'Cash'
        TRANSFER = 'TRANSFER', 'Bank Transfer'
        PAYHERE = 'PAYHERE', 'PayHere' # Added PayHere
        PAYHERE_SANDBOX = 'PAYHERE_SANDBOX', 'PayHere Sandbox'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # New Field
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.COMPLETED)

    def __str__(self):
        return f"{self.method} - {self.amount}"
# --- 5. Housekeeping & Inventory ---

class HousekeepingTask(models.Model):
    """
    Tracks cleaning tasks for rooms.
    """
    class TaskStatus(models.TextChoices):
        # --- UPDATED: Matches Frontend Options ---
        DIRTY = 'DIRTY', 'Dirty'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        CLEAN = 'CLEAN', 'Clean'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'

    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True
    )
    # Default to DIRTY as that is what usually triggers a task
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.DIRTY)
    notes = models.TextField(blank=True, null=True)

class InventoryItem(models.Model):
    """
    Tracks stock of amenities, mini-bar items, etc.
    """
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    stock_level = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.name

# --- 7. Marketing ---

class DiscountCoupon(models.Model):
    """
    For managing promo codes.
    """
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code
    
class PayrollEntry(models.Model):
    """
    Records a specific salary payment transaction history.
    """
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='payroll_entries')
    # This is the amount paid in this specific transaction
    salary_amount = models.DecimalField(max_digits=10, decimal_places=2) 
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_date = models.DateField()
    
    def __str__(self):
        return f"{self.staff.user.first_name} - {self.payment_date}"
    
class FoodItem(models.Model):
    CATEGORY_CHOICES = [
        ('starters', 'Starters'),
        ('mains', 'Mains'),
        ('drinks', 'Beverages'),
        ('dessert', 'Desserts'),
    ]
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="food_items", null=True, blank=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='food/', blank=True, null=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class FoodOrder(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room_number = models.CharField(max_length=10)
    # Storing items as JSON for simplicity: [{"name": "Burger", "qty": 2, "price": 10}]
    items_json = models.JSONField() 
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.room_number}"

class Blog(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="blogs", null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    image = models.ImageField(upload_to='blogs/', blank=True, null=True)
    author = models.CharField(max_length=100, default="Admin")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class PasswordResetOTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6) # Stores "1234"
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.otp}"
    

class EventBooking(models.Model):
    EVENT_TYPES = [
        ('WEDDING', 'Wedding'),
        ('CONFERENCE', 'Conference'),
        ('PARTY', 'Private Party'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE)
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    attendees = models.PositiveIntegerField()
    budget_notes = models.CharField(max_length=100, blank=True, null=True) # e.g. "High", "Medium", or "$5000"
    special_requests = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.guest.name}"

class ContactMessage(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONTACTED', 'Contacted'),
        ('RESOLVED', 'Resolved'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.name}"

    
class PromoBanner(models.Model):
    STYLE_CHOICES = [
        ('info', 'Blue (Info)'),
        ('success', 'Green (Success)'),
        ('warning', 'Orange (Warning)'),
        ('error', 'Red (Alert)'),
    ]
    
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="banners", null=True, blank=True)
    title = models.CharField(max_length=100, help_text="Internal name")
    message = models.CharField(max_length=255, help_text="Text shown to customer")
    link_text = models.CharField(max_length=50, blank=True, null=True)
    link_url = models.CharField(max_length=200, blank=True, null=True)
    style = models.CharField(max_length=20, choices=STYLE_CHOICES, default='info')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title