from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response

from .models import Booking, Guest, Room, Invoice


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    data = {
        "total_bookings": Booking.objects.count(),
        "total_customers": Guest.objects.count(),
        "total_rooms": Room.objects.count(),
        "revenue": Invoice.objects.aggregate(total=models.Sum("amount"))["total"] or 0
    }
    return Response(data)
