from rest_framework import serializers
from .models import (
    UserWallet,
    UserFavoriteVehicle,
    Transaction,
    ParkingSession,
    LPRScan,
    Infraction,
    SystemRole,
    ActaInfraccion,
)

class UserWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWallet
        fields = '__all__'

class UserFavoriteVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFavoriteVehicle
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class ParkingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSession
        fields = '__all__'

class LPRScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = LPRScan
        fields = '__all__'

class InfractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Infraction
        fields = '__all__'

class SystemRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemRole
        fields = '__all__'


class ActaInfraccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActaInfraccion
        fields = '__all__'
