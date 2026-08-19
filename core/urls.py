from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserWalletViewSet,
    UserFavoriteVehicleViewSet,
    TransactionViewSet,
    ParkingSessionViewSet,
    LPRScanViewSet,
    InfractionViewSet,
    SystemRoleViewSet,
    ActaInfraccionViewSet,
    reports,
)

router = DefaultRouter()
router.register(r'wallets', UserWalletViewSet)
router.register(r'vehicles', UserFavoriteVehicleViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'sessions', ParkingSessionViewSet)
router.register(r'scans', LPRScanViewSet)
router.register(r'infractions', InfractionViewSet)
router.register(r'roles', SystemRoleViewSet)
router.register(r'actas', ActaInfraccionViewSet)

urlpatterns = [
    path('api/reports/', reports, name='reports'),
    path('api/', include(router.urls)),
]
