from rest_framework import viewsets
from .models import UserWallet, UserFavoriteVehicle, Transaction, ParkingSession, LPRScan, Infraction
from .serializers import (
    UserWalletSerializer,
    UserFavoriteVehicleSerializer,
    TransactionSerializer,
    ParkingSessionSerializer,
    LPRScanSerializer,
    InfractionSerializer
)

class UserWalletViewSet(viewsets.ModelViewSet):
    queryset = UserWallet.objects.all()
    serializer_class = UserWalletSerializer

class UserFavoriteVehicleViewSet(viewsets.ModelViewSet):
    queryset = UserFavoriteVehicle.objects.all()
    serializer_class = UserFavoriteVehicleSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

class ParkingSessionViewSet(viewsets.ModelViewSet):
    queryset = ParkingSession.objects.all()
    serializer_class = ParkingSessionSerializer

class LPRScanViewSet(viewsets.ModelViewSet):
    queryset = LPRScan.objects.all()
    serializer_class = LPRScanSerializer

class InfractionViewSet(viewsets.ModelViewSet):
    queryset = Infraction.objects.all()
    serializer_class = InfractionSerializer
