from .views_dashboard import dashboard_summary
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from Hotel.views import payhere_init, payhere_notify, payhere_success, payhere_cancel

from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'hotels', views.HotelViewSet)
router.register(r'users', views.UserViewSet) # For staff assignment
router.register(r'staff', views.StaffProfileViewSet)
router.register(r'amenities', views.AmenityViewSet)
router.register(r'room-types', views.RoomTypeViewSet)
router.register(r'rooms', views.RoomViewSet)
router.register(r'guests', views.GuestViewSet)
router.register(r'bookings', views.BookingViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'housekeeping', views.HousekeepingTaskViewSet)
router.register(r'inventory', views.InventoryItemViewSet)
router.register(r'coupons', views.DiscountCouponViewSet)
router.register(r'payroll', views.PayrollEntryViewSet) 
router.register(r'food-items', views.FoodItemViewSet)
router.register(r'food-orders', views.FoodOrderViewSet)
router.register(r'blogs', views.BlogViewSet) 
router.register(r'event-bookings', views.EventBookingViewSet)
router.register(r'contact-messages', views.ContactMessageViewSet) # <--- ADD THIS
router.register(r'promo-banners', views.PromoBannerViewSet) # <--- REGISTER THIS

# The API URLs are now determined automatically by the router.
# This one line creates all the URLs for list, create, detail, update, etc.
urlpatterns = [
    path('dashboard/', dashboard_summary, name='dashboard'),
    path('login/', views.CustomAuthToken.as_view(), name='api_token_auth'), 
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('request-reset/', views.PasswordResetRequestView.as_view(), name='request-reset'),
    path('confirm-reset/', views.PasswordResetConfirmView.as_view(), name='confirm-reset'),
    
    # --- FIX: REMOVE 'api/' PREFIX FROM THESE LINES ---
    path('payhere/init/', views.payhere_init, name='payhere_init'),
    path('payhere/notify/', views.payhere_notify, name='payhere_notify'),
    path('payhere/success/', views.payhere_success, name='payhere_success'), # Added trailing slash
    path('payhere/cancel/', views.payhere_cancel, name='payhere_cancel'),   # Added trailing slash
    
    # Hash generation
    path('payhere-hash/', views.generate_payhere_hash, name='payhere_hash'),

    path('', include(router.urls)),

]