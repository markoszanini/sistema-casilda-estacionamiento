from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserWalletViewSet,
    UserFavoriteVehicleViewSet,
    TransactionViewSet,
    ParkingSessionViewSet,
    LPRScanViewSet,
    InfractionViewSet
)

router = DefaultRouter()
router.register(r'wallets', UserWalletViewSet)
router.register(r'vehicles', UserFavoriteVehicleViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'sessions', ParkingSessionViewSet)
router.register(r'scans', LPRScanViewSet)
router.register(r'infractions', InfractionViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
