from django.contrib import admin
from .models import (
    Hotel, StaffProfile, Amenity, RoomType, Room,
    Guest, Booking, Invoice, Payment,
    HousekeepingTask, InventoryItem, DiscountCoupon
)

# Simple registrations
admin.site.register(Hotel)
admin.site.register(StaffProfile)
admin.site.register(Amenity)
admin.site.register(Guest)
admin.site.register(Invoice)
admin.site.register(Payment)
admin.site.register(InventoryItem)
admin.site.register(DiscountCoupon)

# More complex registrations
@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'hotel', 'price_weekday', 'capacity')
    filter_horizontal = ('amenities',)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'room_type', 'status', 'floor')
    list_filter = ('status', 'room_type')
    search_fields = ('room_number',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest', 'room_type', 'check_in', 'check_out', 'status')
    list_filter = ('status', 'hotel')
    search_fields = ('guest__name', 'guest__email')

@admin.register(HousekeepingTask)
class HousekeepingTaskAdmin(admin.ModelAdmin):
    list_display = ('room', 'assigned_to', 'status')
    list_filter = ('status',)
    autocomplete_fields = ['room', 'assigned_to']

